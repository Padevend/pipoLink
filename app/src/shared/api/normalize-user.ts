import type { User, UserProfile } from '@/shared/api/types';

export interface UserDevice {
  id: string;
  name: string;
  platform?: string;
  isPrimary?: boolean;
  is_primary?: boolean;
}

export interface UserSubscription {
  plan: string;
  status: string;
}

/** Utilisateur complet (profil, appareils, abonnement) tel que renvoyé par GET /users/me. */
export interface UserWithProfile extends User {
  profile?: UserProfile | null;
  devices?: UserDevice[];
  subscription?: UserSubscription | null;
}

type RawUser = Partial<UserWithProfile> & {
  user?: RawUser;
  data?: RawUser;
};

function normalizeProfile(raw: Partial<UserProfile> | null | undefined): UserProfile | null {
  if (!raw) return null;
  return {
    firstname: raw.firstname ?? '',
    lastname: raw.lastname ?? '',
    phone: raw.phone ?? null,
    gender: raw.gender ?? null,
    niveau: raw.niveau ?? null,
    filiere: raw.filiere ?? null,
    bio: raw.bio ?? null,
    avatarUrl: raw.avatarUrl ?? null,
  };
}

export function normalizeUser(raw: RawUser): UserWithProfile {
  const u = raw.user ?? raw.data ?? raw;
  return {
    id: u.id ?? '',
    email: u.email ?? '',
    username: u.username ?? null,
    role: (u.role ?? 'student') as User['role'],
    is_active: u.is_active ?? true,
    is_configured: u.is_configured ?? false,
    profile: normalizeProfile(u.profile),
    devices: (u.devices ?? []).map((d) => ({
      id: d.id,
      name: d.name,
      platform: d.platform,
      isPrimary: d.isPrimary ?? d.is_primary ?? false,
    })),
    subscription: u.subscription
      ? { plan: u.subscription.plan, status: u.subscription.status }
      : null,
  };
}

export function mergeUserProfile(
  user: UserWithProfile,
  patch: Partial<UserProfile>,
): UserWithProfile {
  return {
    ...user,
    profile: {
      firstname: patch.firstname ?? user.profile?.firstname ?? '',
      lastname: patch.lastname ?? user.profile?.lastname ?? '',
      phone: patch.phone !== undefined ? patch.phone : (user.profile?.phone ?? null),
      gender: patch.gender !== undefined ? patch.gender : (user.profile?.gender ?? null),
      niveau: patch.niveau !== undefined ? patch.niveau : (user.profile?.niveau ?? null),
      filiere: patch.filiere !== undefined ? patch.filiere : (user.profile?.filiere ?? null),
      bio: patch.bio !== undefined ? patch.bio : (user.profile?.bio ?? null),
      avatarUrl:
        patch.avatarUrl !== undefined ? patch.avatarUrl : (user.profile?.avatarUrl ?? null),
    },
  };
}
