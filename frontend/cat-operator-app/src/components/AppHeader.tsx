import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, space } from '@/theme/tokens';

import { IconButton } from './Button';
import { HazardStripe } from './HazardStripe';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { Txt } from './Txt';

/**
 * Shared top app bar: construction glyph, gold title, optional subtitle and the
 * warning hotkey (opens the active safety alert).
 */
export function AppHeader({
  title = 'EXC001 • SHIFT ACTIVE',
  subtitle,
  alert = false,
  hazard = false,
  logo = false,
}: {
  title?: string;
  subtitle?: string;
  /** Red warning button — used while a critical alert is active. */
  alert?: boolean;
  /** Hazard striping under the bar. */
  hazard?: boolean;
  /** Show the Catalyst wordmark instead of the wrench glyph + title (pre-login screens). */
  logo?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: colors.surfaceContainer, paddingTop: insets.top }}>
      <View
        style={{
          minHeight: 60,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: space.md,
          gap: space.md - 4,
          borderBottomWidth: 2,
          borderBottomColor: colors.surfaceHighest,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md - 4, flex: 1 }}>
          {logo ? (
            <View style={{ gap: 2 }}>
              <Logo height={26} />
              {subtitle && (
                <Txt v="labelXs" color={colors.onSurfaceVariant} numberOfLines={1}>
                  {subtitle}
                </Txt>
              )}
            </View>
          ) : (
            <>
              <Icon name="construction" size={26} color={colors.primaryContainer} />
              <View style={{ flex: 1 }}>
                <Txt v="headlineSm" color={colors.primaryContainer} numberOfLines={2}>
                  {title}
                </Txt>
                {subtitle && (
                  <Txt v="labelXs" color={colors.onSurfaceVariant} numberOfLines={1}>
                    {subtitle}
                  </Txt>
                )}
              </View>
            </>
          )}
        </View>
        <IconButton
          icon="warning"
          label="Open active safety alert"
          onPress={() => router.push('/alert')}
          color={alert ? colors.white : colors.primaryContainer}
          bg={alert ? colors.secondaryContainer : colors.surfaceHigh}
          borderColor={alert ? colors.danger : colors.outlineVariant}
        />
      </View>
      {hazard && <HazardStripe height={8} />}
    </View>
  );
}
