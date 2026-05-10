# Routing Documentation

Routing is managed by **Expo Router**, which provides file-based routing.

## Navigation Structure

- `/(auth)`: Unauthenticated routes (Login, Register, OTP). Automatically redirects to the main app if the user is logged in.
- `/(tabs)`: Authenticated routes with a bottom tab bar.
  - `index.tsx`: Chat conversations list.
  - `ai.tsx`: AI Chat interface.
  - `library.tsx`: Document management interface.
  - `settings.tsx`: User profile and settings.
- `/modal`: Screens that appear as modals over the current context (e.g., Device confirmation, OTA update prompts, Uploading files).
- `_layout.tsx`: Root layout that configures providers and checks authentication state globally.

## Deep Linking
Expo Router handles deep linking automatically based on the folder structure. Configure your URI scheme in `app.json` to enable external redirects to specific screens.
