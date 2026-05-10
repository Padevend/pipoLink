# Query System

All server state in ZiraSpace is managed using `@tanstack/react-query`. This ensures components remain pure, logic is separated, and complex caching/synchronization issues are handled seamlessly.

## Principles
- **No API calls in components:** Components must use custom hooks located in the `features/` directory.
- **Hook encapsulation:** Every API endpoint has a corresponding custom hook (e.g., `useMessages`, `useLoginUsername`).
- **Mutation invalidation:** When a mutation succeeds (e.g., `useSendMessage`), it automatically invalidates related queries (e.g., `['messages', conversationId]`) to trigger a background refetch and UI update.

## Real-time Sync
For real-time updates (via WebSocket), the app directly updates the TanStack Query cache (`queryClient.setQueryData`) to reflect changes instantly without requiring an extra HTTP roundtrip.
