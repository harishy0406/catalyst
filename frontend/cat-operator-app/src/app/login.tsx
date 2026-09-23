import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Button, Cell, HazardStripe, Icon, Logo, Pip, Screen, Txt } from '@/components';
import { machine, OPERATORS, site } from '@/data/mock';
import { useApp } from '@/state/AppState';
import { border, colors, space } from '@/theme/tokens';

/** Screen 1 — Operator Login (stitch: screen_1_operator_login). */
export default function Login() {
  const { signIn } = useApp();
  const [opIndex, setOpIndex] = useState(0);
  const [pin, setPin] = useState('2490'); // prefilled mock PIN, as in the mock
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(false);
  const now = useClock();

  const tap = (d: string) => setPin((p) => (p.length < 4 ? p + d : p));
  const del = () => setPin((p) => p.slice(0, -1));
  const clear = () => setPin('');

  const handleSignIn = () => {
    setLoading(true);
    setToast(true);
    signIn(OPERATORS[opIndex]);
    setTimeout(() => {
      setLoading(false);
      setToast(false);
      router.replace('/home');
    }, 1200);
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLR', '0', 'DEL'];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Screen header={{ logo: true, subtitle: 'Smart Operator Assistant • Cab Terminal' }}>
        {/* Brand block */}
        <View style={{ alignItems: 'center', gap: space.sm, paddingVertical: space.md }}>
          <Logo height={56} />
          <Txt v="labelMd" color={colors.onSurfaceVariant}>
            Smart Operator Assistant
          </Txt>
        </View>
        <View style={{ backgroundColor: colors.surfaceContainer, borderWidth: 2, borderColor: colors.surfaceHighest }}>
          <HazardStripe height={8} />
          <View style={{ padding: space.md + 4, gap: space.lg - 4 }}>
            {/* Title */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                borderBottomWidth: 1,
                borderBottomColor: colors.surfaceHighest,
                paddingBottom: space.md,
              }}
            >
              <View style={{ flex: 1 }}>
                <Txt v="labelSm" color={colors.primaryContainer}>
                  Auth Protocol • Cab Terminal #01
                </Txt>
                <Txt v="headlineXl" style={{ fontSize: 48, lineHeight: 50, marginTop: 4 }}>
                  Operator{'\n'}Login
                </Txt>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Txt v="labelSm" color={colors.onSurfaceVariant}>
                  Terminal Time
                </Txt>
                <Txt v="labelLg" color={colors.primaryContainer} style={{ fontVariant: ['tabular-nums'] }}>
                  {now}
                </Txt>
              </View>
            </View>

            {/* Operator ID */}
            <View style={{ gap: space.sm }}>
              <Txt v="labelMd" color={colors.onSurfaceVariant}>
                Operator ID / Badge Number
              </Txt>
              <View
                style={{
                  flexDirection: 'row',
                  minHeight: 64,
                  borderWidth: 2,
                  borderColor: colors.outlineVariant,
                  backgroundColor: colors.surfaceLowest,
                }}
              >
                <View
                  style={{
                    width: 56,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.surfaceHigh,
                    borderRightWidth: 1,
                    borderRightColor: colors.outlineVariant,
                  }}
                >
                  <Icon name="badge" size={28} color={colors.onSurfaceVariant} />
                </View>
                <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: space.md }}>
                  <Txt v="headlineLg">{OPERATORS[opIndex]}</Txt>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Switch operator"
                  onPress={() => setOpIndex((i) => (i + 1) % OPERATORS.length)}
                  style={({ pressed }) => ({
                    width: 64,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: pressed ? colors.surfaceBright : colors.surfaceHigh,
                    borderLeftWidth: 1,
                    borderLeftColor: colors.outlineVariant,
                  })}
                >
                  <Icon name="swap_horiz" size={24} />
                </Pressable>
              </View>
            </View>

            {/* PIN */}
            <View style={{ gap: space.sm }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Txt v="labelMd" color={colors.onSurfaceVariant}>
                  Security PIN (4-digit entry)
                </Txt>
                <Pressable onPress={clear} hitSlop={10} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon name="backspace" size={16} color={colors.error} />
                  <Txt v="labelSm" color={colors.error}>
                    Clear PIN
                  </Txt>
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', gap: space.md - 4 }}>
                {[0, 1, 2, 3].map((i) => {
                  const filled = i < pin.length;
                  return (
                    <View
                      key={i}
                      style={{
                        flex: 1,
                        height: 64,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.surfaceLowest,
                        borderWidth: 2,
                        borderColor: filled ? colors.primaryContainer : colors.outlineVariant,
                      }}
                    >
                      {filled && (
                        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: colors.primaryContainer }} />
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Keypad */}
              <View
                style={{
                  marginTop: space.sm,
                  padding: space.md - 4,
                  backgroundColor: colors.surfaceLow,
                  borderWidth: 1,
                  borderColor: colors.surfaceHighest,
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: space.sm,
                }}
              >
                {keys.map((k) => (
                  <Key key={k} k={k} onPress={() => (k === 'CLR' ? clear() : k === 'DEL' ? del() : tap(k))} />
                ))}
              </View>
            </View>

            <Button
              label={loading ? 'Connecting...' : 'Sign In'}
              iconRight="login"
              size="lg"
              loading={loading}
              disabled={pin.length < 4}
              onPress={handleSignIn}
            />

            {/* Telematics box */}
            <Cell debossed style={{ gap: space.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.surfaceHighest }}>
                <Icon name="router" size={16} color={colors.tertiaryContainer} />
                <Txt v="labelSm" color={colors.outline}>
                  Telematics & Unit Specifications
                </Txt>
              </View>
              <SpecLine icon="precision_manufacturing" label="Machine" value={`${machine.id} (Hydraulic Excavator)`} />
              <SpecLine icon="schedule" label="Active Shift" value={site.loginShift} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm + 2 }}>
                <View style={{ width: 20, alignItems: 'center' }}>
                  <Pip pulse />
                </View>
                <View>
                  <Txt v="labelXs" color={colors.onSurfaceVariant}>
                    Telemetrics Link
                  </Txt>
                  <Txt v="labelMd" color={colors.tertiaryContainer}>
                    GPS & Telematics: Connected
                  </Txt>
                </View>
              </View>
            </Cell>
          </View>

          {/* Bezel */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 6,
              paddingHorizontal: space.md,
              paddingVertical: space.sm,
              backgroundColor: colors.surfaceHigh,
              borderTopWidth: 1,
              borderTopColor: colors.surfaceHighest,
            }}
          >
            <Txt v="labelSm" color={colors.onSurfaceVariant}>
              Firmware: {machine.firmware}
            </Txt>
            <View style={{ flexDirection: 'row', gap: space.md - 4 }}>
              <BezelItem icon="cell_tower" text="4G LTE 100%" />
              <BezelItem icon="battery_charging_full" text="28.4V Cab Bus" />
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.md, paddingTop: space.sm }}>
          <Txt v="labelSm" color={colors.outline} style={{ flex: 1 }}>
            CAT Heavy Hydraulics • Cabin Mounted Display
          </Txt>
          <Txt v="labelSm" color={colors.outline} style={{ flex: 1, textAlign: 'right' }}>
            ASTM-rated glove touch active
          </Txt>
        </View>
      </Screen>

      {toast && (
        <View
          style={{
            position: 'absolute',
            top: 110,
            left: space.md,
            right: space.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.md - 4,
            padding: space.md - 4,
            backgroundColor: colors.surfaceHigh,
            borderWidth: border.strong,
            borderColor: colors.primaryContainer,
          }}
        >
          <Icon name="verified" size={26} color={colors.primaryContainer} />
          <View style={{ flex: 1 }}>
            <Txt v="labelMd">Operator Authenticated</Txt>
            <Txt v="bodySm" color={colors.onSurfaceVariant}>
              Loading operator profile and pre-shift checklist...
            </Txt>
          </View>
        </View>
      )}
    </View>
  );
}

