# Environment Configuration

The application uses standard `.env` variables supported by Expo.

## Required Variables
Create a `.env` file at the root of the app:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=ws://localhost:3000/ws
```

- `EXPO_PUBLIC_API_URL`: The base URL for the backend REST API.
- `EXPO_PUBLIC_WS_URL`: The WebSocket endpoint for realtime synchronization.

## Accessing Variables
Variables prefixed with `EXPO_PUBLIC_` are automatically bundled and exposed by Expo at runtime. Access them securely in code using `process.env.EXPO_PUBLIC_API_URL`.
