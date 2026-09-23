import { Tabs } from 'expo-router/tabs';

import { TabBar } from '@/components';
import { colors } from '@/theme/tokens';

/**
 * Four visible tabs (Home / Tasks / Safety / Profile). Sub-screens live in the same navigator
 * with `href: null` so the bottom bar stays visible, matching every Stitch mock.
 */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      backBehavior="history"
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.surface } }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="safety" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="task/[id]" options={{ href: null }} />
      <Tabs.Screen name="alert" options={{ href: null }} />
      <Tabs.Screen name="incident" options={{ href: null }} />
      <Tabs.Screen name="training" options={{ href: null }} />
      <Tabs.Screen name="machine" options={{ href: null }} />
    </Tabs>
  );
}
