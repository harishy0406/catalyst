import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Badge, Button, Cell, Icon, Metric, Panel, ProgressBar, Row, Screen, Spec, Txt } from '@/components';
import { api, ApiAnomaly, ApiTelemetry } from '@/api/client';
import { anomalyLabel, anomalyRequest, FleetMachine, fleetMachine, Scenario } from '@/data/machines';
import { useApp } from '@/state/AppState';
import { colors, space } from '@/theme/tokens';

const POLL_MS = 10_000;
/** If the model hasn't answered by then, show a demo result so the panel never sits on a spinner. */
const FALLBACK_MS = 3_500;

/** Same rule the backend uses to grade ML alerts (routers/telemetry.py). */
const isCritical = (prediction: string) => /Overheating|Stress/.test(prediction);

/** Backend's own ML entry in /insights is computed from out-of-range defaults; the AI panel replaces it. */
const BACKEND_ML_COMPONENT = 'AI Predictive Fleet Diagnostics';

const hhmm = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--';

/** Stand-in result for demos: Normal on the live feed, or the chosen scenario's class. A real response replaces it. */
function demoAnomaly(m: FleetMachine, sc: Scenario | null): ApiAnomaly {
  const prediction = sc ? sc.label : 'Normal';
  const other = m.scenarios.find((s) => s.id !== sc?.id)?.label ?? 'Idle';
  return {
    machineType: m.anomalyModel,
    machineId: m.id,
    isAnomaly: !!sc,
    prediction,
    message: sc
      ? `Sensor profile matches the ${sc.label.toLowerCase()} pattern for this ${m.kind.toLowerCase()}.`
      : `All monitored sensors are within the normal operating range for this ${m.kind.toLowerCase()}.`,
    recommendedAction: sc
      ? 'Reduce load, finish the current cycle safely and notify your supervisor for an inspection.'
      : 'Continue normal operation.',
    confidence: sc ? 0.87 : 0.94,
    confidencePercent: sc ? 87 : 94,
    classProbabilities: sc
      ? { [prediction]: 0.87, Normal: 0.08, [other]: 0.05 }
      : { Normal: 0.94, [other]: 0.04, Idle: 0.02 },
    timestamp: new Date().toISOString(),
  };
}

