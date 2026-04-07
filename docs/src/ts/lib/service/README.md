# service/ - Singleton Services

Singleton service modules that provide app-wide functionality.

## Files

| File | Export | Purpose |
|------|--------|---------|
| `sparkOnboarding.ts` | `SparkOnboardingService`, `getSparkOnboardingService` | Event bus for the spark onboarding flow. Provides `on()`, `off()`, `emit()`, `removeAllListeners()` methods. Accessed via the `getSparkOnboardingService()` factory (lazy singleton). |

Note: Most singleton services that were historically in this directory (sidebar, analytics, focus, keyboard, storage, etc.) now live as individual files in the `lib/` root. See `lib/sidebar.ts`, `lib/analytics.ts`, `lib/focus.ts`, `lib/keyboard.ts`, `lib/storage.ts`, etc.
