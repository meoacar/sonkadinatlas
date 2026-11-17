import { api } from './api';

export interface BirthChartRequest {
    birthDate: string; // ISO date string
    birthTime: string; // HH:MM format
    city: string; // City name (e.g., "Istanbul", "Adiyaman")
}

export interface BirthChartResponse {
    sunSign: string;
    risingSign: string;
    moonSign: string;
    sunDegree: number;
    risingDegree: number;
    moonDegree: number;
    birthDate?: string;
    birthTime?: string;
    city?: string;
    source?: 'ephemeris' | 'astronomical-fallback';
}

export interface HoroscopeEntry {
    id: string;
    sign: string;
    period: 'daily' | 'weekly' | 'monthly';
    title?: string | null;
    summary: string;
    loveText?: string | null;
    careerText?: string | null;
    healthText?: string | null;
    loveScore: number;
    careerScore: number;
    healthScore: number;
    energyScore: number;
    luckyNumber: number;
    luckyColor: string;
    luckyStone?: string | null;
    affirmation?: string | null;
    isActive: boolean;
}

export interface CosmicOverview {
    key: string;
    moonPhase: string;
    moonSign: string;
    cosmicTheme: string;
    retrogradeNote?: string | null;
    dailyAffirmation: string;
    energyIndex: number;
    isActive: boolean;
}

export interface SignHoroscopesResponse {
    sign: string;
    daily: HoroscopeEntry | null;
    weekly: HoroscopeEntry | null;
    monthly: HoroscopeEntry | null;
}

export interface CompatibilityResult {
    sign1: string;
    sign2: string;
    overallScore: number;
    loveScore: number;
    communicationScore: number;
    trustScore: number;
    headline: string;
    advice: string;
}

export const astrologyApi = {
    getCosmicOverview: async (): Promise<CosmicOverview> => {
        return api.get<CosmicOverview>('/astrology/cosmic');
    },

    getHoroscopes: async (
        period: 'daily' | 'weekly' | 'monthly' = 'daily',
        sign?: string
    ): Promise<HoroscopeEntry[] | HoroscopeEntry | null> => {
        const params = new URLSearchParams({ period });
        if (sign) params.append('sign', sign);
        return api.get(`/astrology/horoscopes?${params.toString()}`);
    },

    getSignHoroscopes: async (sign: string): Promise<SignHoroscopesResponse> => {
        return api.get<SignHoroscopesResponse>(`/astrology/horoscopes/${sign}`);
    },

    getMyBirthChart: async (): Promise<BirthChartResponse | null> => {
        return api.get<BirthChartResponse | null>('/astrology/my-birth-chart');
    },

    calculateBirthChart: async (data: BirthChartRequest): Promise<BirthChartResponse> => {
        return api.post<BirthChartResponse>('/astrology/birth-chart', data);
    },

    getSunSign: async (birthDate: string): Promise<{ sunSign: string }> => {
        return api.post<{ sunSign: string }>('/astrology/sun-sign', { birthDate });
    },

    calculateCompatibility: async (
        sign1: string,
        sign2: string
    ): Promise<CompatibilityResult> => {
        return api.post<CompatibilityResult>('/astrology/compatibility', { sign1, sign2 });
    },
};
