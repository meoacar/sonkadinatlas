export type SentrySeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

export interface SentryClient {
    init: (options: Record<string, any>) => void;
    setContext: (name: string, context: Record<string, any> | null) => void;
    captureException: (error: unknown) => void;
    captureMessage: (message: string, level?: SentrySeverityLevel) => void;
    setUser: (user: { id?: string; username?: string } | null) => void;
    addBreadcrumb: (breadcrumb: Record<string, any>) => void;
    ReactNativeTracing?: new (options: Record<string, any>) => unknown;
    ReactNavigationInstrumentation?: new () => unknown;
}

const SENTRY_DSN = process.env.SENTRY_DSN;

function loadSentry(): SentryClient | null {
    try {
        // Optional dependency loaded dynamically if installed
        return require('@sentry/react-native') as SentryClient;
    } catch {
        return null;
    }
}

const Sentry = loadSentry();

export function initSentry() {
    if (!SENTRY_DSN || SENTRY_DSN === '__OPTIONAL__') {
        console.log('Sentry DSN not configured, skipping initialization');
        return;
    }

    if (!Sentry) {
        console.log('@sentry/react-native not installed, skipping initialization');
        return;
    }

    const integrations: unknown[] = [];
    if (Sentry.ReactNativeTracing && Sentry.ReactNavigationInstrumentation) {
        integrations.push(
            new Sentry.ReactNativeTracing({
                routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
                enableNativeFramesTracking: !__DEV__,
            }),
        );
    }

    Sentry.init({
        dsn: SENTRY_DSN,
        environment: __DEV__ ? 'development' : 'production',
        release: '1.0.0',
        dist: '1',
        tracesSampleRate: __DEV__ ? 1.0 : 0.2,
        enableAutoSessionTracking: true,
        sessionTrackingIntervalMillis: 30000,
        profilesSampleRate: __DEV__ ? 1.0 : 0.1,
        debug: __DEV__,
        integrations,
        beforeSend(event: any) {
            if (event?.request) {
                delete event.request.cookies;
                if (event.request.headers) {
                    delete event.request.headers.Authorization;
                    delete event.request.headers.Cookie;
                }
            }
            if (event?.user) {
                delete event.user.email;
                delete event.user.ip_address;
            }
            return event;
        },
        ignoreErrors: [
            'Network request failed',
            'Network Error',
            'Failed to fetch',
            'AbortError',
            'Request aborted',
            'Invariant Violation',
            'User cancelled',
            'User denied',
        ],
    });
}

// Helper functions
export function captureException(error: Error, context?: Record<string, any>) {
    if (!Sentry) return;
    if (context) {
        Sentry.setContext('additional', context);
    }
    Sentry.captureException(error);
}

export function captureMessage(message: string, level: SentrySeverityLevel = 'info') {
    Sentry?.captureMessage(message, level);
}

export function setUser(user: { id: string; username?: string }) {
    Sentry?.setUser({
        id: user.id,
        username: user.username,
    });
}

export function clearUser() {
    Sentry?.setUser(null);
}

export function addBreadcrumb(breadcrumb: {
    message: string;
    category?: string;
    level?: SentrySeverityLevel;
    data?: Record<string, any>;
}) {
    Sentry?.addBreadcrumb(breadcrumb);
}

export { Sentry };
