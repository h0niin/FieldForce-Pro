import { Redirect, useLocalSearchParams } from 'expo-router';

export default function StartTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/appointment/${id}`} />;
}
