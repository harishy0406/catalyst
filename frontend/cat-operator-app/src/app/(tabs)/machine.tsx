import { useState } from 'react';
import { View } from 'react-native';

import { Badge, Button, Cell, Icon, Metric, Panel, Pip, ProgressBar, Row, Screen, Txt } from '@/components';
import { machine } from '@/data/mock';
import { useApp } from '@/state/AppState';
import { colors, space } from '@/theme/tokens';

type Advisory = {
  id: string;
  tone: 'warn' | 'ok';
  title: string;
  when: string;
  body: string;
  foot?: string;
};

const ADVISORIES: Advisory[] = [
  {
    id: 'idle',
    tone: 'warn',
    title: 'Cautionary Telematics Advisory',
    when: '12M AGO',
    body: 'Idle time is higher than your recent average (+12%). Consider auto-shutoff if staged longer than 5 mins.',
  },
  {
    id: 'fuel',
    tone: 'ok',
    title: 'Efficiency Nominal',
    when: 'Continuous',
    body: 'Fuel consumption is normal (18.4 L/h average under load).',
    foot: 'Target range: 16.0 - 21.0 L/h • Eco-mode assist engaged',
  },
  {
    id: 'prod',
    tone: 'ok',
    title: 'Production Target',
    when: '10:45 AM',
    body: `${machine.loadCycles} load cycles completed today — on track with shift quota.`,
    foot: `Shift goal: ${machine.cycleGoal} cycles • Estimated shift completion: 15:30`,
  },
];

