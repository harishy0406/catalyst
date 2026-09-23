import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Badge, Button, Cell, Icon, Panel, Pip, ProgressBar, Row, Screen, Txt } from '@/components';
import { Task } from '@/data/mock';
import { useApp } from '@/state/AppState';
import { border, colors, space } from '@/theme/tokens';

const openTask = (id: string) => router.push({ pathname: '/task/[id]', params: { id } });

/** Screen 5 — Today's Tasks (stitch: screen_5_tasks). */
export default function Tasks() {
  const { tasks, setTaskStatus, alertActive, machine } = useApp();
  const active = tasks.filter((t) => t.status !== 'completed');
  const [current, next, ...queue] = active;

  return (
    <Screen header={{ subtitle: 'Cab Telemetry OK', alert: alertActive }}>
      {/* Title */}
      <Panel>
        <View style={{ flexDirection: 'row', gap: space.md - 4 }}>
          <View style={{ width: 8, backgroundColor: colors.primaryContainer }} />
          <View style={{ flex: 1 }}>
            <Txt v="headlineXl">Today&apos;s Tasks</Txt>
            <Txt v="labelSm" color={colors.primaryContainer}>
              Operator Dispatch Roster • Caterpillar 349 Hydraulic
            </Txt>
          </View>
        </View>
        <Row>
          <Cell style={{ flex: 1.3, flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Pip round={false} size={12} />
            <Txt v="labelSm" style={{ flexShrink: 1 }}>
              Shift: Morning • {machine.id}
            </Txt>
          </Cell>
          <Cell style={{ flex: 1, justifyContent: 'center' }}>
            <Txt v="labelSm" color={colors.onSurfaceVariant}>
              Site: Sector 4A
            </Txt>
          </Cell>
        </Row>
      </Panel>

      {/* Current task */}
      {current && (
        <Panel borderColor={colors.primaryContainer} borderWidth={3}>
          <Row style={{ flexWrap: 'wrap' }}>
            <Badge
              label={
                current.status === 'paused'
                  ? 'Current • Paused'
                  : current.status === 'in_progress'
                    ? 'Current • In Progress'
                    : 'Current • Ready'
              }
              tone="primary"
            />
            <Badge label={`Code: ${current.id}`} />
          </Row>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="timer" size={20} color={colors.primaryContainer} />
            <Txt v="labelMd" color={colors.primaryContainer}>
              Critical Path Active
            </Txt>
          </View>
          <View style={{ height: 1, backgroundColor: colors.surfaceHighest }} />
          <Txt v="labelSm" color={colors.onSurfaceVariant}>
            {current.category}
          </Txt>
          <Txt v="headlineXl" style={{ fontSize: 46, lineHeight: 50 }}>
            {current.title}
          </Txt>
          <TaskChips task={current} />
          <Cell debossed style={{ gap: space.md - 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
              <Txt v="labelSm" color={colors.onSurfaceVariant}>
                Cycle Progression
              </Txt>
              <Txt v="headlineMd" style={{ flex: 1 }}>
                {current.elapsedMin} / {current.estMin} MIN
              </Txt>
              <Badge label={`${Math.round((current.elapsedMin / current.estMin) * 100)}%`} tone="outlinePrimary" />
            </View>
            <ProgressBar value={current.elapsedMin / current.estMin} height={16} />
          </Cell>
          <Button
            label={current.status === 'paused' ? 'Resume Task' : current.status === 'in_progress' ? 'Continue Task' : 'Open Task'}
            iconRight="arrow_forward"
            size="lg"
            onPress={() => {
              if (current.status === 'paused') setTaskStatus(current.id, 'in_progress');
              openTask(current.id);
            }}
          />
          <Row>
            <Button
              label={current.status === 'paused' ? 'Paused' : 'Pause Log'}
              icon="pause_circle"
              variant="secondary"
              size="sm"
              style={{ flex: 1 }}
              disabled={current.status !== 'in_progress'}
              onPress={() => setTaskStatus(current.id, 'paused')}
            />
            <Button
              label="Checklist"
              icon="checklist"
              variant="secondary"
              size="sm"
              style={{ flex: 1 }}
              onPress={() => openTask(current.id)}
            />
          </Row>
        </Panel>
      )}

      {/* Up next */}
      {next && (
        <Panel>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
            <Badge label="Up Next" />
            <Badge label={`Code: ${next.id}`} tone="neutral" />
            <Txt v="labelXs" color={colors.outline} style={{ flex: 1, textAlign: 'right' }}>
              Staged after {current?.id}
            </Txt>
          </View>
          <Txt v="labelSm" color={colors.onSurfaceVariant}>
            {next.category}
          </Txt>
          <Txt v="headlineXl">{next.title}</Txt>
          <TaskChips task={next} />
          {next.note && (
            <Cell debossed>
              <Txt v="bodySm">
                <Txt v="labelSm" color={colors.primaryContainer}>
                  Caution:{' '}
                </Txt>
                {next.note}
              </Txt>
            </Cell>
          )}
          <Button label="View Task" icon="visibility" variant="ghost" size="lg" onPress={() => openTask(next.id)} />
        </Panel>
      )}

      {/* Queue */}
      <Panel>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <View style={{ width: 8, height: 24, backgroundColor: colors.outline }} />
          <Txt v="headlineMd" style={{ flex: 1 }}>
            Upcoming Queue
          </Txt>
          <Txt v="labelXs" color={colors.onSurfaceVariant}>
            {queue.length} Tasks Pending
          </Txt>
        </View>
        {queue.map((t) => (
          <QueueRow key={t.id} task={t} />
        ))}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingTop: space.sm,
            borderTopWidth: 1,
            borderTopColor: colors.surfaceHighest,
          }}
        >
          <Txt v="labelXs" color={colors.onSurfaceVariant}>
            Shift completion est: 16:30
          </Txt>
          <Txt v="labelXs" color={colors.outline}>
            All permits logged
          </Txt>
        </View>
      </Panel>

      {/* Footer telemetry */}
      <Cell debossed style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="radio" size={16} color={colors.tertiaryContainer} />
          <Txt v="labelSm" color={colors.tertiaryContainer}>
            Site Channel 4: Live
          </Txt>
        </View>
        <Txt v="labelXs" color={colors.onSurfaceVariant}>
          Cab Ambient: 22°C • Hyd Oil: Nominal (68°C)
        </Txt>
      </Cell>
    </Screen>
  );
}

function TaskChips({ task }: { task: Task }) {
  const chips = [
    { icon: task.weather.icon, label: task.weather.label, color: task.weather.label === 'Rainy' ? colors.secondary : colors.primaryContainer },
    { icon: task.tier.icon, label: task.tier.label, color: colors.primaryContainer },
    { icon: 'schedule', label: `Est: ${task.estMin} min`, color: colors.onSurfaceVariant },
    ...(task.predictedMin != null
      ? [{ icon: 'insights', label: `AI: ${task.predictedMin} min`, color: task.prediction?.risk === 'Delayed' ? colors.secondary : colors.tertiaryContainer }]
      : []),
    ...(task.volume ? [{ icon: 'line_weight', label: `Vol: ${task.volume}`, color: colors.tertiaryContainer }] : []),
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
      {chips.map((c) => (
        <View
          key={c.label}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            minHeight: 44,
            paddingHorizontal: space.md - 4,
            backgroundColor: colors.surfaceHigh,
            borderWidth: 1,
            borderColor: colors.outlineVariant,
          }}
        >
          <Icon name={c.icon} size={18} color={c.color} />
          <Txt v="labelMd">{c.label}</Txt>
        </View>
      ))}
    </View>
  );
}

