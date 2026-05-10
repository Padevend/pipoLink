# Theme System

ZiraSpace leverages **NativeWind** (Tailwind CSS for React Native) to achieve a modern, responsive, and easy-to-use theme system.

## Configuration
- Dark and light modes are configured natively using Expo and NativeWind.
- Global colors and design tokens are set in `tailwind.config.js`.

## Usage
- Use NativeWind classes (e.g., `className="bg-white dark:bg-slate-900"`) for styling.
- Avoid inline styles where possible.
- The `useTheme` hook in `src/shared/hooks/use-theme.ts` provides programmatic access to the current color scheme and theme tokens if needed for complex animations or charting libraries.
