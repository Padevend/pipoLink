# Architecture & FSD (Feature-Sliced Design)

The application follows the **Feature-Sliced Design (FSD)** methodology. This architecture ensures high cohesion and low coupling by organizing code based on its business purpose.

## Layers

FSD enforces a strict hierarchy of layers. A layer can only import from layers below it.

1. **app/**: App-wide setup, routing configuration (Expo Router), global styles, and entry points.
2. **processes/** (Optional): Complex workflows that span multiple features (e.g., Update Manager).
3. **pages/**: Removed in favor of Expo Router's `app` folder routing. Screens are placed directly in the `src/app` directory.
4. **widgets/**: Complex UI blocks built from multiple features and entities (e.g., a complete ChatView with headers and inputs).
5. **features/**: User interactions and business logic (e.g., `messaging`, `auth`, `devices`). This is where hooks, forms, and feature-specific components reside.
6. **entities/**: Business entities and domain data (e.g., `user`, `message`, `conversation`). Includes models, and shared domain logic.
7. **shared/**: Reusable code detached from specific business logic. Includes UI kit, API clients, utility functions, typography, and providers.

## Strict Import Rules

- ❌ A module in `shared` CANNOT import from `features`.
- ❌ A feature in `features/auth` CANNOT import from `features/messaging`. If they need to communicate, it should be done via an entity, a provider, or at the `widgets`/`app` level.
- ✅ A feature CAN import from `entities` and `shared`.
