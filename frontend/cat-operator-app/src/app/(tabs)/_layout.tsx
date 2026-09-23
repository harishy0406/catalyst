import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/tabs';

import { TabBar } from '@/components';
import { useApp } from '@/state/AppState';
import { colors } from '@/theme/tokens';

/**
 * Four visible tabs (Home / Tasks / Safety / Profile). Sub-screens live in the same navigator
 * with `href: null` so the bottom bar stays visible, matching every Stitch mock.
 */
export default function TabsLayout() {
  const { signedIn } = useApp();
  if (!signedIn) return <Redirect href="/login" />;

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
