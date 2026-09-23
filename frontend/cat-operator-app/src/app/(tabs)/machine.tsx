import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Badge, Button, Cell, Icon, Metric, Panel, Pip, ProgressBar, Row, Screen, Spec, Txt } from '@/components';
import { api, ApiAnomaly, ApiInsights, ApiTelemetry } from '@/api/client';
import { anomalyLabel, anomalyRequest, FLEET, FleetMachine, fleetMachine, Scenario } from '@/data/machines';
import { useApp } from '@/state/AppState';
import { border, colors, space } from '@/theme/tokens';

const POLL_MS = 10_000;

/** Same rule the backend uses to grade ML alerts (routers/telemetry.py). */
const isCritical = (prediction: string) => /Overheating|Stress/.test(prediction);

/** Backend's own ML entry in /insights is computed from out-of-range defaults; the AI panel replaces it. */
const BACKEND_ML_COMPONENT = 'AI Predictive Fleet Diagnostics';

const hhmm = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--';

/** Screen 9 — Machine Status (stitch: screen_9_machine_status) + fleet view and ML anomaly detection. */
export default function MachineStatus() {
  const { alertActive, machine, operatorId } = useApp();
  const ownId = FLEET.some((m) => m.id === machine.id) ? machine.id : FLEET[0].id;
  const [selectedId, setSelectedId] = useState(ownId);
  const fm = fleetMachine(selectedId);
  const isOwn = fm.id === ownId;

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [fleetInsights, setFleetInsights] = useState<ApiInsights | null>(null);
  const [live, setLive] = useState<ApiTelemetry | null>(null);
  const [anomaly, setAnomaly] = useState<ApiAnomaly | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const reqId = useRef(0);
  const insightsId = useRef(0);
  // AppState already polls insights for the operator's own machine; other units are fetched here
  const insights = isOwn ? machine.insights : fleetInsights;

  /** Latest telemetry → per-type Random Forest. Stale responses (after switching machine) are dropped. */
  const diagnose = useCallback(
    async (m: FleetMachine, sc: Scenario | null, quiet = false) => {
      const id = ++reqId.current;
      if (!quiet) setLoading(true);
      try {
        // Scenarios don't use live data, so they skip the DB round-trip
        const tel = sc ? null : (await api.telemetry(m.id)).telemetry;
        const res = await api.detectAnomaly(m.anomalyModel, anomalyRequest(m, { operatorId, live: tel, scenario: sc }));
        if (id !== reqId.current) return;
        if (!sc) setLive(tel);
        setAnomaly(res);
        setError(null);
      } catch (e) {
        if (id === reqId.current) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    [operatorId],
  );

  const loadFleetInsights = useCallback(async (m: FleetMachine) => {
    const id = ++insightsId.current;
    const ins = await api.insights(m.id).catch(() => null);
    if (id === insightsId.current) setFleetInsights(ins);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isOwn) return;
      loadFleetInsights(fm);
      const t = setInterval(() => loadFleetInsights(fm), POLL_MS);
      return () => clearInterval(t);
    }, [isOwn, fm, loadFleetInsights]),
  );

  // Run on focus / machine / scenario change; keep polling while showing live telemetry
  useFocusEffect(
    useCallback(() => {
      diagnose(fm, scenario);
      if (scenario) return;
      const t = setInterval(() => diagnose(fm, null, true), POLL_MS);
      return () => clearInterval(t);
    }, [diagnose, fm, scenario]),
  );

  const selectMachine = (id: string) => {
    if (id === selectedId) return;
    setSelectedId(id);
    setScenario(null);
    setFleetInsights(null);
    setLive(null);
    setAnomaly(null);
    setDismissed([]);
  };

  const tel = live ?? insights?.lastTelemetry;
  const advisories = [
    ...(insights?.anomalies ?? [])
      .filter((a) => a.component !== BACKEND_ML_COMPONENT)
      .map((a, i) => ({
        id: `anomaly-${i}`,
        warn: true,
        title: `${a.component} • ${a.metric}`,
        when: a.severity.toUpperCase(),
        body: a.description,
        foot: `Reading: ${a.value}`,
      })),
    ...(insights?.recommendations ?? [])
      .filter((r) => !anomaly || r.action !== anomaly.recommendedAction)
      .map((r, i) => ({
        id: `rec-${i}`,
        warn: r.priority !== 'low',
        title: r.action,
        when: `${r.priority.toUpperCase()} priority`,
        body: r.reason,
        foot: undefined as string | undefined,
      })),
  ].filter((a) => !dismissed.includes(a.id));

  return (
    <Screen header={{ subtitle: fm.model, alert: alertActive }}>
      {/* Title */}
      <View style={{ gap: 4 }}>
        <Txt v="headlineLg">Machine Status</Txt>
        <Txt v="labelSm" color={colors.onSurfaceVariant}>
          Fleet diagnostics • AI anomaly detection
        </Txt>
      </View>

      {/* Fleet selector */}
      <Row>
        {FLEET.map((m) => (
          <FleetCard key={m.id} m={m} selected={m.id === selectedId} own={m.id === ownId} onPress={() => selectMachine(m.id)} />
        ))}
      </Row>

      {/* Hero */}
      <Panel borderColor={colors.primaryContainer}>
        <View style={{ backgroundColor: colors.surfaceLowest, borderWidth: 1, borderColor: colors.surfaceHighest, padding: space.sm }}>
          <Image source={fm.image} style={{ width: '100%', height: 180 }} contentFit="contain" accessibilityLabel={fm.model} />
        </View>
        <View style={{ gap: 4 }}>
          <Txt v="headlineMd">{fm.model}</Txt>
          <Txt v="labelSm" color={colors.onSurfaceVariant}>
            {fm.id} • {fm.kind}
          </Txt>
        </View>
        <Row style={{ flexWrap: 'wrap' }} gap={6}>
          <Badge label={isOwn ? 'Your machine' : 'Fleet unit'} tone={isOwn ? 'primary' : 'neutral'} />
          {insights && (
            <Badge label={`Health: ${insights.healthScore}%`} tone={insights.healthScore >= 85 ? 'outlineSafe' : 'outlineDanger'} />
          )}
          {anomaly && (
            <Badge
              label={anomaly.isAnomaly ? 'AI: Anomaly' : 'AI: Normal'}
              icon={anomaly.isAnomaly ? 'warning' : 'check_circle'}
              tone={anomaly.isAnomaly ? 'outlineDanger' : 'outlineSafe'}
            />
          )}
        </Row>
      </Panel>

      {/* AI anomaly detection */}
      <Panel
        title="AI Anomaly Detection"
        icon="psychology"
        right={scenario ? `Simulated: ${scenario.label}` : 'Live telemetry'}
        rightColor={scenario ? colors.primaryContainer : colors.tertiaryContainer}
      >
        {anomaly ? <AnomalyResult a={anomaly} /> : (
          <Cell debossed>
            <Txt v="bodyMd" color={colors.onSurfaceVariant}>
              {loading ? 'Running diagnostic…' : error ? 'Diagnostic unavailable.' : 'No result yet.'}
            </Txt>
          </Cell>
        )}
        {error && (
          <Txt v="labelSm" color={colors.secondary}>
            {error}
          </Txt>
        )}
        <Txt v="labelXs" color={colors.onSurfaceVariant}>
          Random Forest • {fm.kind} model • {anomaly ? `Scored ${hhmm(anomaly.timestamp)}` : '--'}
        </Txt>
        <Button label={loading ? 'Analysing' : 'Re-run Diagnostic'} icon="refresh" variant="secondary" loading={loading} onPress={() => diagnose(fm, scenario)} />
      </Panel>

      {/* Test scenarios */}
      <Panel title="Diagnostic Test Scenarios" icon="science" right={`${fm.scenarios.length} profiles`}>
        <Txt v="bodySm" color={colors.onSurfaceVariant}>
          Score a simulated sensor profile with the {fm.kind.toLowerCase()} model instead of the live feed. Nothing is written to the machine&apos;s telemetry.
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          <ScenarioChip label="Live" icon="sensors" active={!scenario} onPress={() => setScenario(null)} />
          {fm.scenarios.map((s) => (
            <ScenarioChip key={s.id} label={s.label} icon={s.icon} active={scenario?.id === s.id} onPress={() => setScenario(s)} />
          ))}
        </View>
      </Panel>

      {/* Live telemetry */}
      <Panel title="Live Telemetry" icon="cell_tower" right={tel ? `Updated ${hhmm(tel.recordedAt)}` : 'No feed'} rightColor={tel ? colors.tertiaryContainer : colors.onSurfaceVariant}>
        {tel ? (
          <>
            <Row>
              <Spec label="Engine RPM" value={fmt(tel.engineRpm, 0)} />
              <Spec label="Engine Temp" value={fmt(tel.engineTemp)} unit="°C" valueColor={(tel.engineTemp ?? 0) > 100 ? colors.secondary : colors.onSurface} />
            </Row>
            <Row>
              <Spec label="Hydraulics" value={fmt(tel.hydraulicPressure, 0)} unit="BAR" valueColor={(tel.hydraulicPressure ?? 0) > 320 ? colors.secondary : colors.onSurface} />
              <Spec label="Fuel Rate" value={fmt(tel.fuelRate)} unit="L/H" />
            </Row>
            <Spec label="Ground Speed" value={fmt(tel.speed)} unit="KM/H" style={{ flex: 0 }} />
          </>
        ) : (
          <Txt v="bodySm" color={colors.onSurfaceVariant}>
            No telemetry received for {fm.id} yet. The AI model is scoring the machine&apos;s standard operating profile.
          </Txt>
        )}
      </Panel>

      {/* Advisories */}
      <Panel title="Machine Insights & Advisories" right={`Active: ${advisories.length}`}>
        {advisories.length === 0 && (
          <Txt v="bodySm" color={colors.onSurfaceVariant}>
            {insights ? 'No open advisories.' : 'Waiting for machine insights…'}
          </Txt>
        )}
        {advisories.map((a) => (
          <View
            key={a.id}
            style={{
              flexDirection: 'row',
              gap: space.md - 4,
              padding: space.md - 4,
              backgroundColor: colors.surfaceLowest,
              borderWidth: 2,
              borderColor: a.warn ? colors.primaryContainer : colors.tertiaryContainer,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: a.warn ? colors.primaryContainer : colors.surfaceHigh,
                borderWidth: a.warn ? 0 : 1.5,
                borderColor: colors.tertiaryContainer,
              }}
            >
              <Icon name={a.warn ? 'warning' : 'check_circle'} size={22} color={a.warn ? colors.onPrimaryContainer : colors.tertiaryContainer} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
                <Txt v="labelSm" color={a.warn ? colors.primaryContainer : colors.tertiaryContainer} style={{ flex: 1 }}>
                  {a.title}
                </Txt>
                <Txt v="labelXs" color={colors.onSurfaceVariant}>
                  {a.when}
                </Txt>
              </View>
              <Txt v="bodyMd">{a.body}</Txt>
              {a.foot && (
                <Txt v="labelXs" color={colors.onSurfaceVariant}>
                  {a.foot}
                </Txt>
              )}
              {a.warn && (
                <Button label="Dismiss" variant="secondary" size="sm" style={{ marginTop: 6 }} onPress={() => setDismissed((d) => [...d, a.id])} />
              )}
            </View>
          </View>
        ))}
      </Panel>

      {/* Shift metrics (operator's own machine only) */}
      {isOwn && (
        <Panel title="Key Operational Metrics" right="This shift" iconColor={colors.primaryContainer}>
          <Row>
            <View style={{ flex: 1 }}>
              <Metric label="Engine Hours" icon="timer" value={machine.engineHours} unit="H" size="md" />
            </View>
            <View style={{ flex: 1 }}>
              <Metric label="Fuel" icon="local_gas_station" value={String(machine.fuelPct)} unit="%" size="md" />
            </View>
          </Row>
          <Row>
            <View style={{ flex: 1 }}>
              <Metric label="Load Cycles" icon="sync" value={String(machine.loadCycles)} unit={`/ ${machine.cycleGoal}`} size="md" />
            </View>
            <View style={{ flex: 1 }}>
              <Metric label="Idle Time" icon="hourglass_empty" value={String(machine.idleMin)} valueColor={colors.primaryContainer} unit="MIN" size="md" />
            </View>
          </Row>
        </Panel>
      )}

      {/* Manual log */}
      <Cell style={{ gap: space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Icon name="build" size={20} color={colors.primaryContainer} />
          <Txt v="labelMd" style={{ flex: 1 }}>
            Manual Log Entry
          </Txt>
          <Button
            label="+ Add Machine Note"
            variant="secondary"
            size="sm"
            onPress={() =>
              setNotes((n) => [
                `${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} • ${fm.id} walkaround note logged`,
                ...n,
              ])
            }
          />
        </View>
        {notes.map((n) => (
          <Txt key={n} v="labelSm" color={colors.onSurfaceVariant}>
            {n}
          </Txt>
        ))}
      </Cell>
    </Screen>
  );
}

const fmt = (v: number | null | undefined, digits = 1) => (v == null ? '--' : v.toFixed(digits));

function FleetCard({ m, selected, own, onPress }: { m: FleetMachine; selected: boolean; own: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={`${m.kind} ${m.id}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        gap: 4,
        padding: space.sm,
        minHeight: 110,
        backgroundColor: pressed ? colors.surfaceHigh : selected ? colors.surfaceHigh : colors.surfaceLow,
        borderWidth: selected ? 2 : border.panel,
        borderColor: selected ? colors.primaryContainer : colors.surfaceHighest,
      })}
    >
      <Image source={m.image} style={{ width: '100%', height: 48 }} contentFit="contain" />
      <Txt v="labelSm" color={selected ? colors.primaryContainer : colors.onSurface} numberOfLines={1}>
        {m.kind}
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {own && <Pip size={6} color={colors.tertiaryContainer} />}
        <Txt v="labelXs" color={colors.onSurfaceVariant} numberOfLines={1} style={{ flexShrink: 1 }}>
          {m.id}
        </Txt>
      </View>
    </Pressable>
  );
}

function ScenarioChip({ label, icon, active, onPress }: { label: string; icon: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Scenario: ${label}`}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        minHeight: 44,
        paddingHorizontal: space.md - 4,
        backgroundColor: active ? colors.primaryContainer : pressed ? colors.surfaceHighest : colors.surfaceHigh,
        borderWidth: 1,
        borderColor: active ? colors.primaryContainer : colors.outlineVariant,
      })}
    >
      <Icon name={icon} size={18} color={active ? colors.onPrimaryContainer : colors.primaryContainer} />
      <Txt v="labelMd" color={active ? colors.onPrimaryContainer : colors.onSurface}>
        {label}
      </Txt>
    </Pressable>
  );
}

