const API_URL = "http://localhost:3000";

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

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  action: string;
  targetId: string | null;
  ip: string;
  userAgent: string;
  location: string;
  createdAt: string;
}

export interface Document {
  id: string;
  title: string;
  description: string | null;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  mimeType: string;
  downloadCount: number;
  moderationStatus: string;
  createdAt: string;
  uploadedBy: {
    id: string;
    email: string;
    displayName: string;
  };
}

export interface Subscription {
  id: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  providerRef: string | null;
  paidAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export const api = {
  url: API_URL,
  publicurl: API_URL,
  getToken(): string | null {
    return localStorage.getItem("pipolink_admin_token");
  },

  getUser(): User | null {
    const data = localStorage.getItem("pipolink_admin_user");
    return data ? JSON.parse(data) : null;
  },

  setSession(token: string, user: User) {
    localStorage.setItem("pipolink_admin_token", token);
    localStorage.setItem("pipolink_admin_user", JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem("pipolink_admin_token");
    localStorage.removeItem("pipolink_admin_user");
  },

  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!token && !!user && user.role === "admin";
  },

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers = new Headers(options.headers || {});
    
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    
    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.clearSession();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw new Error("Session expirée. Veuillez vous reconnecter.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.code || "Une erreur est survenue.");
    }

    return data.data; // Le format standard ApiResponse.success renvoie { status, data, message }
  },

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const data: any = await this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, loginMode: "primary" }),
    });

    const user = data.user as User;
    if (user.role !== "admin") {
      throw new Error("Accès refusé. Vous devez être administrateur pour vous connecter au Dashboard.");
    }

    this.setSession(data.accessToken, user);
    return { token: data.accessToken, user };
  },

  async getStats(): Promise<{ stats: any; events: AuditLog[] }> {
    return this.request("/admin/stats");
  },

  async getEvents(page = 1, limit = 20): Promise<{ events: AuditLog[]; total: number; page: number; limit: number; totalPages: number }> {
    return this.request(`/admin/events?page=${page}&limit=${limit}`);
  },

  async getUsers(page = 1, limit = 10, search = ""): Promise<{ users: User[]; total: number; page: number; limit: number; totalPages: number }> {
    return this.request(`/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  },

  async banUser(id: string): Promise<void> {
    return this.request(`/admin/users/${id}/ban`, { method: "POST" });
  },

  async restoreUser(id: string): Promise<void> {
    return this.request(`/admin/users/${id}/restore`, { method: "POST" });
  },

  async getDocuments(page = 1, limit = 10, search = ""): Promise<{ documents: Document[]; total: number; page: number; limit: number; totalPages: number }> {
    return this.request(`/admin/documents?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  },

  async deleteDocument(id: string): Promise<void> {
    return this.request(`/admin/documents/${id}`, { method: "DELETE" });
  },

  async getSubscriptions(page = 1, limit = 10): Promise<{ subscriptions: Subscription[]; total: number; page: number; limit: number; totalPages: number }> {
    return this.request(`/admin/subscriptions?page=${page}&limit=${limit}`);
  },

  async getPayments(page = 1, limit = 10): Promise<{ payments: Payment[]; total: number; page: number; limit: number; totalPages: number }> {
    return this.request(`/admin/payments?page=${page}&limit=${limit}`);
  },
};
