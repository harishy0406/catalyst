import { DimensionValue, View } from 'react-native';

import { colors } from '@/theme/tokens';

export function ProgressBar({
  value,
  color = colors.primaryContainer,
  track = colors.surfaceHighest,
  height = 6,
  segments,
}: {
  /** 0..1 */
  value: number;
  color?: string;
  track?: string;
  height?: number;
  /** When set, renders as N discrete blocks (e.g. training modules). */
  segments?: number;
}) {
  const clamped = Math.max(0, Math.min(1, value));
  if (segments) {
    const filled = Math.round(clamped * segments);
    return (
      <View style={{ flexDirection: 'row', gap: 3, height }}>
        {Array.from({ length: segments }).map((_, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: i < filled ? color : track }} />
        ))}
      </View>
    );
  }
  return (
    <View style={{ height, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${clamped * 100}%` as DimensionValue, height: '100%', backgroundColor: color }} />
    </View>
  );
}
