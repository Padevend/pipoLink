import { env } from "../../config/envManager.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface RagQueryMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface RagQueryPayload {
  query: string;
  document_ids?: string[];
  notebook_id?: string;
  conversation_history?: RagQueryMessage[];
  max_sources?: number;
  temperature?: number;
  max_tokens?: number;
}

export interface RagSourceItem {
  document_id?: string;
  file_name: string;
  page: number;
  score: number;
  excerpt: string;
}

export interface RagTokensUsed {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface RagQueryResponse {
  answer: string;
  sources?: RagSourceItem[];
  tokens_used?: RagTokensUsed;
}

export interface RagIngestPayload {
  file: Buffer;
  originalName: string;
  mimeType: string;
  documentId: string;
  filiere?: string;
  niveau?: string;
  ue?: string;
  type?: string;
  ownerId?: string;
  notebookId?: string;
}

export interface RagStudyAidPayload {
  document_ids: string[];
  type: string;
  options?: Record<string, unknown>;
  max_tokens?: number;
}

export interface RagStudyAidResponse {
  type: string;
  content: string;
  sources_used?: number;
  tokens_used?: RagTokensUsed;
}

export interface RagSemanticSearchPayload {
  query: string;
  user_id?: string;
  filters?: Record<string, unknown>;
  limit?: number;
}

export interface RagSemanticSearchResult {
  document_id: string;
  title?: string;
  score?: number;
  excerpt?: string;
}

export interface RagSemanticSearchResponse {
  results?: RagSemanticSearchResult[];
}

// ── Service ──────────────────────────────────────────────────────────────────

/**
 * Couche d'abstraction centralisée pour toutes les communications avec le
 * RAG Engine. Toute requête passe par `_fetch` qui injecte automatiquement
 * le header `X-RAG-API-KEY` et gère la base URL.
 */
export class RagService {
  private readonly baseUrl: string | undefined;
  private readonly apiKey: string | undefined;

  constructor() {
    this.baseUrl = env.get("RAG_AGENT_API_URL");
    this.apiKey = env.get("RAG_API_KEY");
  }

  // ── Public helpers ───────────────────────────────────────────────────────

  /** Vérifie si le service RAG est configuré (URL présente). */
  isAvailable(): boolean {
    return !!this.baseUrl;
  }

  // ── Query (chat avec le RAG) ─────────────────────────────────────────────

  async query(payload: RagQueryPayload): Promise<RagQueryResponse> {
    return this._fetchJson<RagQueryResponse>("/api/v1/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  // ── Ingestion de document ────────────────────────────────────────────────

  async ingest(payload: RagIngestPayload): Promise<void> {
    const formData = new FormData();
    const fileBlob = new Blob([new Uint8Array(payload.file)], { type: payload.mimeType });
    formData.append("file", fileBlob, payload.originalName);
    formData.append("document_id", payload.documentId);
    if (payload.filiere) formData.append("filiere", payload.filiere);
    if (payload.niveau) formData.append("niveau", payload.niveau);
    if (payload.ue) formData.append("ue", payload.ue);
    if (payload.type) formData.append("type", payload.type);
    if (payload.ownerId) formData.append("owner_id", payload.ownerId);
    if (payload.notebookId) formData.append("notebook_id", payload.notebookId);

    const res = await this._fetch("/api/v1/ingest", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`[RAG Ingest] failed (${res.status} ${res.statusText}): ${errText}`);
    }
  }

  // ── Suppression d'un document indexé ─────────────────────────────────────

  async deleteDocument(documentId: string): Promise<void> {
    const res = await this._fetch(`/api/v1/documents/${documentId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`[RAG Delete] Failed to delete document ${documentId} (${res.status}): ${errText}`);
    }
  }

  // ── Génération d'outils d'étude ──────────────────────────────────────────

  async generateStudyAid(payload: RagStudyAidPayload): Promise<RagStudyAidResponse> {
    return this._fetchJson<RagStudyAidResponse>("/api/v1/generate-study-aid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  // ── Recherche sémantique ─────────────────────────────────────────────────

  async semanticSearch(payload: RagSemanticSearchPayload): Promise<RagSemanticSearchResponse> {
    return this._fetchJson<RagSemanticSearchResponse>("/api/v1/semantic-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  // ── Private : fetch wrapper ──────────────────────────────────────────────

  /**
   * Wrapper autour de `fetch` qui :
   * 1. Résout l'URL à partir de la base URL configurée
   * 2. Injecte le header `X-RAG-API-KEY`
   * 3. Fusionne les headers additionnels fournis par l'appelant
   */
  private async _fetch(path: string, init: RequestInit = {}): Promise<Response> {
    if (!this.baseUrl) {
      throw new Error("[RagService] RAG_AGENT_API_URL is not configured.");
    }

    const url = `${this.baseUrl}${path}`;

    const headers = new Headers(init.headers);
    if (this.apiKey) {
      headers.set("X-RAG-API-KEY", this.apiKey);
    }

    return fetch(url, { ...init, headers });
  }

  /**
   * Comme `_fetch` mais parse automatiquement la réponse JSON et throw
   * si le status HTTP n'est pas OK.
   */
  private async _fetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await this._fetch(path, init);

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "");
      throw new Error(`RAG API responded with status ${res.status}: ${errorBody}`);
    }

    return (await res.json()) as T;
  }
}

