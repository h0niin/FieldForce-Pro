import { Redirect, useLocalSearchParams } from 'expo-router';

export default function OnSiteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/appointment/${id}`} />;
}
