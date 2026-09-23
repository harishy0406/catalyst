import { router } from 'expo-router';
import { View } from 'react-native';

import { Badge, Button, Cell, Icon, NavRow, Panel, Pip, ProgressBar, Screen, Txt } from '@/components';
import { machine, operator } from '@/data/mock';
import { useApp } from '@/state/AppState';
import { colors, space } from '@/theme/tokens';

/** Screen 10 — Operator Profile (stitch: screen_10_operator_profile). */
export default function Profile() {
  const { operatorId, signOut, safetyEvents, alertActive } = useApp();
  const { done, total } = operator.training;

  return (
    <Screen header={{ subtitle: operator.cab, alert: alertActive }}>
      {/* Title */}
      <Panel>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md - 4 }}>
          <Txt v="headlineLg" style={{ flex: 1 }}>
            Operator Profile
          </Txt>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Txt v="labelXs" color={colors.onSurfaceVariant}>
              • {operator.cab}
            </Txt>
            <Badge label="Auth Validated" tone="outlineSafe" />
          </View>
        </View>
      </Panel>

      {/* Identity */}
      <Panel title="Operator Identity & Cabin Allocation" icon="badge" right="Secure Telemetrics" rightColor={colors.primaryContainer}>
        <View style={{ flexDirection: 'row', gap: space.md - 4, alignItems: 'center' }}>
          <View
            style={{
              width: 80,
              height: 80,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surfaceLowest,
              borderWidth: 2,
              borderColor: colors.outlineVariant,
            }}
          >
            <Icon name="person" size={44} color={colors.primaryContainer} />
            <View style={{ position: 'absolute', right: -2, bottom: -2 }}>
              <Badge label={`LVL ${operator.level}`} tone="safe" style={{ paddingHorizontal: 4, paddingVertical: 1 }} />
            </View>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Txt v="labelXs" color={colors.onSurfaceVariant}>
                Full Name
              </Txt>
              <Badge label="Active Now" tone="outlinePrimary" style={{ paddingVertical: 1 }} />
            </View>
            <Txt v="headlineXl">{operator.name}</Txt>
            <View style={{ flexDirection: 'row', gap: space.sm, flexWrap: 'wrap' }}>
              <Txt v="labelSm" color={colors.primaryContainer}>
                OP-ID: {operatorId}
              </Txt>
              <Txt v="labelSm" color={colors.tertiaryContainer}>
                {operator.shift}
              </Txt>
            </View>
          </View>
        </View>
        <Cell debossed>
          <Txt v="labelXs" color={colors.onSurfaceVariant}>
            Interlock Status
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="verified_user" size={20} color={colors.tertiaryContainer} />
            <Txt v="headlineSm" color={colors.tertiaryContainer}>
              Active
            </Txt>
          </View>
        </Cell>
        <Cell>
          <Txt v="labelXs" color={colors.onSurfaceVariant}>
            Assigned Machine
          </Txt>
          <Txt v="headlineSm">{machine.id}</Txt>
          <Txt v="labelXs" color={colors.primaryContainer}>
            {machine.shortModel}
          </Txt>
        </Cell>
        <Cell style={{ borderColor: colors.tertiaryContainer }}>
          <Txt v="labelXs" color={colors.onSurfaceVariant}>
            Skill Level & Credentials
          </Txt>
          <Txt v="headlineSm">{operator.skill}</Txt>
          <Txt v="labelXs" color={colors.tertiaryContainer}>
            {operator.credential}
          </Txt>
        </Cell>
        <Cell style={{ flexDirection: 'row', gap: space.md - 4 }}>
          <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryContainer }}>
            <Icon name="shield" size={24} color={colors.onPrimaryContainer} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt v="labelXs" color={colors.onSurfaceVariant}>
              Shift Rating / Safety Score
            </Txt>
            <Txt v="headlineMd">100% Interlock Compliance</Txt>
            <Badge label="Nominal" tone="outlineSafe" />
          </View>
        </Cell>
      </Panel>

      {/* Stats */}
      <Panel title="Performance & Safety Stats" icon="speed" right="Telemetry Synced">
        <Cell debossed style={{ gap: 6 }}>
          <Txt v="labelXs" color={colors.onSurfaceVariant}>
            Training Progress
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Txt v="metric" style={{ fontSize: 44, lineHeight: 48 }}>
              {done}
              <Txt v="headlineMd" color={colors.onSurfaceVariant}>
                {' '}/ {total}
              </Txt>
            </Txt>
            <Txt v="labelSm" color={colors.primaryContainer}>
              {Math.round((done / total) * 100)}% Comp
            </Txt>
          </View>
          <ProgressBar value={done / total} segments={total} height={8} />
          <Txt v="labelXs" color={colors.onSurfaceVariant}>
            {done} / {total} completed
          </Txt>
        </Cell>
        <Cell debossed style={{ gap: 6 }}>
          <Txt v="labelXs" color={colors.onSurfaceVariant}>
            Safety Events
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Txt v="metric" color={colors.primaryContainer} style={{ fontSize: 44, lineHeight: 48 }}>
              {operator.safetyEventsThisWeek}
            </Txt>
            <Badge label="Resolved" tone="outlineSafe" />
          </View>
          <View style={{ padding: 6, borderLeftWidth: 3, borderLeftColor: colors.tertiaryContainer, backgroundColor: colors.surfaceHigh }}>
            <Txt v="labelXs" style={{ textTransform: 'none' }}>
              {operator.safetyEventsThisWeek} this week (All Cleared & Resolved)
            </Txt>
          </View>
        </Cell>
        <Cell debossed style={{ gap: 6 }}>
          <Txt v="labelXs" color={colors.onSurfaceVariant}>
            Operating Time
          </Txt>
          <Txt v="metric" style={{ fontSize: 44, lineHeight: 48 }}>
            {operator.operatingHours}
            <Txt v="headlineMd" color={colors.primaryContainer}>
              {' '}HRS
            </Txt>
          </Txt>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt v="labelXs" color={colors.onSurfaceVariant}>
              MCH lifetime log
            </Txt>
            <Txt v="labelXs" color={colors.tertiaryContainer}>
              Stable
            </Txt>
          </View>
          <ProgressBar value={0.86} color={colors.primary} />
        </Cell>
      </Panel>

      {/* Menu */}
      <Panel title="Operator Actions & System Menu" icon="tune" right="Glove Ready 64px">
        <NavRow
          icon="menu_book"
          title="Training History & Certifications"
          caption="3 active licences • Refresher due 45D"
          accent={colors.primaryContainer}
          onPress={() => router.push('/training')}
        />
        <NavRow
          icon="shield"
          title="Safety Event History & Reports"
          caption={`${safetyEvents.length} events logged • 0 active violations`}
          accent={colors.tertiaryContainer}
          onPress={() => router.navigate('/safety')}
        />
        <NavRow icon="settings" title="Cab Display Settings" caption="Brightness 95% • Glove mode active" accent={colors.outline} />
        <NavRow
          icon="help"
          title="In-Cab Help & Emergency Dispatch"
          caption="Direct cab link: Channel 09 (Site Safety)"
          accent={colors.danger}
          onPress={() => router.push('/incident')}
        />
        <Button
          label="Log Out of Cab Terminal"
          icon="logout"
          variant="critical"
          size="lg"
          hazard
          onPress={() => {
            signOut();
            router.replace('/login');
          }}
        />
        <Txt v="labelXs" color={colors.onSurfaceVariant} style={{ textAlign: 'center' }}>
          Warning: logout engages hydraulic lock interlock
        </Txt>
      </Panel>

      <Cell debossed style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Pip round={false} />
        <Txt v="labelXs" style={{ flex: 1 }}>
          ECU Comms Bus: Nominal
        </Txt>
        <Txt v="labelXs" color={colors.onSurfaceVariant}>
          Latency: 14ms
        </Txt>
      </Cell>
    </Screen>
  );
}
