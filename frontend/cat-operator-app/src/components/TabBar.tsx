import type { BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

import { Icon } from './Icon';
import { Txt } from './Txt';

const TABS = [
  { route: 'home', label: 'HOME', icon: 'dashboard' },
  { route: 'tasks', label: 'TASKS', icon: 'assignment' },
  { route: 'safety', label: 'SAFETY', icon: 'shield' },
  { route: 'profile', label: 'PROFILE', icon: 'person' },
] as const;

/**
 * Which bottom tab lights up for each (hidden) sub-screen — mirrors the Stitch mocks,
 * e.g. Task Detail keeps TASKS active, Incident Report keeps SAFETY active.
 */
const OWNER: Record<string, (typeof TABS)[number]['route']> = {
  home: 'home',
  machine: 'home',
  tasks: 'tasks',
  'task/[id]': 'tasks',
  safety: 'safety',
  alert: 'safety',
  incident: 'safety',
  training: 'safety',
  profile: 'profile',
};

/** Bottom nav: 4 equal cells, active cell flips to solid safety-gold fill. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]?.name ?? 'home';
  const active = OWNER[current] ?? 'home';
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surfaceContainer,
        borderTopWidth: 2,
        borderTopColor: colors.surfaceHighest,
        paddingBottom: insets.bottom,
      }}
    >
      {TABS.map((t) => {
        const on = t.route === active;
        return (
          <Pressable
            key={t.route}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={t.label}
            onPress={() => navigation.navigate(t.route)}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 64,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              backgroundColor: on ? colors.primaryContainer : pressed ? colors.surfaceHigh : 'transparent',
            })}
          >
            <Icon name={t.icon} size={24} color={on ? colors.onPrimaryContainer : colors.onSurfaceVariant} />
            <Txt v="labelSm" color={on ? colors.onPrimaryContainer : colors.onSurfaceVariant}>
              {t.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
