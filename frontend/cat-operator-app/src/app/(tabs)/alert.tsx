import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';

import { Badge, Button, Cell, HazardStripe, Icon, Panel, Pip, Screen, Txt } from '@/components';
import { useApp } from '@/state/AppState';
import { border, colors, space } from '@/theme/tokens';

/** Screen 3 — Active Safety Alert (stitch: screen_3_active_safety_alert). */
export default function ActiveAlert() {
  const { alertActive, acknowledgeAlert, activeAlert, machine } = useApp();
  const strobe = useStrobe(alertActive);

  const bg = strobe.interpolate({ inputRange: [0, 1], outputRange: [colors.secondaryContainer, colors.surfaceContainer] });

  return (
    <Screen
      header={{ subtitle: alertActive ? 'Swing brake: auto-engaged' : 'Alert acknowledged', alert: alertActive, hazard: true }}
    >
      {/* Strobing banner */}
      <Animated.View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.md - 4,
          padding: space.md,
          backgroundColor: alertActive ? bg : colors.surfaceContainer,
          borderWidth: 3,
          borderColor: alertActive ? colors.danger : colors.tertiaryContainer,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: colors.white,
          }}
        >
          <Icon name={alertActive ? 'warning' : 'check_circle'} size={32} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt v="labelXs" color={colors.secondary}>
            {alertActive ? 'Critical system override' : 'Operator response logged'}
          </Txt>
          <Txt v="headlineLg" color={colors.white}>
            {alertActive ? 'Critical Safety Alert' : 'Alert Acknowledged'}
          </Txt>
          <Txt v="labelXs" color={colors.onSurfaceVariant}>
            Severity: Code Red-1 • Sensors: Radar-R + Stereo-Cam
          </Txt>
        </View>
      </Animated.View>

      {/* Live alert from the backend safety-rule engine */}
      {activeAlert && (
        <Cell debossed style={{ gap: 4, borderLeftWidth: 4, borderLeftColor: colors.danger }}>
          <Txt v="labelXs" color={colors.secondary}>
            {activeAlert.severity} • {activeAlert.ruleId ?? 'Safety rule'} • {activeAlert.machineId}
          </Txt>
          <Txt v="headlineSm">{activeAlert.message}</Txt>
        </Cell>
      )}

      {/* Person detected */}
      <Panel borderColor={colors.secondary} borderWidth={2}>
        <View style={{ flexDirection: 'row', gap: space.md - 4 }}>
          <View
            style={{
              width: 52,
              height: 52,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surfaceHigh,
              borderWidth: 1,
              borderColor: colors.outlineVariant,
            }}
          >
            <Icon name="person_alert" size={28} color={colors.onSurface} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt v="headlineLg" color={colors.secondary}>
              Person Detected Near Machine
            </Txt>
            <Txt v="bodyLg">
              Worker detected{' '}
              <Txt v="headlineMd" color={colors.primaryContainer}>
                2.8 m
              </Txt>{' '}
              from the machine.
            </Txt>
          </View>
        </View>
        <Cell debossed style={{ flexDirection: 'row', alignItems: 'center', gap: space.md - 4 }}>
          <Icon name="timer" size={28} color={colors.secondary} />
          <View>
            <Txt v="labelXs" color={colors.onSurfaceVariant}>
              Response Protocol
            </Txt>
            <Txt v="headlineSm">{alertActive ? 'Cab Control Locked' : 'Cab Control Restored'}</Txt>
          </View>
        </Cell>
      </Panel>

      {/* Zone monitoring */}
      <Panel
        title="Active Telematics & Zone Monitoring"
        icon="radar"
        right={<Badge label="Proximity Breach" tone="outlineDanger" />}
      >
        <Cell debossed>
          <Txt v="labelSm" color={colors.onSurfaceVariant}>
            Measured Distance
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <Txt v="metric" color={colors.secondary} style={{ fontSize: 72, lineHeight: 76 }}>
              2.8
            </Txt>
            <Txt v="headlineMd" color={colors.primaryContainer} style={{ marginBottom: 12 }}>
              Meters
            </Txt>
          </View>
          <Badge label="Critical zone < 3.0 m" tone="outlineDanger" />
        </Cell>
        <Cell debossed>
          <Txt v="labelSm" color={colors.onSurfaceVariant}>
            Machine & Sector
          </Txt>
          <Txt v="headlineMd">{machine.id}</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icon name="adjust" size={16} color={colors.primaryContainer} />
            <Txt v="labelSm" color={colors.primaryContainer}>
              Rear swing radius (counterweight)
            </Txt>
          </View>
        </Cell>
        <Cell debossed>
          <Txt v="labelSm" color={colors.onSurfaceVariant}>
            Hazard Type
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="nature_people" size={22} color={colors.secondary} />
            <Txt v="headlineMd" color={colors.secondary}>
              Proximity / Personnel
            </Txt>
          </View>
          <Txt v="bodySm">Biometric thermal signature confirmed</Txt>
        </Cell>
        <Cell debossed>
          <Txt v="labelSm" color={colors.onSurfaceVariant}>
            Event Timestamp
          </Txt>
          <Txt v="headlineLg">
            10:42{' '}
            <Txt v="labelMd" color={colors.onSurfaceVariant}>
              AM (UTC+2)
            </Txt>
          </Txt>
          <Txt v="labelXs" color={colors.tertiaryContainer}>
            Latency: 12ms • Direct CAN-Bus
          </Txt>
        </Cell>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="sensors" size={16} color={colors.primaryContainer} />
          <Txt v="labelSm" color={colors.onSurfaceVariant}>
            Radar pulse array: nominal
          </Txt>
        </View>
        {alertActive && (
          <Txt v="labelMd" color={colors.secondary} style={{ fontFamily: 'monospace' }}>
            Operator intervention required immediately
          </Txt>
        )}
      </Panel>

      {/* Threshold comparison */}
      <Panel title="Zone Threshold Comparison" right={<Pip round={false} size={12} color={colors.primaryContainer} />}>
        <View style={{ borderLeftWidth: 4, borderLeftColor: colors.primaryContainer, paddingLeft: space.md - 4, gap: 4, backgroundColor: colors.surfaceLow, paddingVertical: space.md - 4 }}>
          <Txt v="labelXs" color={colors.primaryContainer}>
            Alert Sector 02
          </Txt>
          <Txt v="headlineSm">Proximity warning: object detected within warning zone — 5.2 m</Txt>
        </View>
        <Txt v="bodySm" color={colors.onSurfaceVariant}>
          Secondary LiDAR tracking indicates rapid approach from Blind Spot Delta. Machine hydraulics throttled to 10%
          idle.
        </Txt>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt v="labelXs" color={colors.secondary}>
            2.8m Critical
          </Txt>
          <Txt v="labelXs" color={colors.primaryContainer}>
            5.2m Warning
          </Txt>
          <Txt v="labelXs" color={colors.tertiaryContainer}>
            8.0m Safe
          </Txt>
        </View>
        <View style={{ flexDirection: 'row', height: 10 }}>
          <View style={{ flex: 2.8, backgroundColor: colors.secondary }} />
          <View style={{ flex: 2.4, backgroundColor: colors.primaryContainer }} />
          <View style={{ flex: 2.8, backgroundColor: colors.tertiaryContainer }} />
        </View>
      </Panel>

      {/* Camera feed */}
      <Panel
        title="CAM_04 Rear_Wide"
        icon="videocam"
        iconColor={colors.onSurfaceVariant}
        right={<Badge label="Live" tone="outlineDanger" />}
      >
        <View style={{ borderWidth: border.strong, borderColor: colors.secondary }}>
          <Image source={require('../../../assets/images/rear-cam.jpg')} style={{ width: '100%', aspectRatio: 512 / 279 }} contentFit="cover" />
          <View style={{ position: 'absolute', left: 6, bottom: 6, backgroundColor: colors.black, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Txt v="labelSm" style={{ fontFamily: 'monospace' }}>
              TARGET_ID: WKR-094
            </Txt>
          </View>
        </View>
      </Panel>

      {alertActive ? (
        <Button label="Acknowledge Alert" icon="check_circle" variant="critical" size="lg" hazard onPress={acknowledgeAlert} />
      ) : (
        <Button label="Return to Shift" icon="dashboard" size="lg" onPress={() => router.navigate('/home')} />
      )}
      <Button
        label="View Safety Details & Camera Feed"
        icon="emergency_recording"
        variant="secondary"
        size="lg"
        onPress={() => router.navigate('/safety')}
      />
      <HazardStripe height={10} />
    </Screen>
  );
}

/** Loops 0→1→0 while active — drives the red/panel strobe from DESIGN.md "Hazard Framing". */
function useStrobe(active: boolean) {
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    if (!active) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 450, useNativeDriver: false }),
        Animated.timing(v, { toValue: 0, duration: 450, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, v]);
  return v;
}