function Key({ k, onPress }: { k: string; onPress: () => void }) {
  const util = k === 'CLR' || k === 'DEL';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={k === 'DEL' ? 'Delete digit' : k === 'CLR' ? 'Clear PIN' : k}
      onPress={onPress}
      style={({ pressed }) => ({
        flexBasis: '30%',
        flexGrow: 1,
        minHeight: 60,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: pressed
          ? k === 'CLR'
            ? colors.error
            : colors.primaryContainer
          : util
            ? colors.surfaceContainer
            : colors.surfaceHigh,
        borderWidth: 2,
        borderColor: colors.outlineVariant,
      })}
    >
      {({ pressed }) =>
        k === 'DEL' ? (
          <Icon name="backspace" size={24} color={colors.onSurfaceVariant} />
        ) : (
          <Txt
            v={util ? 'labelMd' : 'headlineLg'}
            color={pressed ? colors.onPrimaryContainer : util ? colors.onSurfaceVariant : colors.onSurface}
          >
            {k}
          </Txt>
        )
      }
    </Pressable>
  );
}

function SpecLine({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm + 2 }}>
      <Icon name={icon} size={20} color={colors.primaryContainer} />
      <View style={{ flex: 1 }}>
        <Txt v="labelXs" color={colors.onSurfaceVariant}>
          {label}
        </Txt>
        <Txt v="labelMd" style={{ textTransform: 'none' }}>
          {value}
        </Txt>
      </View>
    </View>
  );
}

function BezelItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Icon name={icon} size={14} color={colors.onSurfaceVariant} />
      <Txt v="labelXs" color={colors.onSurfaceVariant}>
        {text}
      </Txt>
    </View>
  );
}

function useClock() {
  const fmt = () => new Date().toLocaleTimeString('en-GB', { hour12: false });
  const [t, setT] = useState(fmt);
  useEffect(() => {
    const id = setInterval(() => setT(fmt()), 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}
