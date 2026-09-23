import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleProp, TextStyle } from 'react-native';

import { colors } from '@/theme/tokens';

/**
 * Stitch designs use Material Symbols names (snake_case). MaterialIcons uses kebab-case,
 * and a few glyphs don't exist there, so they are aliased to the closest match.
 */
const ALIASES: Record<string, string> = {
  rainy: 'thunderstorm',
  person_alert: 'emoji-people',
  e911_emergency: 'sos',
  width: 'straighten',
};

export type IconName = string;

export function Icon({
  name,
  size = 20,
  color = colors.onSurface,
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  const glyph = (ALIASES[name] ?? name.replace(/_/g, '-')) as keyof typeof MaterialIcons.glyphMap;
  return <MaterialIcons name={glyph} size={size} color={color} style={style} />;
}
