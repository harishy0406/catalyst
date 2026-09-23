import { router } from 'expo-router';
import { View } from 'react-native';

import { Badge, Button, Cell, Icon, Metric, NavRow, Panel, Pip, ProgressBar, Row, Screen, Txt } from '@/components';
import { site } from '@/data/mock';
import { useApp } from '@/state/AppState';
import { colors, space } from '@/theme/tokens';

/** Screen 2 — Home / Shift Overview (stitch: screen_2_home_shift_overview). */
export default function Home() {
  const { tasks, alertActive, machine, operator } = useApp();
  const current = tasks.find((t) => t.status === 'in_progress' || t.status === 'paused' || t.status === 'ready') ?? tasks[0];
  const next = tasks.find((t) => t.status === 'queued');
  const completed = tasks.filter((t) => t.status === 'completed').length;
  const pct = current.elapsedMin / current.estMin;

  return (
    <Screen header={{ title: `${machine.id} • Shift Active`, subtitle: `Operator: ${operator.name} • ${operator.cab}`, alert: alertActive }}>
      {/* Greeting strip */}
      <View style={{ gap: 6, paddingBottom: space.sm, borderBottomWidth: 1, borderBottomColor: colors.surfaceHighest }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' }}>
          <Txt v="headlineLg">Good Morning, {operator.firstName}</Txt>
          <Badge label="Ready to Dig" tone="primary" />
        </View>
        <Txt v="labelSm" color={colors.onSurfaceVariant}>
          Date: {site.date} • Site: {site.site} • Shift {site.shiftWindow}
        </Txt>
      </View>

      {alertActive && (
        <NavRow
          icon="warning"
          title="Active Proximity Alert"
          caption="Person detected 2.8 m • Tap to respond"
          tone="danger"
          onPress={() => router.push('/alert')}
        />
      )}

      {/* Machine status */}
      <Panel title="Machine Status Telemetrics" icon="precision_manufacturing" right="CAN-Bus Nominal" rightColor={colors.tertiaryContainer}>
        <Cell debossed style={{ gap: space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md - 4 }}>
            <Pip round={false} size={16} color={colors.tertiaryContainer} pulse />
            <Txt v="headlineLg" style={{ fontSize: 32, lineHeight: 36 }}>
              ● Operational
            </Txt>
          </View>
          <Badge label="Drive Interlock Engaged" tone="outlineSafe" />
        </Cell>
        <Metric label="Engine Hours" value={machine.engineHours} unit="H">
          <View style={{ marginTop: 8 }}>
            <ProgressBar value={0.69} />
          </View>
        </Metric>
        <Metric label="Fuel Cell Volume" value={String(machine.fuelPct)} unit="%">
          <View style={{ marginTop: 8 }}>
            <ProgressBar value={machine.fuelPct / 100} color={colors.tertiaryContainer} />
          </View>
        </Metric>
        <Metric
          label="Hydraulic Pressure"
          value="Normal"
          valueColor={colors.tertiaryContainer}
          unit={`${machine.hydraulicBar} BAR`}
          size="md"
        >
          <View style={{ marginTop: 8 }}>
            <ProgressBar value={0.72} color={colors.tertiaryContainer} />
          </View>
        </Metric>
      </Panel>

      {/* Safety interlock */}
      <Panel title="Safety Interlock Guarantee" icon="verified_user" right="ISO-13849 CAT 4" rightColor={colors.tertiaryContainer}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.md - 4,
            padding: space.md,
            backgroundColor: colors.tertiaryContainer,
          }}
        >
          <Icon name="shield" size={36} color={colors.onTertiary} />
          <Txt v="headlineLg" color={colors.onTertiary} style={{ flex: 1, fontSize: 32, lineHeight: 34 }}>
            Safe to Operate
          </Txt>
          <Icon name="check_circle" size={30} color={colors.onTertiary} />
        </View>
        {[
          ['Seatbelt Fastened', 'Sensor OK'],
          ['No Proximity Hazards', 'LiDAR 360° CLR'],
          ['Machine Systems Normal', 'Pressure Verified'],
        ].map(([label, status]) => (
          <View
            key={label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.sm,
              minHeight: 48,
              paddingHorizontal: space.md - 4,
              backgroundColor: colors.surfaceLowest,
              borderWidth: 1.5,
              borderColor: colors.tertiaryContainer,
              borderLeftWidth: 6,
            }}
          >
            <Icon name="check_box" size={20} color={colors.tertiaryContainer} />
            <Txt v="labelMd" style={{ flex: 1 }}>
              {label}
            </Txt>
            <Txt v="labelXs" color={colors.tertiaryContainer}>
              {status}
            </Txt>
          </View>
        ))}
      </Panel>

      {/* Current assignment */}
      <Panel
        title="Current Active Assignment"
        icon="play_circle"
        right={current.status === 'paused' ? 'Task Paused' : 'Task In Progress'}
        rightColor={colors.primaryContainer}
      >
        <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center', flexWrap: 'wrap' }}>
          <Badge label={`Code: ${current.id}`} tone="neutral" />
          <Txt v="labelXs" color={colors.onSurfaceVariant}>
            {current.zone} Excavation
          </Txt>
        </View>
        <Txt v="headlineXl" style={{ fontSize: 44, lineHeight: 46 }}>
          {current.title}
        </Txt>
        <Cell debossed>
          <Txt v="labelSm" color={colors.primaryContainer}>
            Estimated Time
          </Txt>
          <Txt v="headlineLg" color={colors.primaryContainer}>
            {current.estMin} MIN
          </Txt>
        </Cell>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: space.sm }}>
          <Txt v="labelSm" color={colors.onSurfaceVariant} style={{ flex: 1 }}>
            Execution Duration & Target
          </Txt>
          <Txt v="headlineSm">
            {current.elapsedMin} / {current.estMin} min{' '}
            <Txt v="headlineSm" color={colors.primaryContainer}>
              ({Math.round(pct * 100)}%)
            </Txt>
          </Txt>
        </View>
        <ProgressBar value={pct} height={14} />
        <Button
          label="View Task Details & Telemetry"
          icon="assignment_turned_in"
          size="lg"
          onPress={() => router.push({ pathname: '/task/[id]', params: { id: current.id } })}
        />
      </Panel>

      {/* Queue preview */}
      {next && (
        <Panel title="Queue Preview" icon="update" right="Up Next" rightColor={colors.primaryContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt v="labelSm" color={colors.primaryContainer}>
              Next Sequence ({next.id})
            </Txt>
            <Txt v="labelSm" color={colors.onSurfaceVariant}>
              Est: {next.estMin} Min
            </Txt>
          </View>
          <Txt v="headlineXl">{next.title}</Txt>
          <Txt v="bodyMd" color={colors.onSurfaceVariant}>
            {next.description}
          </Txt>
          <Cell debossed style={{ flexDirection: 'row', gap: space.md - 4, alignItems: 'center' }}>
            <Icon name="rainy" size={24} color={colors.secondary} />
            <View style={{ flex: 1 }}>
              <Txt v="labelSm" color={colors.secondary}>
                Meteorological Caution
              </Txt>
              <Txt v="bodySm">Rain expected 11:30 (Slick clay risk)</Txt>
            </View>
          </Cell>
          <Button
            label="View Upcoming Task"
            icon="visibility"
            variant="secondary"
            onPress={() => router.push({ pathname: '/task/[id]', params: { id: next.id } })}
          />
        </Panel>
      )}

      {/* Hotkeys */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
          <Icon name="touch_app" size={16} color={colors.primaryContainer} />
          <Txt v="labelSm" color={colors.onSurfaceVariant} style={{ flexShrink: 1 }}>
            Cab Primary Hotkeys & Operational Overrides
          </Txt>
        </View>
        <Txt v="labelXs" color={colors.outline}>
          Min touch: 64px
        </Txt>
      </View>
      <NavRow icon="warning" title="Report Incident" caption="Safety, hazard or delay" tone="danger" onPress={() => router.push('/incident')} />
      <NavRow icon="menu_book" title="Operator Training" caption="SOPs & Site Procedures" onPress={() => router.push('/training')} />
      <NavRow icon="settings_suggest" title="Machine Status" caption="Fleet, telemetry & AI anomaly check" onPress={() => router.push('/machine')} />

      {/* Shift summary */}
      <Panel title="Shift Shift-A Running Summary:" icon="assignment">
        <Row>
          <SummaryStat label="Today's Tasks" value={String(tasks.length)} />
          <SummaryStat label="Completed" value={String(completed)} color={colors.tertiaryContainer} />
        </Row>
        <Row>
          <SummaryStat label="Idle Time" value={`${machine.idleMin} min`} color={colors.primaryContainer} />
          <SummaryStat label="Cycle Efficiency" value="94.8%" color={colors.tertiaryContainer} />
        </Row>
      </Panel>
    </Screen>
  );
}

function SummaryStat({ label, value, color = colors.onSurface }: { label: string; value: string; color?: string }) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
      <Txt v="labelSm" color={colors.onSurfaceVariant}>
        {label}:
      </Txt>
      <Txt v="headlineMd" color={color}>
        {value}
      </Txt>
    </View>
  );
}