/** Screen 9 — Machine Status (stitch: screen_9_machine_status). */
export default function MachineStatus() {
  const { alertActive } = useApp();
  const [acked, setAcked] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [autoShutoff, setAutoShutoff] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const advisories = ADVISORIES.filter((a) => !dismissed.includes(a.id));

  const recalibrate = () => {
    setCalibrating(true);
    setTimeout(() => setCalibrating(false), 1500);
  };

  return (
    <Screen header={{ subtitle: machine.model, alert: alertActive }}>
      {/* Title */}
      <View style={{ gap: 4 }}>
        <Txt v="headlineLg">Machine Status</Txt>
        <Txt v="labelSm" color={colors.onSurfaceVariant}>
          {machine.id} • {machine.model}
        </Txt>
        <Row style={{ marginTop: 4 }}>
          <Badge label={`Cab ID: ${machine.cabId}`} />
          <Badge label="Diagnostic Mode" tone="outlinePrimary" />
        </Row>
      </View>

      {/* Status hero */}
      <Panel borderColor={colors.primaryContainer}>
        <View style={{ flexDirection: 'row', gap: space.md - 4 }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.sm,
              padding: space.md - 4,
              borderWidth: 2,
              borderColor: colors.tertiaryContainer,
              backgroundColor: colors.surfaceLowest,
            }}
          >
            <Pip pulse />
            <Txt v="headlineMd" color={colors.tertiaryContainer}>
              Operational
            </Txt>
          </View>
        </View>
        <View>
          <Txt v="headlineSm">Powertrain & Hydraulics:</Txt>
          <Txt v="headlineSm" color={colors.primaryContainer}>
            Normal ({machine.hydraulicBar} Bar)
          </Txt>
          <Txt v="bodySm" color={colors.onSurfaceVariant} style={{ marginTop: 4 }}>
            Main relief valve pressure stable • Flow rate: 380 L/min nominal
          </Txt>
        </View>
        <Row>
          <Button
            label={calibrating ? 'Calibrating' : 'Recalibrate'}
            icon="refresh"
            variant="secondary"
            loading={calibrating}
            style={{ flex: 1 }}
            onPress={recalibrate}
          />
          <Button
            label={acked ? 'Acknowledged' : 'Acknowledge'}
            icon="check_circle"
            variant={acked ? 'safe' : 'primary'}
            style={{ flex: 1 }}
            onPress={() => setAcked(true)}
          />
        </Row>
      </Panel>

      {/* Metrics */}
      <Panel title="Key Operational Metrics" right="Sample rate: 10 Hz" iconColor={colors.primaryContainer}>
        <Metric
          label="Engine Hours"
          icon="timer"
          value={machine.engineHours}
          unit="H"
          footerLeft="Service interval: 250H"
          footerRight="78H Remaining"
        />
        <Metric
          label="Fuel Used"
          icon="local_gas_station"
          value={machine.fuelUsed}
          unit="L"
          footerLeft="Current level"
          footerRight={`${machine.fuelPct}% (${machine.fuelLitres} L)`}
          footerRightColor={colors.primaryContainer}
        />
        <Metric
          label="Load Cycles"
          icon="sync"
          value={String(machine.loadCycles)}
          unit="Cycles"
          footerLeft="Today's shift count"
          footerRight="Avg 2.4 min/cycle"
          footerRightColor={colors.primaryContainer}
        />
        <Metric
          label="Idle Time"
          icon="hourglass_empty"
          value={String(machine.idleMin)}
          valueColor={colors.primaryContainer}
          unit="MIN"
          unitColor={colors.onSurface}
          footerLeft="Active ratio: 76%"
          footerRight="High (+12%)"
          footerRightColor={colors.primaryContainer}
        />
      </Panel>

      {/* Quick inspection */}
      <Panel title="Telematics Quick Inspection" right="All sensors calibrated" rightColor={colors.tertiaryContainer}>
        {[
          { label: 'Oil Temp', icon: 'device_thermostat', value: '68°C', state: 'Optimal', pct: 0.55 },
          { label: 'Track Tension', icon: 'width', value: '52 mm', state: 'Verified', pct: 0.9 },
          { label: 'Alternator/Batt', icon: 'bolt', value: '28.4V', state: 'Nominal', pct: 0.8 },
        ].map((s) => (
          <Cell key={s.label} debossed style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Txt v="labelXs" color={colors.onSurfaceVariant}>
                {s.label}
              </Txt>
              <Icon name={s.icon} size={16} color={colors.tertiaryContainer} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Txt v="headlineMd">{s.value}</Txt>
              <Txt v="labelXs" color={colors.tertiaryContainer}>
                {s.state}
              </Txt>
            </View>
            <ProgressBar value={s.pct} color={colors.tertiaryContainer} />
          </Cell>
        ))}
      </Panel>

      {/* Advisories */}
      <Panel title="Machine Insights & Advisories" right={`Active: ${advisories.length}`}>
        {advisories.map((a) => {
          const warn = a.tone === 'warn';
          return (
            <View
              key={a.id}
              style={{
                flexDirection: 'row',
                gap: space.md - 4,
                padding: space.md - 4,
                backgroundColor: colors.surfaceLowest,
                borderWidth: 2,
                borderColor: warn ? colors.primaryContainer : colors.tertiaryContainer,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: warn ? colors.primaryContainer : colors.surfaceHigh,
                  borderWidth: warn ? 0 : 1.5,
                  borderColor: colors.tertiaryContainer,
                }}
              >
                <Icon
                  name={warn ? 'warning' : 'check_circle'}
                  size={22}
                  color={warn ? colors.onPrimaryContainer : colors.tertiaryContainer}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
                  <Txt v="labelSm" color={warn ? colors.primaryContainer : colors.tertiaryContainer} style={{ flex: 1 }}>
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
                {warn && (
                  <Row style={{ marginTop: 6 }}>
                    <Button
                      label={autoShutoff ? 'Auto-shutoff armed' : 'Arm auto-shutoff'}
                      variant={autoShutoff ? 'safe' : 'secondary'}
                      size="sm"
                      style={{ flex: 1.4 }}
                      onPress={() => setAutoShutoff(true)}
                    />
                    <Button
                      label="Dismiss"
                      variant="secondary"
                      size="sm"
                      style={{ flex: 1 }}
                      onPress={() => setDismissed((d) => [...d, a.id])}
                    />
                  </Row>
                )}
              </View>
            </View>
          );
        })}
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
                `${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} • Walkaround note logged`,
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
