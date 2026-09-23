import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleProp, View, ViewStyle } from 'react-native';

import { border, colors, space, touch, TypeVariant } from '@/theme/tokens';

import { HazardStripe } from './HazardStripe';
import { Icon } from './Icon';
import { Txt } from './Txt';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'critical' | 'safe' | 'ghost';

const VARIANTS: Record<
  ButtonVariant,
  { bg: string; fg: string; border: string; pressedBg: string; pressedBorder: string }
> = {
  primary: {
    bg: colors.primaryContainer,
    fg: colors.onPrimaryContainer,
    border: colors.onPrimary,
    pressedBg: colors.primaryPressed,
    pressedBorder: colors.white,
  },
  secondary: {
    bg: colors.surfaceHigh,
    fg: colors.onSurface,
    border: colors.outlineVariant,
    pressedBg: colors.surfaceHighest,
    pressedBorder: colors.primaryContainer,
  },
  outline: {
    bg: colors.surfaceContainer,
    fg: colors.primaryContainer,
    border: colors.primaryContainer,
    pressedBg: colors.surfaceHighest,
    pressedBorder: colors.primaryContainer,
  },
  critical: {
    bg: colors.secondaryContainer,
    fg: colors.white,
    border: colors.danger,
    pressedBg: colors.errorContainer,
    pressedBorder: colors.white,
  },
  safe: {
    bg: colors.tertiaryContainer,
    fg: colors.onTertiary,
    border: colors.tertiaryContainer,
    pressedBg: colors.tertiary,
    pressedBorder: colors.white,
  },
  ghost: {
    bg: 'transparent',
    fg: colors.onSurface,
    border: colors.outlineVariant,
    pressedBg: colors.surfaceHigh,
    pressedBorder: colors.primaryContainer,
  },
};

/** Gloved-touch button: 56px min height (64 for `size="lg"`), sharp corners, uppercase Barlow. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconRight,
  size = 'md',
  loading,
  disabled,
  hazard,
  style,
  children,
}: {
  label?: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: string;
  iconRight?: string;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  /** Hazard striping across the top edge ("primed" critical action). */
  hazard?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const v = VARIANTS[variant];
  const minHeight = size === 'lg' ? touch.optimal : size === 'md' ? touch.min : 44;
  const textVariant: TypeVariant = size === 'lg' ? 'headlineMd' : size === 'md' ? 'labelLg' : 'labelMd';
  const iconSize = size === 'lg' ? 26 : 20;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          minHeight,
          backgroundColor: pressed ? v.pressedBg : v.bg,
          borderWidth: border.strong,
          borderColor: pressed ? v.pressedBorder : v.border,
          opacity: disabled ? 0.45 : 1,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {hazard && <HazardStripe height={4} bar={8} />}
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.sm + 2,
          paddingHorizontal: space.md,
          paddingVertical: space.sm,
        }}
      >
        {loading ? (
          <ActivityIndicator color={v.fg} />
        ) : (
          icon && <Icon name={icon} size={iconSize} color={v.fg} />
        )}
        {children ??
          (label && (
            <Txt v={textVariant} color={v.fg} style={{ textAlign: 'center', flexShrink: 1 }}>
              {label}
            </Txt>
          ))}
        {iconRight && !loading && <Icon name={iconRight} size={iconSize} color={v.fg} />}
      </View>
    </Pressable>
  );
}

/** Square icon button used in the header (40px visual, 48px hit area). */
export function IconButton({
  icon,
  onPress,
  color = colors.primaryContainer,
  bg = colors.surfaceHigh,
  borderColor = colors.outlineVariant,
  size = 44,
  label,
}: {
  icon: string;
  onPress?: () => void;
  color?: string;
  bg?: string;
  borderColor?: string;
  size?: number;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? icon}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed ? colors.surfaceLowest : bg,
        borderWidth: 1,
        borderColor,
      })}
    >
      <Icon name={icon} size={22} color={color} />
    </Pressable>
  );
}
