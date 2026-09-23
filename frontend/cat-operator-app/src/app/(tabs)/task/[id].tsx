import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Badge, Button, Cell, Icon, Metric, Panel, Row, Screen, Txt } from '@/components';
import { machine, operator } from '@/data/mock';
import { useApp } from '@/state/AppState';
import { border, colors, space } from '@/theme/tokens';

const CHECKS = [
  { icon: 'airline_seat_recline_extra', title: 'Seatbelt fastened', detail: 'Primary operator restraint tension verified' },
  { icon: 'build', title: 'Machine inspection complete', detail: 'Fluids, track tension, and arm linkages cleared' },
  { icon: 'warning', title: 'Work zone clear', detail: '15m proximity perimeter radar check acknowledged' },
];

const STATUS_LABEL = {
  ready: 'Ready to Commence',
  queued: 'Queued',
  in_progress: 'In Progress',
  paused: 'Paused',
  completed: 'Completed',
} as const;

/** Screen 6 — Task Detail (stitch: screen_6_task_detail). */
export default function TaskDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tasks, setTaskStatus, alertActive } = useApp();
  const task = tasks.find((t) => t.id === id) ?? tasks[0];
  const [checked, setChecked] = useState([true, true, true]);
  const allClear = checked.every(Boolean);
  const running = task.status === 'in_progress';

  return (
    <Screen header={{ subtitle: 'Cab Display Unit • SYS_VER 4.12', hazard: true, alert: alertActive }}>
      {/* Title block */}
      <Panel>
        <View style={{ flexDirection: 'row', gap: space.md - 4 }}>
          <View
            style={{
              width: 56,
              height: 56,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: colors.primaryContainer,
              backgroundColor: colors.surfaceLowest,
            }}
          >
            <Icon name="assignment" size={30} color={colors.primaryContainer} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Row style={{ flexWrap: 'wrap' }} gap={6}>
              <Badge label={STATUS_LABEL[task.status]} tone={task.status === 'completed' ? 'safe' : 'primary'} />
              <Badge label={task.zone} />
            </Row>
            <Txt v="headlineXl" style={{ fontSize: 44, lineHeight: 46 }}>
              {task.title}
            </Txt>
            <Txt v="labelSm" color={colors.onSurfaceVariant}>
              Task ID: {task.id} • Machine: {machine.id}
            </Txt>
          </View>
        </View>
        <Row>
          <StatusCell label="System PWR" value="● Nominal" color={colors.tertiaryContainer} />
          <StatusCell label="Hydraulics" value="● 240 BAR" color={colors.primaryContainer} />
        </Row>
        <StatusCell label="Cab Lock" value="Engaged" icon="lock" color={colors.onSurface} />
      </Panel>

      {/* Metric grid */}
      <Row>
        <View style={{ flex: 1 }}>
          <Metric label="Estimated Time" icon="timer" value={String(task.estMin)} unit="MIN" size="md" />
        </View>
        <View style={{ flex: 1 }}>
          <Metric
            label="Predicted Time"
            icon="analytics"
            value={String(task.predictedMin ?? task.estMin)}
            valueColor={colors.tertiaryContainer}
            unit="MIN"
            size="md"
          />
        </View>
      </Row>
      <Row>
        <View style={{ flex: 1 }}>
          <Metric
            label="Weather"
            icon={task.weather.icon}
            value={task.weather.temp ?? '--'}
            unit={task.weather.label}
            unitColor={colors.onSurfaceVariant}
            size="md"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Metric
            label="Operator Skill"
            icon="badge"
            value="Expert"
            unit={`LVL ${operator.level}`}
            unitColor={colors.tertiaryContainer}
            size="md"
          />
        </View>
      </Row>
      <Metric label="Machine Age" icon="schedule" value="2" unit="Years" unitColor={colors.onSurfaceVariant} size="md" />

      {/* Checklist */}
      <Panel
        title="Pre-Task Safety Checklist"
        icon="shield"
        right={
          <Badge
            label={`${checked.filter(Boolean).length} of 3 verified`}
            tone={allClear ? 'outlineSafe' : 'outlineDanger'}
          />
        }
      >
        {CHECKS.map((c, i) => (
          <Pressable
            key={c.title}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: checked[i] }}
            accessibilityLabel={c.title}
            onPress={() => setChecked((s) => s.map((v, j) => (j === i ? !v : v)))}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: space.md - 4,
              padding: space.md - 4,
              minHeight: 80,
              backgroundColor: pressed ? colors.surfaceHigh : colors.surfaceLow,
              borderWidth: border.panel,
              borderColor: checked[i] ? colors.surfaceHighest : colors.danger,
            })}
          >
            <View
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primaryContainer,
              }}
            >
              <Icon name={c.icon} size={24} color={colors.onPrimaryContainer} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt v="headlineSm">{c.title}</Txt>
              <Txt v="bodySm" color={colors.onSurfaceVariant}>
                {c.detail}
              </Txt>
            </View>
            <View
              style={{
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: checked[i] ? colors.tertiaryContainer : colors.surfaceLowest,
                borderWidth: 2,
                borderColor: checked[i] ? colors.onTertiary : colors.outlineVariant,
              }}
            >
              {checked[i] && <Icon name="check" size={28} color={colors.onTertiary} />}
            </View>
          </Pressable>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt v="labelXs" color={allClear ? colors.onSurfaceVariant : colors.danger}>
            {allClear ? 'OSHA / ISO-12100 telemetric lock cleared' : 'Interlock hold: complete checklist'}
          </Txt>
          <Icon name="verified_user" size={18} color={allClear ? colors.tertiaryContainer : colors.outline} />
        </View>
      </Panel>

      {/* Instructions */}
      <Panel title="Task Instructions" icon="description" right={`Spec #882`} rightColor={colors.primaryContainer}>
        <Cell debossed>
          <Txt v="labelSm" color={colors.primaryContainer}>
            Operator Directive
          </Txt>
          <Txt v="bodyLg" style={{ marginTop: 4 }}>
            {task.description}
          </Txt>
        </Cell>
        <Row>
          <View style={{ flex: 1 }}>
            <Cell>
              <Txt v="labelXs" color={colors.onSurfaceVariant}>
                Target Depth
              </Txt>
              <Txt v="headlineMd">{task.targetDepth ?? '—'}</Txt>
            </Cell>
          </View>
          <View style={{ flex: 1 }}>
            <Cell>
              <Txt v="labelXs" color={colors.onSurfaceVariant}>
                Payload Truck
              </Txt>
              <Txt v="headlineMd" color={colors.primaryContainer}>
                {task.payloadTruck ?? '—'}
              </Txt>
            </Cell>
          </View>
        </Row>
        {task.safetyNote && (
          <Cell style={{ flexDirection: 'row', gap: space.sm }}>
            <Icon name="info" size={18} color={colors.primaryContainer} />
            <Txt v="bodySm" color={colors.onSurfaceVariant} style={{ flex: 1 }}>
              {task.safetyNote}
            </Txt>
          </Cell>
        )}
      </Panel>

      {/* Execution controls */}
      <Panel
        title="Primary Hydraulic Dispatch & Execution"
        right={allClear ? 'All interlocks green' : 'Interlock hold'}
        rightColor={allClear ? colors.primaryContainer : colors.danger}
      >
        <Button
          label={running ? 'Task Running' : task.status === 'paused' ? 'Resume Task' : 'Start Task'}
          icon="play_arrow"
          size="lg"
          disabled={!allClear || running || task.status === 'completed'}
          onPress={() => setTaskStatus(task.id, 'in_progress')}
        />
        <Button
          label="Pause Task"
          icon="pause"
          variant="outline"
          size="lg"
          disabled={!running}
          onPress={() => setTaskStatus(task.id, 'paused')}
        />
        <Button
          label={task.status === 'completed' ? 'Completed' : 'Complete Task'}
          icon="check_circle"
          size="lg"
          disabled={task.status === 'completed' || task.status === 'queued'}
          onPress={() => {
            setTaskStatus(task.id, 'completed');
            router.navigate('/tasks');
          }}
        />
      </Panel>

      {/* Telemetry footer */}
      <Cell debossed style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="cell_tower" size={16} color={colors.tertiaryContainer} />
          <Txt v="labelSm">
            Telematics Link:{' '}
            <Txt v="labelSm" color={colors.tertiaryContainer}>
              100% (4G-LTE)
            </Txt>
          </Txt>
        </View>
        <Txt v="labelSm">
          CAN-Bus:{' '}
          <Txt v="labelSm" color={colors.tertiaryContainer}>
            Active (J1939)
          </Txt>
        </Txt>
        <Txt v="labelXs" color={colors.onSurfaceVariant}>
          LAT: 41.8781° N • LON: 87.6298° W • SAT: 14 LOCKED
        </Txt>
      </Cell>
    </Screen>
  );
}

function StatusCell({ label, value, color, icon }: { label: string; value: string; color: string; icon?: string }) {
  return (
    <Cell debossed style={{ flex: 1 }}>
      <Txt v="labelXs" color={colors.onSurfaceVariant}>
        {label}
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
        {icon && <Icon name={icon} size={16} color={colors.tertiaryContainer} />}
        <Txt v="labelLg" color={color}>
          {value}
        </Txt>
      </View>
    </Cell>
  );
}
