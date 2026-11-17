import { PremiumClient } from '@/components/PremiumClient';
import { publicApi, type PaywallConfig } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function PremiumPage() {
  let paywall: PaywallConfig | null = null;
  try {
    paywall = await publicApi.getPaywallConfig();
  } catch {
    paywall = null;
  }

  return <PremiumClient paywall={paywall} />;
}
