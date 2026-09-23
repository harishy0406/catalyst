import { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { border, colors, space } from '@/theme/tokens';

import { Icon } from './Icon';
import { Txt } from './Txt';

/**
 * Level-1 structural module: #1f1f23 panel with a hard 1.5px seam border, zero radius.
 * Optional 32px+ header strip with icon, uppercase label and a right-aligned status label.
 */
export function Panel({
  children,
  title,
  icon,
  iconColor = colors.primaryContainer,
  right,
  rightColor = colors.onSurfaceVariant,
  borderColor = colors.surfaceHighest,
  borderWidth = border.strong,
  bg = colors.surfaceContainer,
  padded = true,
  style,
}: {
  children?: ReactNode;
  title?: string;
  icon?: string;
  iconColor?: string;
  right?: ReactNode;
  rightColor?: string;
  borderColor?: string;
  borderWidth?: number;
  bg?: string;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ backgroundColor: bg, borderWidth, borderColor }, style]}>
      {title && (
        <View
          style={{
            minHeight: 40,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: space.sm,
            paddingHorizontal: space.md - 4,
            paddingVertical: space.sm,
            backgroundColor: colors.surfaceHigh,
            borderBottomWidth: 1,
            borderBottomColor: colors.surfaceHighest,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, flex: 1 }}>
            {icon && <Icon name={icon} size={18} color={iconColor} />}
            <Txt v="labelMd" color={colors.onSurfaceVariant} style={{ flexShrink: 1 }}>
              {title}
            </Txt>
          </View>
          {typeof right === 'string' ? (
            <Txt v="labelSm" color={rightColor} style={{ flexShrink: 1, textAlign: 'right' }}>
              {right}
            </Txt>
          ) : (
            right
          )}
        </View>
      )}
      {padded ? <View style={{ padding: space.md - 4, gap: space.md - 4 }}>{children}</View> : children}
    </View>
  );
}

/** Level-2 data cell / recessed readout (debossed look via darker top-left border). */
export function Cell({
  children,
  style,
  debossed = false,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  debossed?: boolean;
}) {
  return (
    <View
      style={[
        {
          padding: space.md - 4,
          backgroundColor: debossed ? colors.surfaceLowest : colors.surfaceLow,
          borderWidth: border.panel,
          borderColor: colors.surfaceHighest,
        },
        debossed && {
          borderTopColor: '#0a0b0d',
          borderLeftColor: '#0a0b0d',
          borderTopWidth: 2,
          borderLeftWidth: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** Large telemetry readout: label, big value and right-aligned unit (DESIGN.md "Data Readout"). */
export function Metric({
  label,
  value,
  unit,
  valueColor = colors.onSurface,
  unitColor = colors.primaryContainer,
  icon,
  footerLeft,
  footerRight,
  footerRightColor = colors.tertiaryContainer,
  size = 'lg',
  children,
}: {
  label: string;
  value: string;
  unit?: string;
  valueColor?: string;
  unitColor?: string;
  icon?: string;
  footerLeft?: string;
  footerRight?: string;
  footerRightColor?: string;
  size?: 'lg' | 'md';
  children?: ReactNode;
}) {
  return (
    <Cell>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt v="labelSm" color={colors.onSurfaceVariant}>
          {label}
        </Txt>
        {icon && <Icon name={icon} size={18} color={colors.onSurfaceVariant} />}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6 }}>
        <Txt
          v="metric"
          color={valueColor}
          style={size === 'md' && { fontSize: 36, lineHeight: 40 }}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {value}
        </Txt>
        {unit && (
          <Txt v="labelLg" color={unitColor} style={{ marginBottom: 6 }}>
            {unit}
          </Txt>
        )}
      </View>
      {children}
      {(footerLeft || footerRight) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Txt v="labelXs" color={colors.onSurfaceVariant}>
            {footerLeft}
          </Txt>
          <Txt v="labelXs" color={footerRightColor}>
            {footerRight}
          </Txt>
        </View>
      )}
    </Cell>
  );
}

/** Label/value pair used in small spec grids. */
export function Spec({
  label,
  value,
  unit,
  valueColor = colors.onSurface,
  unitColor = colors.primaryContainer,
  style,
}: {
  label: string;
  value: string;
  unit?: string;
  valueColor?: string;
  unitColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Cell debossed style={[{ flex: 1 }, style]}>
      <Txt v="labelXs" color={colors.onSurfaceVariant}>
        {label}
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
        <Txt v="headlineSm" color={valueColor}>
          {value}
        </Txt>
        {unit && (
          <Txt v="labelSm" color={unitColor}>
            {unit}
          </Txt>
        )}
      </View>
    </Cell>
  );
}
