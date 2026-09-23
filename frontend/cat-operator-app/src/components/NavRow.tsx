import { Pressable, View } from 'react-native';

import { border, colors, space, touch } from '@/theme/tokens';

import { Icon } from './Icon';
import { Txt } from './Txt';

/**
 * Full-width hotkey row: icon tile, title + caption, chevron.
 * `accent` draws the 6px left severity stripe used on list rows.
 */
export function NavRow({
  icon,
  title,
  caption,
  onPress,
  accent,
  tone = 'default',
}: {
  icon: string;
  title: string;
  caption?: string;
  onPress?: () => void;
  accent?: string;
  tone?: 'default' | 'danger';
}) {
  const danger = tone === 'danger';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: touch.optimal + 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md - 4,
        paddingHorizontal: space.md - 4,
        paddingVertical: space.sm + 2,
        backgroundColor: pressed ? colors.surfaceHighest : danger ? '#2a1214' : colors.surfaceContainer,
        borderWidth: border.strong,
        borderColor: danger ? colors.danger : colors.surfaceHighest,
        borderLeftWidth: accent ? 6 : border.strong,
        borderLeftColor: accent ?? (danger ? colors.danger : colors.surfaceHighest),
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: danger ? colors.secondaryContainer : colors.surfaceHigh,
          borderWidth: 1,
          borderColor: danger ? colors.danger : colors.outlineVariant,
        }}
      >
        <Icon name={icon} size={24} color={danger ? colors.white : colors.primaryContainer} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt v="headlineSm">{title}</Txt>
        {caption && (
          <Txt v="labelXs" color={colors.onSurfaceVariant} style={{ marginTop: 2 }}>
            {caption}
          </Txt>
        )}
      </View>
      <Icon name="chevron_right" size={26} color={danger ? colors.danger : colors.primaryContainer} />
    </Pressable>
  );
}
