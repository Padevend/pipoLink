# ZiraSpace Mobile App

ZiraSpace is a production-grade, scalable, and offline-first mobile application built using React Native and Expo. It leverages a Feature-Sliced Design (FSD) architecture to ensure maintainability, scalability, and predictable code organization.

## Key Technologies
- **Framework:** React Native / Expo
- **Routing:** Expo Router
- **Language:** TypeScript (Strict Mode)
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Data Fetching & Caching:** TanStack Query
- **State Management:** React Context (for Auth, Theme, Settings)
- **Icons:** Lucide React Native

## Setup Instructions
1. **Prerequisites:** Ensure you have Node.js and `pnpm` installed. You will also need Expo CLI and an Expo Go app or a simulator setup.
2. **Install Dependencies:**
   ```bash
   pnpm install
   ```
3. **Start the development server:**
   ```bash
   pnpm start
   ```

## Documentation
Comprehensive frontend documentation is available in the `docs` folder:
- [Architecture & FSD](docs/architecture.md)
- [Folder Structure](docs/folder-structure.md)
- [Providers](docs/providers.md)
- [WebSocket Integration](docs/websocket.md)
- [Theme System](docs/theme.md)
- [Query System](docs/query.md)
- [Reusable Components](docs/components.md)
- [Routing](docs/routing.md)
- [Environment Configuration](docs/environment.md)
