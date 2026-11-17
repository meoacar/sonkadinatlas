export const ZODIAC_OPTIONS = [
  { value: 'aries', label: '♈ Koç', nameTr: 'Koç', element: 'Ateş', color: 'red' },
  { value: 'taurus', label: '♉ Boğa', nameTr: 'Boğa', element: 'Toprak', color: 'green' },
  { value: 'gemini', label: '♊ İkizler', nameTr: 'İkizler', element: 'Hava', color: 'gold' },
  { value: 'cancer', label: '♋ Yengeç', nameTr: 'Yengeç', element: 'Su', color: 'cyan' },
  { value: 'leo', label: '♌ Aslan', nameTr: 'Aslan', element: 'Ateş', color: 'orange' },
  { value: 'virgo', label: '♍ Başak', nameTr: 'Başak', element: 'Toprak', color: 'lime' },
  { value: 'libra', label: '♎ Terazi', nameTr: 'Terazi', element: 'Hava', color: 'magenta' },
  { value: 'scorpio', label: '♏ Akrep', nameTr: 'Akrep', element: 'Su', color: 'purple' },
  { value: 'sagittarius', label: '♐ Yay', nameTr: 'Yay', element: 'Ateş', color: 'volcano' },
  { value: 'capricorn', label: '♑ Oğlak', nameTr: 'Oğlak', element: 'Toprak', color: 'geekblue' },
  { value: 'aquarius', label: '♒ Kova', nameTr: 'Kova', element: 'Hava', color: 'blue' },
  { value: 'pisces', label: '♓ Balık', nameTr: 'Balık', element: 'Su', color: 'cyan' },
] as const;

export const ZODIAC_MAP = Object.fromEntries(
  ZODIAC_OPTIONS.map((z) => [z.value, z])
);

export const PERIOD_OPTIONS = [
  { value: 'daily', label: 'Günlük', color: 'blue' },
  { value: 'weekly', label: 'Haftalık', color: 'purple' },
  { value: 'monthly', label: 'Aylık', color: 'magenta' },
] as const;

export const PERIOD_MAP = Object.fromEntries(
  PERIOD_OPTIONS.map((p) => [p.value, p])
);

export const MOON_PHASES = [
  'Yeni Ay',
  'Hilal (Büyüyen)',
  'İlk Dördün',
  'Büyüyen Ay',
  'Dolunay',
  'Küçülen Ay',
  'Son Dördün',
  'Balzamik Ay',
];
