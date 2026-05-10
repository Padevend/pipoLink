export interface UserProfile {
  id: string;
  username: string;
  avatarUrl?: string;
  role: 'admin' | 'moderator' | 'member';
  createdAt: string;
}