function QueueRow({ task }: { task: Task }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${task.title}`}
      onPress={() => openTask(task.id)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md - 4,
        padding: space.md - 4,
        minHeight: 72,
        backgroundColor: pressed ? colors.surfaceHigh : colors.surfaceLow,
        borderWidth: border.panel,
        borderColor: colors.surfaceHighest,
        borderLeftWidth: 6,
        borderLeftColor: task.accent,
      })}
    >
      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 6,
          backgroundColor: colors.surfaceLowest,
          borderWidth: 1,
          borderColor: colors.surfaceHighest,
        }}
      >
        <Txt v="headlineSm">{task.id}</Txt>
      </View>
      <View style={{ flex: 1 }}>
        <Txt v="headlineSm">{task.title}</Txt>
        <Txt v="labelXs" color={colors.onSurfaceVariant}>
          Est {task.estMin} min{task.predictedMin != null ? ` • AI ${task.predictedMin} min` : ''} •{' '}
          <Txt v="labelXs" color={task.accent}>
            {task.tier.label}
          </Txt>
        </Txt>
      </View>
      <View
        style={{
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surfaceHigh,
          borderWidth: 1,
          borderColor: colors.outlineVariant,
        }}
      >
        <Icon name="chevron_right" size={24} />
      </View>
    </Pressable>
  );
}
