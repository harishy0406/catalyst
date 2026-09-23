import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Badge, Button, Cell, HazardStripe, Icon, Panel, Screen, Txt } from '@/components';
import { machine, operator } from '@/data/mock';
import { useApp } from '@/state/AppState';
import { colors, space } from '@/theme/tokens';

const TYPES = [
  { icon: 'warning', label: 'Proximity Hazard', sub: 'Zone Breach' },
  { icon: 'airline_seat_recline_extra', label: 'Seatbelt Issue', sub: 'Cab Interlock' },
  { icon: 'precision_manufacturing', label: 'Machine Issue', sub: 'Hyd / Powertrain' },
  { icon: 'dangerous', label: 'Unsafe Condition', sub: 'Berm / Grade Fail' },
  { icon: 'help_outline', label: 'Other Hazard', sub: 'Misc / Unlisted' },
];

const SEVERITIES = [
  { key: 'LOW', label: 'Low', sub: 'Log Only' },
  { key: 'MEDIUM', label: 'Medium', sub: 'Foreman Alert' },
  { key: 'HIGH', label: 'High (Critical)', sub: 'Site Halt Required' },
] as const;

const MACROS = ['Worker in blindspot', 'Hydraulic leak', 'Obstruction on haul road'];

/** Screen 7 — Incident Report (stitch: screen_7_incident_report). */
export default function IncidentReport() {
  const { incidents, submitIncident, alertActive } = useApp();
  const [type, setType] = useState(0);
  const [severity, setSeverity] = useState<(typeof SEVERITIES)[number]['key']>('HIGH');
  const [desc, setDesc] = useState('Worker in blindspot');
  const [recording, setRecording] = useState(false);
  const [snapshot, setSnapshot] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const last = incidents[0];

  const submit = () => {
    setSubmitting(true);
    setTimeout(() => {
      submitIncident({ type: TYPES[type].label, severity, description: desc || '(no description)' });
      setSubmitting(false);
      setSnapshot(false);
    }, 900);
  };

  return (
    <Screen header={{ subtitle: 'Dispatch link online', alert: alertActive }}>
      {/* Title */}
      <Panel>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Icon name="shield" size={24} color={colors.primaryContainer} />
          <Txt v="headlineLg">Report an Incident</Txt>
        </View>
        <Txt v="labelSm" color={colors.onSurfaceVariant}>
          Operator: {operator.name} • {machine.id} • Pit 4-B North Highwall
        </Txt>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            alignSelf: 'flex-start',
            paddingHorizontal: space.md - 4,
            paddingVertical: space.sm,
            borderWidth: 1.5,
            borderColor: colors.primaryContainer,
            backgroundColor: colors.surfaceLowest,
          }}
        >
          <Icon name="timer" size={20} color={colors.primaryContainer} />
          <Txt v="labelLg" color={colors.primaryContainer}>
            15-sec rapid triage
          </Txt>
        </View>
      </Panel>

      {/* Type grid */}
      <Panel title="Select incident type (one-touch)" icon="category" right="Touch to toggle">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {TYPES.map((t, i) => {
            const on = i === type;
            return (
              <Pressable
                key={t.label}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={t.label}
                onPress={() => setType(i)}
                style={({ pressed }) => ({
                  flexBasis: '48%',
                  flexGrow: 0,
                  minHeight: 104,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: space.sm,
                  backgroundColor: on ? colors.surfaceHigh : pressed ? colors.surfaceHigh : colors.surfaceLow,
                  borderWidth: 2,
                  borderColor: on ? colors.primaryContainer : colors.surfaceHighest,
                })}
              >
                <View
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 12,
                    height: 12,
                    backgroundColor: on ? colors.primaryContainer : 'transparent',
                    borderWidth: 1,
                    borderColor: on ? colors.primaryContainer : colors.surfaceHighest,
                  }}
                />
                <Icon name={t.icon} size={30} color={on ? colors.primaryContainer : colors.onSurface} />
                <Txt v="labelLg" style={{ textAlign: 'center' }}>
                  {t.label}
                </Txt>
                <Txt v="labelXs" color={on ? colors.primaryContainer : colors.onSurfaceVariant}>
                  {t.sub}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      </Panel>

      {/* Severity */}
      <Panel
        title="Severity level (safety classification)"
        icon="report"
        right={`Status: ${severity === 'HIGH' ? 'Critical' : severity}`}
        rightColor={severity === 'HIGH' ? colors.secondary : colors.primaryContainer}
      >
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          {SEVERITIES.map((s) => {
            const on = s.key === severity;
            const critical = s.key === 'HIGH';
            return (
              <Pressable
                key={s.key}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${s.label} severity`}
                onPress={() => setSeverity(s.key)}
                style={{
                  flex: 1,
                  minHeight: 88,
                  overflow: 'hidden',
                  backgroundColor: on ? (critical ? colors.secondaryContainer : colors.primaryContainer) : colors.surfaceLow,
                  borderWidth: 2,
                  borderColor: on ? (critical ? colors.danger : colors.primaryContainer) : colors.surfaceHighest,
                }}
              >
                {on && critical && <HazardStripe height={6} bar={8} />}
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 4 }}>
                  {critical && on && <Icon name="emergency" size={16} color={colors.white} />}
                  <Txt
                    v="headlineSm"
                    style={{ textAlign: 'center' }}
                    color={on ? (critical ? colors.white : colors.onPrimaryContainer) : colors.onSurface}
                  >
                    {s.label}
                  </Txt>
                  <Txt
                    v="labelXs"
                    style={{ textAlign: 'center' }}
                    color={on ? (critical ? colors.onSecondaryContainer : colors.onPrimaryContainer) : colors.onSurfaceVariant}
                  >
                    {s.sub}
                  </Txt>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Panel>

      {/* Description */}
      <Panel title="Quick description" icon="mic" right="PTT ready" rightColor={colors.primaryContainer}>
        <Cell debossed style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 56 }}>
          <Icon name="graphic_eq" size={22} color={colors.primaryContainer} />
          <Txt v="headlineSm" style={{ flex: 1 }} numberOfLines={2}>
            {desc ? `“${desc}”` : '—'}
          </Txt>
          <Pressable
            accessibilityRole="button"
            onPress={() => setDesc('')}
            hitSlop={8}
            style={{ paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceHigh }}
          >
            <Txt v="labelSm">Clear</Txt>
          </Pressable>
        </Cell>
        <Txt v="labelXs" color={colors.onSurfaceVariant}>
          Preset in-cab macros:
        </Txt>
        {MACROS.map((m) => {
          const on = desc === m;
          return (
            <Pressable
              key={m}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => setDesc(m)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 56,
                paddingHorizontal: space.md - 4,
                backgroundColor: pressed ? colors.surfaceHigh : colors.surfaceLow,
                borderWidth: 2,
                borderColor: on ? colors.primaryContainer : colors.surfaceHighest,
              })}
            >
              <Txt v="labelLg">{m}</Txt>
              <Icon name={on ? 'check_circle' : 'add_circle'} size={24} color={on ? colors.primaryContainer : colors.onSurfaceVariant} />
            </Pressable>
          );
        })}
        {/* Push-to-talk: press-and-hold, so it can't use the tap-only Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hold to record voice log"
          onPressIn={() => setRecording(true)}
          onPressOut={() => setRecording(false)}
          style={{
            minHeight: 56,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: space.sm,
            backgroundColor: recording ? colors.secondaryContainer : colors.surfaceContainer,
            borderWidth: 2,
            borderColor: recording ? colors.danger : colors.outlineVariant,
          }}
        >
          <Icon name="mic" size={22} color={recording ? colors.white : colors.primaryContainer} />
          <Txt v="labelLg" color={recording ? colors.white : colors.onSurface}>
            {recording ? 'Recording… release to stop' : 'Hold to record voice log'}
          </Txt>
        </Pressable>
      </Panel>

      {/* Camera evidence */}
      <Panel title="Perimeter cam evidence" icon="photo_camera" right="CAM-04 synced" rightColor={colors.tertiaryContainer}>
        <View style={{ borderWidth: 2, borderColor: snapshot ? colors.primaryContainer : colors.surfaceHighest }}>
          <Image
            source={require('../../../assets/images/rear-cam.jpg')}
            style={{ width: '100%', aspectRatio: 512 / 279, opacity: snapshot ? 1 : 0.45 }}
            contentFit="cover"
          />
          <View style={{ position: 'absolute', top: 6, left: 6 }}>
            <Badge label={snapshot ? 'Snapshot attached' : 'Live cam snapshot'} tone={snapshot ? 'primary' : 'danger'} />
          </View>
          <View style={{ position: 'absolute', top: 6, right: 6 }}>
            <Badge label="09:42:15 UTC" />
          </View>
          <View style={{ position: 'absolute', left: space.sm, right: space.sm, bottom: space.sm }}>
            <Button
              label={snapshot ? 'Retake snapshot' : 'Attach cab/perimeter cam snapshot'}
              icon="camera"
              variant="secondary"
              size="sm"
              onPress={() => setSnapshot(true)}
            />
          </View>
        </View>
      </Panel>

      <Button label="Submit Incident Report" icon="send" size="lg" loading={submitting} onPress={submit} />

      {last && (
        <View
          style={{
            flexDirection: 'row',
            gap: space.md - 4,
            padding: space.md - 4,
            backgroundColor: colors.surfaceLowest,
            borderWidth: 2,
            borderColor: colors.tertiaryContainer,
          }}
        >
          <Icon name="task_alt" size={28} color={colors.tertiaryContainer} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt v="labelMd">
              Last reported: {last.id} • Logged to Site Safety dispatch at {last.time}
            </Txt>
            <Txt v="bodySm" color={colors.onSurfaceVariant}>
              {last.type} • {last.severity} • “{last.description}”
            </Txt>
            <Txt v="bodySm" color={colors.onSurfaceVariant}>
              Telemetry tag: GPS (Lat 53.421, Long -113.512) • Auto-synchronized with Safety Central
            </Txt>
            <Badge label="Acknowledged by dispatch" tone="outlineSafe" style={{ marginTop: 4 }} />
          </View>
        </View>
      )}
    </Screen>
  );
}
