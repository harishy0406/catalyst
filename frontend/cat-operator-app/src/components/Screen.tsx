import { ReactNode } from 'react';
import { ScrollView, StyleProp, View, ViewStyle } from 'react-native';

import { useApp } from '@/state/AppState';
import { colors, space } from '@/theme/tokens';

import { AppHeader } from './AppHeader';
import { Pip } from './Badge';
import { Txt } from './Txt';

/** Standard screen: shared header + scrolling column with 16px gutters and 12px module gaps. */
export function Screen({
  children,
  header,
  contentStyle,
}: {
  children: ReactNode;
  header?: Parameters<typeof AppHeader>[0] | false;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {header !== false && <AppHeader {...header} />}
      <SimulatedFeedStrip />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[{ padding: space.md, gap: space.md - 4, paddingBottom: space.xl }, contentStyle]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

/** Shown while the supervisor's demo stream is feeding this operator's machine, so nobody mistakes it for a real machine. */
function SimulatedFeedStrip() {
  const { simulation } = useApp();
  if (!simulation?.forMe) return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: space.sm,
        paddingVertical: 4,
        backgroundColor: colors.surfaceHighest,
        borderBottomWidth: 1,
        borderBottomColor: colors.primaryContainer,
      }}
    >
      <Pip size={8} color={colors.primaryContainer} pulse />
      <Txt v="labelXs" color={colors.primaryContainer}>
        Simulated feed • demo stream
      </Txt>
    </View>
  );
}

/** Horizontal row with equal-width children. */
export function Row({ children, gap = space.sm, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', gap }, style]}>{children}</View>;
}

export function Divider({ color = colors.surfaceHighest }: { color?: string }) {
  return <View style={{ height: 1, backgroundColor: color }} />;
}
