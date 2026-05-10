# Folder Structure

```
src/
├── app/                  # Expo Router routes and screens
│   ├── (auth)/           # Authentication screens
│   ├── (tabs)/           # Main tab navigation
│   ├── modal/            # Modal screens
│   └── _layout.tsx       # Root layout
├── entities/             # Business domain models
│   ├── conversation/
│   ├── message/
│   └── user/
├── features/             # Business features & interactions
│   ├── auth/             # Login, register, OTP hooks and components
│   ├── chat-ai/          # AI Chat interaction logic
│   ├── devices/          # Device management logic
│   ├── library/          # Document library interactions
│   ├── messaging/        # Realtime chat hooks and components
│   └── updates/          # OTA update hooks
├── processes/            # Cross-feature workflows
│   └── update-manager/
├── providers/            # Global React Context providers
│   ├── auth-provider.tsx
│   ├── query-provider.tsx
│   └── toast-provider.tsx
├── shared/               # Reusable primitives
│   ├── api/              # API clients and interfaces
│   ├── constants/        # Global constants and colors
│   ├── crypto/           # E2E encryption utilities
│   ├── hooks/            # Generic React hooks
│   ├── lib/              # Generic utility functions
│   ├── ui/               # Generic UI kit components
│   └── websocket/        # Realtime WebSocket manager
└── styles/               # Global NativeWind styles
```
