export type AuthRoute = '/auth/phone' | '/(tabs)';

export function resolveAuthRoute(isLoggedIn: boolean): AuthRoute {
  return isLoggedIn ? '/(tabs)' : '/auth/phone';
}
