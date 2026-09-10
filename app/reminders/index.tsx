import { Redirect } from 'expo-router';

/** Redirige la ruta antigua al tab de recordatorios */
export default function RemindersRedirect() {
  return <Redirect href="/(tabs)/reminders" />;
}