function AnomalyResult({ a }: { a: ApiAnomaly }) {
  const tone = !a.isAnomaly ? colors.tertiaryContainer : isCritical(a.prediction) ? colors.danger : colors.primaryContainer;
  const probs = Object.entries(a.classProbabilities)
    .sort(([, x], [, y]) => y - x)
    .slice(0, 4);
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md - 4, padding: space.md - 4, borderWidth: 2, borderColor: tone, backgroundColor: colors.surfaceLowest }}>
        <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: tone }}>
          <Icon name={a.isAnomaly ? 'warning' : 'verified'} size={28} color={a.isAnomaly ? colors.hazardBlack : colors.onTertiary} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt v="labelXs" color={colors.onSurfaceVariant}>
            {a.isAnomaly ? (isCritical(a.prediction) ? 'Critical anomaly' : 'Anomaly detected') : 'Status'}
          </Txt>
          <Txt v="headlineMd" color={tone}>
            {a.isAnomaly ? anomalyLabel(a.prediction) : 'Normal Operation'}
          </Txt>
          <Txt v="labelSm" color={colors.onSurface}>
            {a.confidencePercent}% confidence
          </Txt>
        </View>
      </View>
      <Txt v="bodyMd">{a.message}</Txt>
      <Cell debossed style={{ flexDirection: 'row', gap: space.sm }}>
        <Icon name={a.isAnomaly ? 'build' : 'check_circle'} size={18} color={tone} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt v="labelXs" color={colors.onSurfaceVariant}>
            Recommended action
          </Txt>
          <Txt v="bodySm">{a.recommendedAction}</Txt>
        </View>
      </Cell>
      <View style={{ gap: 8 }}>
        <Txt v="labelXs" color={colors.onSurfaceVariant}>
          Class probabilities
        </Txt>
        {probs.map(([cls, p]) => (
          <View key={cls} style={{ gap: 3 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt v="labelSm" color={cls === a.prediction ? tone : colors.onSurfaceVariant}>
                {anomalyLabel(cls)}
              </Txt>
              <Txt v="labelSm" color={cls === a.prediction ? tone : colors.onSurfaceVariant}>
                {(p * 100).toFixed(1)}%
              </Txt>
            </View>
            <ProgressBar value={p} color={cls === a.prediction ? tone : colors.outline} />
          </View>
        ))}
      </View>
    </>
  );
}
