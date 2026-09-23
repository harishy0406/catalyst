import { Image } from 'expo-image';
import { StyleProp, ImageStyle } from 'react-native';

const SOURCE = require('../../assets/images/logo-catalyst.png');
const RATIO = 1428 / 348;

/** Catalyst wordmark (white + CAT gold, transparent). Sized by height. */
export function Logo({ height = 28, style }: { height?: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={SOURCE}
      accessibilityLabel="Catalyst"
      contentFit="contain"
      style={[{ height, width: height * RATIO }, style]}
    />
  );
}
