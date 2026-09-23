import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/tokens';

/**
 * 45° yellow/black hazard striping (DESIGN.md "Hazard Framing").
 * RN has no repeating-linear-gradient, so it's drawn with skewed bars clipped by the container.
 */
export function HazardStripe({
  height = 8,
  color = colors.primaryContainer,
  bg = colors.hazardBlack,
  bar = 12,
}: {
  height?: number;
  color?: string;
  bg?: string;
  bar?: number;
}) {
  const bars = Array.from({ length: 80 });
  return (
    <View style={[styles.wrap, { height, backgroundColor: bg }]}>
      {bars.map((_, i) => (
        <View
          key={i}
          style={{
            width: bar,
            marginRight: bar,
            height: height * 2,
            marginTop: -height / 2,
            backgroundColor: color,
            transform: [{ skewX: '-45deg' }],
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', overflow: 'hidden', width: '100%' },
});
