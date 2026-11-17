import { useQuery } from '@tanstack/react-query';
import { featureFlagsService } from '@/services/api';

export interface PublicFeatureFlags {
  maintenance_mode: boolean;
  partner_mode_enabled: boolean;
  community_enabled: boolean;
  astrology_enabled: boolean;
  [key: string]: any;
}

const DEFAULT_FLAGS: PublicFeatureFlags = {
  maintenance_mode: false,
  partner_mode_enabled: true,
  community_enabled: true,
  astrology_enabled: true,
};

export function useFeatureFlags() {
  const { data } = useQuery({
    queryKey: ['publicFeatureFlags'],
    queryFn: () => featureFlagsService.getPublicFlags(),
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
    retry: 1,
  });

  const flags: PublicFeatureFlags = {
    ...DEFAULT_FLAGS,
    ...(data || {}),
  };

  return { flags };
}
