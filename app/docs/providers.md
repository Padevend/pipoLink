# Providers

Providers in ZiraSpace are located in `src/providers` and are responsible for wrapping the application in essential React Contexts.

## AuthProvider
Manages the user's authentication state, token storage via `expo-secure-store`, and provides methods to login, register, verify OTP, and logout. It seamlessly handles background token loading on startup.

## QueryProvider
Provides the `QueryClient` from `@tanstack/react-query` for all data fetching and caching throughout the app. Includes global settings such as default stale times and error handling.

## ToastProvider
Provides a global notification system accessible via `useToast()`. It renders a floating view for showing success, error, warning, and info messages across the entire app.

## ThemeProvider (via `useTheme`)
While not explicitly wrapping the whole tree as a Context, the theme hook leverages NativeWind's color scheme configuration to sync colors based on the user's system preferences.
