export const QNA_CATEGORIES = [
  { value: 'MENSTRUAL_HEALTH', label: 'Adet Sağlığı', color: 'magenta' },
  { value: 'PREGNANCY', label: 'Hamilelik', color: 'pink' },
  { value: 'FERTILITY', label: 'Doğurganlık', color: 'gold' },
  { value: 'NUTRITION', label: 'Beslenme', color: 'green' },
  { value: 'EXERCISE', label: 'Egzersiz', color: 'blue' },
  { value: 'MENTAL_HEALTH', label: 'Ruh Sağlığı', color: 'purple' },
  { value: 'SLEEP', label: 'Uyku', color: 'geekblue' },
  { value: 'CONTRACEPTION', label: 'Doğum Kontrolü', color: 'cyan' },
  { value: 'PMS', label: 'PMS', color: 'red' },
  { value: 'MENOPAUSE', label: 'Menopoz', color: 'orange' },
  { value: 'SEXUAL_HEALTH', label: 'Cinsel Sağlık', color: 'volcano' },
  { value: 'GENERAL', label: 'Genel', color: 'default' },
] as const;

export const QNA_CATEGORY_MAP = Object.fromEntries(
  QNA_CATEGORIES.map((c) => [c.value, c])
);

export const QNA_STATUS_MAP: Record<string, { label: string; color: string }> = {
  OPEN: { label: 'Açık', color: 'blue' },
  ANSWERED: { label: 'Cevaplandı', color: 'green' },
  CLOSED: { label: 'Kapalı', color: 'default' },
};

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
