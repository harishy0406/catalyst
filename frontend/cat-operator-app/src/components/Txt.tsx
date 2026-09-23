import { StyleProp, Text, TextProps, TextStyle } from 'react-native';

import { colors, type as typeScale, TypeVariant } from '@/theme/tokens';

type Props = TextProps & {
  v?: TypeVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
};

/** Text with a design-system type variant applied. */
export function Txt({ v = 'bodyMd', color = colors.onSurface, style, ...rest }: Props) {
  return <Text {...rest} style={[typeScale[v], { color }, style]} />;
}
