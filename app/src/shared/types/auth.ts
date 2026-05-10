export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface SessionUser {
  id: string;
  username: string;
  avatarUrl?: string;
  role: 'admin' | 'moderator' | 'member';
}
