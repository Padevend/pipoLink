const API_URL = "http://127.0.0.1:3000"//"https://api-plink.lyrastudio.org";

import type { User } from "@/entities/users";
export type { User };

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
  isIngested: boolean;
  ingestionStatus: "PENDING" | "PROCESSING" | "INGESTED" | "FAILED";
  ingestionError?: string | null;
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

export interface UpdateLink {
  platform: "android" | "ios";
  link: string;
}

export interface Update {
  id: string;
  version: string;
  changelog: string[];
  isRequired: boolean;
  minSdkVersion: string;
  severity: "low" | "medium" | "high" | "critical";
  type: "auto" | "manual";
  links: UpdateLink[];
  createdAt: string;
}

export interface RevenueStats {
  totalRevenue: number;
  revenueThisMonth: number;
  activePremium: number;
  mrr: number;
}

export interface SystemStats {
  totalAccounts: number;
  activeAccounts: number;
  totalDocuments: number;
  totalAnnouncements: number;
  revenue: RevenueStats;
}


class APIServices{
  public url: string;
  public publicurl: string;

  constructor() {
    this.url = API_URL;
    this.publicurl = API_URL;
    
    // Bind all methods to ensure context is preserved in callbacks
    this.sendRequest = this.sendRequest.bind(this);
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
    this.getMe = this.getMe.bind(this);
    this.getStats = this.getStats.bind(this);
    this.getEvents = this.getEvents.bind(this);
    this.getUsers = this.getUsers.bind(this);
    this.banUser = this.banUser.bind(this);
    this.restoreUser = this.restoreUser.bind(this);
    this.updateUserRole = this.updateUserRole.bind(this);
    this.getDocuments = this.getDocuments.bind(this);
    this.deleteDocument = this.deleteDocument.bind(this);
    this.enqueueDocumentIngestion = this.enqueueDocumentIngestion.bind(this);
    this.getSubscriptions = this.getSubscriptions.bind(this);
    this.getPayments = this.getPayments.bind(this);
    this.getUpdates = this.getUpdates.bind(this);
    this.createUpdate = this.createUpdate.bind(this);
    this.sendBroadcastNotification = this.sendBroadcastNotification.bind(this);
  }

  async sendRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    
    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
    });

    if (response.status === 401) {
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw new Error("Session expirée. Veuillez vous reconnecter.");
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.code || "Une erreur est survenue.");
    }

    return data.data;
  }

  async login(email: string, password: string): Promise<{ user: User }> {
    const data: any = await this.sendRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, loginMode: "primary" }),
    });

    const user = data.user as User;
    if (user.role !== "admin") {
      throw new Error("Accès refusé. Vous devez être administrateur pour vous connecter au Dashboard.");
    }

    return { user };
  }

  async logout(): Promise<void> {
    await this.sendRequest("/auth/logout", { method: "POST" });
  }

  async getMe(): Promise<User> {
    return this.sendRequest("/users/me");
  }

  async getStats(): Promise<{ stats: SystemStats; events: AuditLog[] }> {
    return this.sendRequest<{ stats: SystemStats; events: AuditLog[] }>("/admin/stats");
  }

  async getEvents(page = 1, limit = 20): Promise<{ events: AuditLog[]; total: number; page: number; limit: number; totalPages: number }> {
    return this.sendRequest(`/admin/events?page=${page}&limit=${limit}`);
  }

  async getUsers(page = 1, limit = 10, search = ""): Promise<{ users: User[]; total: number; page: number; limit: number; totalPages: number }> {
    return this.sendRequest(`/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  }

  async banUser(id: string): Promise<void> {
    return this.sendRequest(`/admin/users/${id}/ban`, { method: "POST" });
  }

  async restoreUser(id: string): Promise<void> {
    return this.sendRequest(`/admin/users/${id}/restore`, { method: "POST" });
  }

  async updateUserRole(id: string, role: string): Promise<void> {
    return this.sendRequest(`/admin/users/${id}/role`, {
      method: "POST",
      body: JSON.stringify({ role }),
    });
  }

  async getDocuments(page = 1, limit = 10, search = ""): Promise<{ documents: Document[]; total: number; page: number; limit: number; totalPages: number }> {
    return this.sendRequest(`/admin/documents?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
  }

  async enqueueDocumentIngestion(): Promise<{ queued: number }> {
    return this.sendRequest("/admin/documents/ingest", { method: "POST" });
  }


  async deleteDocument(id: string): Promise<void> {
    return this.sendRequest(`/admin/documents/${id}`, { method: "DELETE" });
  }

  async getSubscriptions(page = 1, limit = 10): Promise<{ subscriptions: Subscription[]; total: number; page: number; limit: number; totalPages: number }> {
    return this.sendRequest(`/admin/subscriptions?page=${page}&limit=${limit}`);
  }

  async getPayments(page = 1, limit = 10): Promise<{ payments: Payment[]; total: number; page: number; limit: number; totalPages: number }> {
    return this.sendRequest(`/admin/payments?page=${page}&limit=${limit}`);
  }

  async getUpdates(): Promise<Update[]> {
    return this.sendRequest("/admin/updates");
  }

  async createUpdate(data: Partial<Update>): Promise<Update> {
    return this.sendRequest("/admin/updates", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async sendBroadcastNotification(data: { title: string; body: string }): Promise<{ recipients: number }> {
    return this.sendRequest("/admin/notifications", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
};

export const api = new APIServices();