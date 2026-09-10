import type { Href } from 'expo-router';

export function appHref(path: string): Href {
  return path as Href;
}
