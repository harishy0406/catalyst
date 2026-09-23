import { Redirect } from 'expo-router';

/** App always boots into the cab terminal login. */
export default function Index() {
  return <Redirect href="/login" />;
}
