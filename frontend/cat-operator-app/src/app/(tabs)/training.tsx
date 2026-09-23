import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';

import { Badge, Button, Cell, Icon, Panel, ProgressBar, Screen, Txt } from '@/components';
import { useApp } from '@/state/AppState';
import { colors, space } from '@/theme/tokens';

/** Screen 8 — Training Hub (stitch: screen_8_training_hub). */
export default function Training() {
  const { alertActive, trainingModules, training, completeTraining } = useApp();
  const [started, setStarted] = useState<string | null>(null);
  const { done, total } = training;

  return (
    <Screen header={{ subtitle: 'Cab Unit 04', alert: alertActive }}>
      {/* Title */}
      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, backgroundColor: colors.primaryContainer }} />
          <Txt v="labelMd" color={colors.primaryContainer}>
            CAT Certified Operator Program
          </Txt>
        </View>
        <Txt v="headlineLg">Operator Training</Txt>
        <Cell debossed style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Icon name="timer" size={18} color={colors.tertiaryContainer} />
          <Txt v="labelSm">Break duration: 20 min remaining</Txt>
        </Cell>
      </View>

      {/* Progress */}
      <Panel>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md - 4 }}>
          <View
            style={{
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: colors.primaryContainer,
            }}
          >
            <Icon name="verified" size={24} color={colors.primaryContainer} />
          </View>
          <View>
            <Txt v="labelXs" color={colors.onSurfaceVariant}>
              Curriculum Status
            </Txt>
            <Txt v="headlineMd">Your Progress</Txt>
          </View>
        </View>
        <View style={{ padding: space.sm + 2, borderWidth: 1, borderColor: colors.tertiaryContainer, backgroundColor: colors.surfaceLowest, flexDirection: 'row', gap: 6 }}>
          <Txt v="labelSm" color={colors.tertiaryContainer}>
            ●
          </Txt>
          <Txt v="labelSm" color={colors.tertiaryContainer} style={{ flex: 1 }}>
            Active Certification: Hydraulic Excavator Class A
          </Txt>
        </View>
        <Cell debossed style={{ gap: space.md - 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Txt v="headlineMd">
              {done} / {total} Modules{'\n'}Completed
            </Txt>
            <Txt v="metric" color={colors.primaryContainer}>
              {total ? Math.round((done / total) * 100) : 0}
              <Txt v="headlineMd" color={colors.primaryContainer}>
                %
              </Txt>
            </Txt>
          </View>
          <ProgressBar value={total ? done / total : 0} height={12} />
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            {['Tier 1: Core Systems (Done)', 'Tier 2: Hazard Operations (Active)', 'Tier 3: Advanced Trenching'].map((t, i) => (
              <Txt key={t} v="labelXs" color={i === 1 ? colors.primaryContainer : colors.onSurfaceVariant} style={{ flex: 1 }}>
                {t}
              </Txt>
            ))}
          </View>
        </Cell>
      </Panel>

      {/* Recommended */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm }}>
        <Icon name="school" size={24} color={colors.primaryContainer} />
        <Txt v="headlineMd" style={{ flex: 1 }}>
          Recommended for You
        </Txt>
        <Txt v="labelXs" color={colors.onSurfaceVariant} style={{ maxWidth: 110, textAlign: 'right' }}>
          Tap to launch touch module
        </Txt>
      </View>

      {trainingModules.map((m) => {
        const isStarted = started === m.id;
        const onPress = async () => {
          if (!isStarted) return setStarted(m.id);
          await completeTraining(m.id);
          setStarted(null);
        };
        return (
          <Panel key={m.id} padded={false}>
            <View>
              <Image source={m.image} style={{ width: '100%', aspectRatio: 512 / 279 }} contentFit="cover" />
              <View style={{ position: 'absolute', top: space.sm, left: space.sm }}>
                <Badge label={m.tag.label} icon={m.tag.icon} tone={m.tag.tone} />
              </View>
              <View style={{ position: 'absolute', bottom: space.sm, right: space.sm }}>
                <Badge label={`${m.minutes} min`} icon="schedule" />
              </View>
            </View>
            <View style={{ padding: space.md, gap: 6 }}>
              <Txt v="labelXs" color={m.tag.tone === 'danger' ? colors.secondary : colors.onSurfaceVariant}>
                Module {m.id} • {m.area}
              </Txt>
              <Txt v="headlineMd">{m.title}</Txt>
              <Txt v="bodySm" color={colors.onSurfaceVariant} numberOfLines={2}>
                {m.description}
              </Txt>
              <Button
                label={m.completed ? 'Completed' : isStarted ? 'Mark Complete' : 'Start Module'}
                icon={m.completed ? 'check_circle' : isStarted ? 'check' : 'play_arrow'}
                variant={isStarted || m.completed ? 'safe' : 'primary'}
                disabled={m.completed}
                style={{ marginTop: space.sm }}
                onPress={onPress}
              />
            </View>
          </Panel>
        );
      })}

      {/* Bulletin */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md - 4,
          padding: space.md,
          backgroundColor: colors.surfaceContainer,
          borderWidth: 1.5,
          borderColor: colors.surfaceHighest,
          borderLeftWidth: 6,
          borderLeftColor: colors.primaryContainer,
        }}
      >
        <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceHigh }}>
          <Icon name="campaign" size={24} color={colors.primaryContainer} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt v="labelXs" color={colors.primaryContainer}>
            Shift Bulletin
          </Txt>
          <Txt v="bodyMd">Daily Safety Reminder: Ensure 360° visual check before engaging counterweight swing.</Txt>
        </View>
      </View>
    </Screen>
  );
}
