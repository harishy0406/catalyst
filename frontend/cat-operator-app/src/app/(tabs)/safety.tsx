import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Badge, Button, Cell, Icon, NavRow, Panel, Pip, Row, Screen, Spec, Txt } from '@/components';
import { machine } from '@/data/mock';
import { useApp } from '@/state/AppState';
import { colors, space } from '@/theme/tokens';

const SYSTEMS = [
  {
    icon: 'airline_seat_recline_extra',
    title: '1. Seatbelt',
    status: 'Fastened',
    detail: 'Interlock active, green indicator. High-retention tensioner engaged.',
    left: 'Circuitry OK',
    right: 'Engaged',
  },
  {
    icon: 'sensors',
    title: '2. Proximity',
    status: 'No hazards detected',
    detail: '360° radar perimeter clear. LiDAR sensors scanning blindspots continuously.',
    left: 'Perimeter Safe',
    right: 'Radar Sync',
  },
  {
    icon: 'precision_manufacturing',
    title: '3. Machine',
    status: 'Operational',
    detail: 'Hydraulics, brakes, roll-over protection OK. Zero critical fault codes.',
    left: 'ROPS / FOPS Level 2',
    right: 'Ready',
  },
];

/** Screen 4 — Safety Center (stitch: screen_4_safety_center). */
export default function Safety() {
  const { safetyEvents, alertActive } = useApp();
  const [showAll, setShowAll] = useState(false);
  const events = showAll ? safetyEvents : safetyEvents.slice(0, 3);

  return (
    <Screen header={{ subtitle: 'Telematics Link Nominal', alert: alertActive }}>
      {/* Title */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md - 4,
          paddingBottom: space.md - 4,
          borderBottomWidth: 1,
          borderBottomColor: colors.surfaceHighest,
        }}
      >
        <Icon name="shield" size={30} color={colors.tertiaryContainer} />
        <Txt v="headlineLg" style={{ flex: 1 }}>
          Safety Center •{' '}
          <Txt v="headlineLg" color={colors.onSurfaceVariant}>
            {machine.id}
          </Txt>
        </Txt>
        <View style={{ alignItems: 'flex-end' }}>
          <Txt v="labelXs" color={colors.onSurfaceVariant}>
            Shift ID
          </Txt>
          <Badge label="SF-8849" />
        </View>
      </View>

      {alertActive && (
        <NavRow
          icon="warning"
          title="Critical Alert Active"
          caption="Person detected near machine • Respond now"
          tone="danger"
          onPress={() => router.push('/alert')}
        />
      )}

      {/* Global status */}
      <View style={{ borderWidth: 3, borderColor: alertActive ? colors.danger : colors.tertiaryContainer }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: space.md,
            paddingVertical: space.lg,
            backgroundColor: alertActive ? colors.secondaryContainer : colors.tertiaryContainer,
          }}
        >
          <Icon name={alertActive ? 'warning' : 'verified_user'} size={72} color={alertActive ? colors.white : colors.onTertiary} />
          <View>
            <Txt v="metric" color={alertActive ? colors.white : colors.onTertiary}>
              {alertActive ? 'ALERT' : 'SAFE'}
            </Txt>
            <Txt v="labelSm" color={alertActive ? colors.white : colors.onTertiary}>
              {alertActive ? 'Operator action required' : 'Systems Online'}
            </Txt>
          </View>
        </View>
        <View style={{ padding: space.md, gap: space.md - 4, backgroundColor: colors.surfaceLowest }}>
          <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' }}>
            <Txt v="labelMd" color={alertActive ? colors.secondary : colors.tertiaryContainer} style={{ flex: 1 }}>
              {alertActive ? 'Proximity breach — rear swing radius' : 'All machine safety & telematics systems normal'}
            </Txt>
            <Badge label="Heavy Duty Mode" />
          </View>
          <Txt v="bodyMd">
            {alertActive
              ? 'Personnel detected 2.8 m from counterweight. Cab control locked and hydraulics throttled to idle until the operator acknowledges.'
              : 'Cabin environment pressurized, rollover structural integrity verified, interlock circuitry synchronized with secondary hydraulic governor. Zero active hazard lockouts.'}
          </Txt>
          <Row>
            <Spec label="Hyd Pressure" value={String(machine.hydraulicBar)} unit="BAR" />
            <Spec label="Tilt Pitch" value="0.8°" unit="Nominal" />
          </Row>
          <Row>
            <Spec label="Radar Range" value="360°" unit="Active" />
            <Spec label="Speed Lock" value="4.2" unit="KM/H" />
          </Row>
        </View>
      </View>

      {/* Per-system cards */}
      {SYSTEMS.map((s) => (
        <Panel
          key={s.title}
          title={s.title}
          icon={s.icon}
          right={<Pip round={false} size={14} />}
          padded={false}
        >
          <View style={{ padding: space.md, gap: 4 }}>
            <Txt v="headlineXl" color={colors.tertiaryContainer}>
              ✓ {s.status}
            </Txt>
            <Txt v="bodyMd" color={colors.onSurfaceVariant}>
              {s.detail}
            </Txt>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingHorizontal: space.md,
              paddingVertical: space.sm + 2,
              backgroundColor: colors.surfaceLowest,
              borderTopWidth: 1,
              borderTopColor: colors.surfaceHighest,
            }}
          >
            <Txt v="labelSm" color={colors.onSurfaceVariant}>
              {s.left}
            </Txt>
            <Txt v="labelSm" color={colors.tertiaryContainer}>
              {s.right}
            </Txt>
          </View>
        </Panel>
      ))}

      {/* Event log */}
      <Panel title="Recent Safety Events" icon="history" right="Log Record: Shift #1" padded={false}>
        {events.map((e, i) => (
          <View
            key={`${e.time}-${e.title}`}
            style={{
              padding: space.md - 4,
              gap: 4,
              minHeight: 60,
              backgroundColor: i % 2 ? '#1e2227' : colors.surfaceContainer,
              borderLeftWidth: 6,
              borderLeftColor: e.resolved ? colors.primaryContainer : colors.danger,
              borderBottomWidth: 1,
              borderBottomColor: '#2b313a',
            }}
          >
            <View style={{ flexDirection: 'row', gap: space.md - 4, alignItems: 'flex-start' }}>
              <Txt v="headlineSm" color={colors.primaryContainer}>
                {e.time}
              </Txt>
              <Txt v="bodyMd" style={{ flex: 1 }}>
                {e.title}
              </Txt>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <Txt v="bodySm" color={colors.onSurfaceVariant}>
                {e.detail}
              </Txt>
              <Badge label={e.resolved ? 'Resolved' : 'Open'} tone={e.resolved ? 'outlineSafe' : 'outlineDanger'} />
            </View>
          </View>
        ))}
        <View style={{ padding: space.md - 4 }}>
          <Button
            label={showAll ? 'Show Recent Only' : 'View All Shift Events'}
            icon="list_alt"
            variant="ghost"
            onPress={() => setShowAll((s) => !s)}
          />
        </View>
      </Panel>

      {/* Quick actions */}
      <Row>
        <Button
          label="Radar Cam Feed"
          icon="videocam"
          variant="secondary"
          style={{ flex: 1 }}
          onPress={() => router.push('/alert')}
        />
        <Button
          label="Sensor Re-zero"
          icon="restart_alt"
          variant="secondary"
          style={{ flex: 1 }}
          onPress={() => Alert.alert('Sensor Re-zero', 'Proximity array re-zeroed. Calibration nominal.')}
        />
      </Row>
      <Row>
        <Button
          label="Test Cab Siren"
          icon="volume_up"
          variant="secondary"
          style={{ flex: 1 }}
          onPress={() => Alert.alert('Cab Siren', 'Siren self-test complete.')}
        />
        <Button
          label="Emergency Assist"
          icon="e911_emergency"
          variant="critical"
          hazard
          style={{ flex: 1 }}
          onPress={() => router.push('/incident')}
        />
      </Row>
      <NavRow icon="menu_book" title="Operator Training" caption="Safety modules & SOPs" onPress={() => router.push('/training')} />
      <Cell debossed style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Pip pulse />
        <Txt v="labelXs" color={colors.onSurfaceVariant}>
          Cab cabin verified • Telematics link nominal
        </Txt>
      </Cell>
    </Screen>
  );
}
