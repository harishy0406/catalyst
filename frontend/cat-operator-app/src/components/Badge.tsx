import { useEffect, useState } from 'react';
import { Animated, StyleProp, View, ViewStyle } from 'react-native';

import { colors } from '@/theme/tokens';

import { Icon } from './Icon';
import { Txt } from './Txt';

type Tone = 'primary' | 'safe' | 'danger' | 'neutral' | 'outlineSafe' | 'outlinePrimary' | 'outlineDanger';

const TONES: Record<Tone, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.primaryContainer, fg: colors.onPrimaryContainer, border: colors.primaryContainer },
  safe: { bg: colors.tertiaryContainer, fg: colors.onTertiary, border: colors.tertiaryContainer },
  danger: { bg: colors.secondaryContainer, fg: colors.white, border: colors.secondaryContainer },
  neutral: { bg: colors.surfaceHighest, fg: colors.onSurface, border: colors.outlineVariant },
  outlineSafe: { bg: 'transparent', fg: colors.tertiaryContainer, border: colors.tertiaryContainer },
  outlinePrimary: { bg: 'transparent', fg: colors.primaryContainer, border: colors.primaryContainer },
  outlineDanger: { bg: 'transparent', fg: colors.secondary, border: colors.secondary },
};

/** Small rectangular annunciator label (sharp corners, uppercase). */
export function Badge({
  label,
  tone = 'neutral',
  icon,
  style,
}: {
  label: string;
  tone?: Tone;
  icon?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const t = TONES[tone];
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          alignSelf: 'flex-start',
          paddingHorizontal: 8,
          paddingVertical: 3,
          backgroundColor: t.bg,
          borderWidth: 1,
          borderColor: t.border,
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={13} color={t.fg} />}
      <Txt v="labelSm" color={t.fg}>
        {label}
      </Txt>
    </View>
  );
}

/** Status LED. `pulse` animates opacity like the Stitch `animate-pulse` dot. */
export function Pip({
  color = colors.tertiaryContainer,
  size = 10,
  round = true,
  pulse = false,
}: {
  color?: string;
  size?: number;
  round?: boolean;
  pulse?: boolean;
}) {
  const opacity = useState(() => new Animated.Value(1))[0];
  useEffect(() => {
    if (!pulse) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, opacity]);
  return (
    <Animated.View
      style={{ width: size, height: size, borderRadius: round ? size / 2 : 0, backgroundColor: color, opacity }}
    />
  );
}
