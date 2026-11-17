import type { ImageSourcePropType } from 'react-native';
import { API_BASE_URL } from './apiBaseUrl';

export interface MascotAvatarPreset {
  id: 'avatar-1' | 'avatar-2' | 'avatar-3' | 'avatar-4' | 'avatar-5' | 'avatar-6';
  label: string;
  accent: string;
  path: string;
  source: ImageSourcePropType;
}

export const MASCOT_AVATARS: MascotAvatarPreset[] = [
  {
    id: 'avatar-1',
    label: 'Havalı',
    accent: '#EC4899',
    path: '/public/mascots/avatar-1.png',
    source: require('../../assets/images/avatars/avatar-1.png'),
  },
  {
    id: 'avatar-2',
    label: 'Sevimli',
    accent: '#8B5CF6',
    path: '/public/mascots/avatar-2.png',
    source: require('../../assets/images/avatars/avatar-2.png'),
  },
  {
    id: 'avatar-3',
    label: 'Mutlu',
    accent: '#F97316',
    path: '/public/mascots/avatar-3.png',
    source: require('../../assets/images/avatars/avatar-3.png'),
  },
  {
    id: 'avatar-4',
    label: 'Uykucu',
    accent: '#6366F1',
    path: '/public/mascots/avatar-4.png',
    source: require('../../assets/images/avatars/avatar-4.png'),
  },
  {
    id: 'avatar-5',
    label: 'Enerjik',
    accent: '#14B8A6',
    path: '/public/mascots/avatar-5.png',
    source: require('../../assets/images/avatars/avatar-5.png'),
  },
  {
    id: 'avatar-6',
    label: 'Neşeli',
    accent: '#F43F5E',
    path: '/public/mascots/avatar-6.png',
    source: require('../../assets/images/avatars/avatar-6.png'),
  },
];

export function getMascotAvatarUrl(preset: MascotAvatarPreset): string {
  const cleanBase = API_BASE_URL.replace(/\/+$/, '');
  return `${cleanBase}${preset.path}`;
}

export function getMatchingMascotId(uri?: string | null): string | null {
  if (!uri) return null;
  const matched = MASCOT_AVATARS.find(
    (item) => uri.includes(`${item.id}.png`) || uri === `mascot://${item.id}`
  );
  return matched ? matched.id : null;
}

export function resolveAvatarSource(
  uri?: string | null
): ImageSourcePropType | null {
  if (!uri) return null;
  const matched = MASCOT_AVATARS.find(
    (item) => uri.includes(`${item.id}.png`) || uri === `mascot://${item.id}`
  );
  if (matched) {
    return matched.source;
  }
  return { uri };
}