/** Screen 9 — Machine Status (stitch: screen_9_machine_status): the operator's assigned machine + ML anomaly detection. */
export default function MachineStatus() {
  const { alertActive, machine, operatorId } = useApp();
  // Only the machine the supervisor bound to this operator is shown
  const fm = machine.assigned ? fleetMachine(machine.id) : undefined;
  const insights = machine.insights;

  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [live, setLive] = useState<ApiTelemetry | null>(null);
  const [anomaly, setAnomaly] = useState<ApiAnomaly | null>(null);
  const [loading, setLoading] = useState(false);
  const [demo, setDemo] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const reqId = useRef(0);

  /** Latest telemetry → per-type Random Forest. Stale responses (after switching machine) are dropped. */
  const diagnose = useCallback(
    async (m: FleetMachine, sc: Scenario | null, quiet = false) => {
      const id = ++reqId.current;
      if (!quiet) setLoading(true);
      // Background polls never replace a real result with demo data
      const showDemo = () => {
        setAnomaly((a) => (quiet && a ? a : demoAnomaly(m, sc)));
        setDemo((d) => (quiet ? d : true));
        setLoading(false);
      };
      const fallback = setTimeout(() => id === reqId.current && showDemo(), FALLBACK_MS);
      try {
        // Scenarios don't use live data, so they skip the DB round-trip
        const tel = sc ? null : (await api.telemetry(m.id)).telemetry;
        const res = await api.detectAnomaly(m.anomalyModel, anomalyRequest(m, { operatorId, live: tel, scenario: sc }));
        if (id !== reqId.current) return;
        if (!sc) setLive(tel);
        setAnomaly(res);
        setDemo(false);
      } catch {
        if (id === reqId.current) showDemo();
      } finally {
        clearTimeout(fallback);
        if (id === reqId.current) setLoading(false);
      }
    },
    [operatorId],
  );

  // Run on focus / machine / scenario change; keep polling while showing live telemetry
  useFocusEffect(
    useCallback(() => {
      if (!fm) return;
      diagnose(fm, scenario);
      if (scenario) return;
      const t = setInterval(() => diagnose(fm, null, true), POLL_MS);
      return () => clearInterval(t);
    }, [diagnose, fm, scenario]),
  );

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

  if (!fm) {
    return (
      <Screen header={{ subtitle: 'No machine assigned', alert: alertActive }}>
        <Txt v="headlineLg">Machine Status</Txt>
        <Panel title="No machine assigned" icon="precision_manufacturing">
          <Txt v="bodyMd">
            {machine.assigned
              ? `${machine.id} is not an excavator, bulldozer or wheel loader, so AI diagnostics aren't available for it.`
              : 'Your supervisor has not assigned you a machine yet. Ask them to bind one to your operator ID.'}
          </Txt>
        </Panel>
      </Screen>
    );
  }

  const details = machine.details;
  const inMaintenance = details?.status === 'maintenance';

  return (
    <Screen header={{ subtitle: machine.model, alert: alertActive }}>
      {/* Title */}
      <View style={{ gap: 4 }}>
        <Txt v="headlineLg">My Machine</Txt>
        <Txt v="labelSm" color={colors.onSurfaceVariant}>
          Assigned by your supervisor • AI anomaly detection
        </Txt>
      </View>

      {/* Hero */}
      <Panel borderColor={colors.primaryContainer}>
        <View
          style={{
            backgroundColor: colors.surfaceLowest,
            borderWidth: 1,
            borderColor: colors.surfaceHighest,
            padding: space.sm,
          }}
        >
          <Image source={fm.image} style={{ width: '100%', height: 180 }} contentFit="contain" accessibilityLabel={fm.model} />
        </View>
        <View style={{ gap: 4 }}>
          <Txt v="headlineMd">{machine.model}</Txt>
          <Txt v="labelSm" color={colors.onSurfaceVariant}>
            {fm.id} • {fm.kind}
            {details ? ` • ${machine.engineHours} H` : ''}
          </Txt>
        </View>
        <Row style={{ flexWrap: 'wrap' }} gap={6}>
          <Badge label={inMaintenance ? 'In maintenance' : 'Active'} tone={inMaintenance ? 'danger' : 'safe'} />
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
        right={demo ? 'Demo data' : scenario ? `Simulated: ${scenario.label}` : 'Live telemetry'}
        rightColor={scenario ? colors.primaryContainer : colors.tertiaryContainer}
      >
        {anomaly ? (
          <AnomalyResult a={anomaly} />
        ) : (
          <Cell debossed>
            <Txt v="bodyMd" color={colors.onSurfaceVariant}>
              {loading ? 'Running diagnostic…' : 'No result yet.'}
            </Txt>
          </Cell>
        )}
        <Txt v="labelXs" color={colors.onSurfaceVariant}>
          Random Forest • {fm.kind} model • {anomaly ? `Scored ${hhmm(anomaly.timestamp)}` : '--'}
        </Txt>
        <Button
          label={loading ? 'Analysing' : 'Re-run Diagnostic'}
          icon="refresh"
          variant="secondary"
          loading={loading}
          onPress={() => diagnose(fm, scenario)}
        />
      </Panel>

      {/* Test scenarios */}
      <Panel title="Diagnostic Test Scenarios" icon="science" right={`${fm.scenarios.length} profiles`}>
        <Txt v="bodySm" color={colors.onSurfaceVariant}>
          Score a simulated sensor profile with the {fm.kind.toLowerCase()} model instead of the live feed. Nothing is written to the
          machine&apos;s telemetry.
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          <ScenarioChip label="Live" icon="sensors" active={!scenario} onPress={() => setScenario(null)} />
          {fm.scenarios.map((s) => (
            <ScenarioChip key={s.id} label={s.label} icon={s.icon} active={scenario?.id === s.id} onPress={() => setScenario(s)} />
          ))}
        </View>
      </Panel>

      {/* Live telemetry */}
      <Panel
        title="Live Telemetry"
        icon="cell_tower"
        right={tel ? `Updated ${hhmm(tel.recordedAt)}` : 'No feed'}
        rightColor={tel ? colors.tertiaryContainer : colors.onSurfaceVariant}
      >
        {tel ? (
          <>
            <Row>
              <Spec label="Engine RPM" value={fmt(tel.engineRpm, 0)} />
              <Spec
                label="Engine Temp"
                value={fmt(tel.engineTemp)}
                unit="°C"
                valueColor={(tel.engineTemp ?? 0) > 100 ? colors.secondary : colors.onSurface}
              />
            </Row>
            <Row>
              <Spec
                label="Hydraulics"
                value={fmt(tel.hydraulicPressure, 0)}
                unit="BAR"
                valueColor={(tel.hydraulicPressure ?? 0) > 320 ? colors.secondary : colors.onSurface}
              />
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
              <Icon
                name={a.warn ? 'warning' : 'check_circle'}
                size={22}
                color={a.warn ? colors.onPrimaryContainer : colors.tertiaryContainer}
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  gap: 6,
                }}
              >
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
                <Button
                  label="Dismiss"
                  variant="secondary"
                  size="sm"
                  style={{ marginTop: 6 }}
                  onPress={() => setDismissed((d) => [...d, a.id])}
                />
              )}
            </View>
          </View>
        ))}
      </Panel>

      {/* Shift metrics */}
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
            <Metric
              label="Idle Time"
              icon="hourglass_empty"
              value={String(machine.idleMin)}
              valueColor={colors.primaryContainer}
              unit="MIN"
              size="md"
            />
          </View>
        </Row>
      </Panel>

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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md - 4,
          padding: space.md - 4,
          borderWidth: 2,
          borderColor: tone,
          backgroundColor: colors.surfaceLowest,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: tone,
          }}
        >
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
