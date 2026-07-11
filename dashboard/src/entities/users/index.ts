export interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  matricule?: string;
  isActive?: boolean;
  isExcluded?: boolean;
  status?: string;
  createdAt?: string;
  displayName?: string;
}

export function getUserDisplayName(user?: User): string {
  if (!user) return "Invité";
  return user.displayName || user.username || user.email;
}

export function isAdmin(user?: User): boolean {
  return user?.role === "admin";
}

export function isStaff(user?: User): boolean {
  return user?.role === "staff";
}

export function isStudent(user?: User): boolean {
  return user?.role === "student";
}
