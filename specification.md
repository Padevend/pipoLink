# Spécification Technique & Architecture Design (ADS) — Agent RAG "HIRO" FastAPI & Backend PipoLink

## 1. Vision Générale & Présentation du Projet

### 1.1 Présentation de HIRO
**HIRO** est l'agent d'Intelligence Artificielle et le compagnon d'apprentissage académique intégré à la plateforme **PipoLink**. Loin d'être un simple chatbot conversationnel générique, HIRO est un moteur d'intelligence documentaire avancé reposant sur une architecture **Retrieval-Augmented Generation (RAG)** multi-sources. 

Il permet aux étudiants :
- De poser des questions complexes et d'obtenir des réponses contextualisées et sourcées sur leurs cours.
- De générer automatiquement des synthèses et outils d'étude : **Résumés, Quiz interactifs, FAQ, Flashcards, Chronologies et Tableaux comparatifs**.
- De réaliser des recherches sémantiques profondes dans la **Bibliothèque Publique PipoLink** et dans leurs **Assets Personnels** (notes, cours, documents PDF).

### 1.2 Principes d'Architecture (ADS)
Le service **HIRO RAG Agent** est conçu selon les principes de la **Clean Architecture**, des principes **SOLID** et du **Domain-Driven Design (DDD)** :
- **Découplage strict des providers IA (`AIProvider`)** : L'interface LLM est abstraite via un système de drivers interchangeables (OpenRouter, DeepSeek R1 Distill, Local Ollama, OpenAI, Anthropic) permettant de basculer de modèle ou de fournisseur par simple variable d'environnement sans altérer le code métier.
- **Isolation Multi-tenant & Sécurité** : Filtrage strict au niveau du Store Vectoriel (Qdrant) garantissant qu'un utilisateur n'accède qu'aux documents publics ou à ses propres assets/notebooks.
- **Haute Tolérance aux Pannes (Fault-Tolerance)** : Les interactions entre le backend PipoLink (Node.js/Hono) et l'agent RAG (FastAPI) intègrent des mécanismes de fallback non-bloquants et des réponses dégradées maîtrisées.
- **Évolutivité à Grande Échelle** : Structure capable d'absorber des millions de chunks vectoriels avec reranking bi-étape (Retrieval dense + Rerank cross-encoder).

---

## 2. Stack Technique Officielle

| Composant | Technologie Spécifiée | Description & Usage |
| :--- | :--- | :--- |
| **Langage** | Python 3.11+ | Performance async, support écosystème Data/AI |
| **Framework Web** | FastAPI | Framework ASGI asynchrone haute performance |
| **Validation & Schemas** | Pydantic v2 | Typpage strict, sérialisation et validation de requêtes |
| **Base Relationnelle** | PostgreSQL | Base principale (Backend Node.js & Prisma) |
| **Base Vectorielle** | Qdrant Cloud / Qdrant Server | Base de données vectorielle avec filtres scalaires poussés |
| **Modèle Embeddings** | `BAAI/bge-m3` | Embedding dense (1024 dimensions) et multi-lingue |
| **Modèle Reranker** | `BAAI/bge-reranker-v2-m3` | Cross-encoder Reranker pour optimiser le Top-N |
| **LLM Moteur** | DeepSeek R1 Distill / OpenRouter | Inférence via OpenRouter avec fallback interchangeable |
| **Stockage Fichiers** | Google Cloud Storage (GCS) / Local | Dépôt distant/local des documents binaires (PDF, DOCX) |
| **Containerisation** | Docker (Multi-stage build) | Image légère basée sur `python:3.11-slim` |
| **Déploiement Cloud** | Google Cloud Run | Conteneurs serverless auto-scalables |
| **CI/CD** | GitHub Actions | Workflows automatisés de test et déploiement |

---

## 3. Architecture Système & Découpage Fonctionnel

```
                                  ┌─────────────────────────────────────────┐
                                  │      Application Mobile PipoLink        │
                                  └────────────────────┬────────────────────┘
                                                       │ HTTP / REST / WSS
                                                       ▼
                                  ┌─────────────────────────────────────────┐
                                  │      Backend Node.js (Hono / Prisma)    │
                                  └────────────────────┬────────────────────┘
                                                       │ HTTP Inter-service
                                                       │ (API Key Secret)
                                                       ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     HIRO RAG AGENT (FastAPI - Python)                                  │
│                                                                                                        │
│  ┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐   ┌─────────────────┐  │
│  │   API Layer / Routers│   │   Ingestion Service  │   │  RAG & Search Engine │   │ StudyAid Engine │  │
│  └──────────┬───────────┘   └──────────┬───────────┘   └──────────┬───────────┘   └────────┬────────┘  │
│             │                          │                          │                        │           │
│             ▼                          ▼                          ▼                        ▼           │
│  ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                      CORE DOMAIN & PIPELINES                                     │  │
│  │  ┌───────────────────────┐   ┌────────────────────────┐   ┌───────────────────────────────────┐  │  │
│  │  │ Text Splitter (1000)  │   │ EmbeddingProvider      │   │ AIProvider (OpenRouter / DeepSeek)│  │  │
│  │  └───────────────────────┘   └────────────────────────┘   └───────────────────────────────────┘  │  │
│  └──────────────────────────────────────┬───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────┼──────────────────────────────────────────────────────────────┘
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    ▼                                           ▼
      ┌───────────────────────────┐               ┌───────────────────────────┐
      │     Qdrant Cloud Store    │               │  Google Cloud Storage /   │
      │   (Vector Index & Payloads)│               │   Local File Storage      │
      └───────────────────────────┘               └───────────────────────────┘
```

---

## 4. Arborescence du Projet Python FastAPI (`hiro-rag-agent/`)

```text
hiro-rag-agent/
├── .github/
│   └── workflows/
│       └── deploy-rag.yml         # CI/CD GitHub Actions vers GCP Cloud Run
├── api/
│   ├── __init__.py
│   ├── dependencies.py            # Injection de dépendances FastAPI (Auth, DB, Services)
│   ├── middleware.py              # Loggers, timing, CORS & API Key verification
│   └── v1/
│       ├── __init__.py
│       ├── router.py              # Agrégateur des routes v1
│       └── endpoints/
│           ├── __init__.py
│           ├── health.py          # GET /health & GET /api/v1/stats
│           ├── ingest.py          # POST /api/v1/ingest & DELETE /api/v1/documents/{id}
│           ├── query.py           # POST /api/v1/query (Chat RAG)
│           ├── study_aid.py       # POST /api/v1/generate-study-aid
│           └── search.py          # POST /api/v1/semantic-search
├── config/
│   ├── __init__.py
│   ├── settings.py                # Configuration Pydantic BaseSettings (.env)
│   └── logging.py                 # Structure des logs JSON structurés
├── core/
│   ├── __init__.py
│   ├── exceptions.py              # Exceptions personnalisées et handlers FastAPI
│   └── security.py                # Validation des clés API et tokens
├── embeddings/
│   ├── __init__.py
│   ├── base.py                    # Interface Abstraite BaseEmbeddingProvider
│   ├── bge_m3.py                  # Implémentation BAAI/bge-m3 (Dense & Sparse)
│   └── factory.py                 # Factory d'instanciation des embeddings
├── llm/
│   ├── __init__.py
│   ├── base.py                    # Interface Abstraite BaseLLMProvider
│   ├── openrouter.py              # Driver OpenRouter (DeepSeek, Claude, Llama)
│   ├── deepseek.py                # Driver Direct DeepSeek API
│   ├── ollama.py                  # Driver Local Ollama (pour Dev/Test)
│   └── factory.py                 # Factory d'instanciation dynamique des LLM
├── prompting/
│   ├── __init__.py
│   ├── builder.py                 # Assemblage dynamique des prompts avec contexte RAG
│   └── templates/
│       ├── chat.py                # Template Réponse synthétique et académique
│       ├── summary.py             # Template Résumé structuré
│       ├── quiz.py                # Template Quiz QCM avec corrections
│       ├── flashcards.py          # Template Cartes de mémoire recto/verso
│       ├── faq.py                 # Template Foire aux Questions
│       ├── timeline.py            # Template Chronologie événementielle
│       └── comparison.py          # Template Tableau comparatif
├── qdrant/
│   ├── __init__.py
│   ├── client.py                  # Initialisation Singleton QdrantClient
│   ├── schema.py                  # Définitions des index, collections et payloads
│   └── repository.py              # Méthodes CRUD & Search sur la base vectorielle
├── rag/
│   ├── __init__.py
│   ├── ingestor.py                # Pipeline d'extraction, découpage & vectorisation
│   ├── retriever.py               # Moteur de recherche hybride (Dense + Filters)
│   └── pipeline.py                # Orchestrateur RAG (Search -> Rerank -> Prompt -> LLM)
├── reranking/
│   ├── __init__.py
│   ├── base.py                    # Interface Abstraite BaseReranker
│   └── bge_reranker.py            # Implémentation bge-reranker-v2-m3
├── scripts/
│   ├── ingest_documents.py        # Ingestion batch en ligne de commande
│   ├── build_embeddings.py        # Script d'embedding masse
│   ├── build_jsonl.py             # Export/Import au format JSONL
│   ├── import_qdrant.py           # Ingestion directe dans Qdrant
│   ├── reindex.py                 # Réindexation complète des collections
│   ├── sync_documents.py          # Synchronisation avec PostgreSQL PipoLink
│   ├── evaluate.py                # Évaluation de la précision du RAG (Ragas/HitRate)
│   ├── backup_vectors.py          # Sauvegarde des données vectorielles
│   └── restore_vectors.py         # Restauration des vecteurs
├── storage/
│   ├── __init__.py
│   ├── base.py                    # Driver de stockage binaire
│   ├── gcs.py                     # Implémentation Google Cloud Storage
│   └── local.py                   # Implémentation Stockage Fichiers Local
├── tests/
│   ├── conftest.py                # Fixtures Pytest
│   ├── test_ingest.py
│   ├── test_query.py
│   ├── test_study_aid.py
│   └── test_search.py
├── .env.example                   # Fichier exemple de variables d'environnement
├── Dockerfile                     # Dockerfile Multi-stage production
├── docker-compose.yml             # Déploiement local complet (FastAPI + Qdrant)
├── pyproject.toml                 # Gestionnaire de dépendances Poetry / UV
├── README.md                      # Documentation d'installation et de contribution
└── main.py                        # Point d'entrée de l'application FastAPI
```

---

## 5. Spécification Détaillée des Endpoints API FastAPI

Tous les endpoints sont préfixés par `/api/v1` et requièrent l'en-tête d'authentification inter-services :
`X-RAG-API-KEY: <SECRET_RAG_KEY>`

---

### 5.1 Health & Status Endpoints

#### `GET /health`
Vérifie la santé opérationnelle du service FastAPI, de la connexion Qdrant et du provider LLM.

- **Request Headers** : Aucun
- **Response Format (`application/json`)** :
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "services": {
    "qdrant": true,
    "llm_provider": "openrouter",
    "embedding_model": "BAAI/bge-m3"
  },
  "timestamp": "2026-07-24T19:00:00Z"
}
```

---

#### `GET /api/v1/stats`
Restaure les statistiques d'indexation vectorielle globalement et par filière.

- **Response Format (`application/json`)** :
```json
{
  "total_vectors": 14250,
  "total_documents": 530,
  "collection_name": "pipolink_academic_chunks",
  "storage_size_mb": 128.4
}
```

---

### 5.2 Endpoint Ingestion Documentaire

#### `POST /api/v1/ingest`
Reçoit un fichier binaire et ses métadonnées académiques, effectue l'extraction de texte, le découpage en chunks, le calcul des embeddings `bge-m3` et l'indexation dans Qdrant Cloud.

- **Content-Type** : `multipart/form-data`
- **Form Parameters (Form Data)** :
  | Paramètre | Type | Requis | Description | Exemple |
  | :--- | :--- | :--- | :--- | :--- |
  | `file` | `UploadFile` | Oui | Fichier binaire (PDF, DOCX, TXT) | `cours_algo.pdf` |
  | `document_id` | `str (UUID)` | Oui | ID unique du document dans PostgreSQL | `c9b8a7f6-1234-4567-89ab-cdef01234567` |
  | `filiere` | `str` | Non | Nom de la filière académique | `Génie Logiciel` |
  | `niveau` | `str` | Non | Code du niveau d'études | `L3` |
  | `ue` | `str` | Non | Unité d'Enseignement | `Algorithmique` |
  | `type` | `str` | Oui | Type de document (`COURS`, `TD`, `TP`, `AI_ATTACHMENT`) | `COURS` |
  | `owner_id` | `str (UUID)` | Non | ID du propriétaire si asset privé | `u1234567-89ab-cdef-0123-456789abcdef` |
  | `notebook_id` | `str (UUID)`| Non | ID du notebook lié si applicable | `n7654321-89ab-cdef-0123-456789abcdef` |

- **Response Format (200 OK)** :
```json
{
  "status": "success",
  "document_id": "c9b8a7f6-1234-4567-89ab-cdef01234567",
  "chunks_count": 28,
  "embedding_model": "BAAI/bge-m3",
  "message": "Le document a été extrait, segmenté et indexé avec succès dans Qdrant."
}
```

- **Schéma Pydantic de Réponse (`IngestResponse`)** :
```python
class IngestResponse(BaseModel):
    status: str = Field(example="success")
    document_id: str = Field(example="c9b8a7f6-1234-4567-89ab-cdef01234567")
    chunks_count: int = Field(example=28)
    embedding_model: str = Field(example="BAAI/bge-m3")
    message: str = Field(example="Le document a été extrait, segmenté et indexé avec succès.")
```

---

### 5.3 Endpoint Suppression Documentaire

#### `DELETE /api/v1/documents/{document_id}`
Supprime l'intégralité des vecteurs (chunks) associés à un document donné dans Qdrant.

- **Path Parameters** :
  - `document_id` (`str`) : UUID du document à purger.
- **Response Format (200 OK)** :
```json
{
  "status": "success",
  "document_id": "c9b8a7f6-1234-4567-89ab-cdef01234567",
  "deleted_chunks": 28,
  "message": "Tous les vecteurs associés à ce document ont été supprimés de la base de données."
}
```

---

### 5.4 Endpoint Chat RAG & Question-Answering

#### `POST /api/v1/query`
Recherche les passages pertinents restreints par le tableau `document_ids`, applique le Reranking `bge-reranker-v2` et génère la réponse via le provider LLM configuré (DeepSeek R1 Distill / OpenRouter).

- **Content-Type** : `application/json`
- **Request Body JSON (`QueryRequest`)** :
```json
{
  "query": "Explique-moi le principe de l'algorithme de Dijkstra et sa complexité.",
  "document_ids": [
    "c9b8a7f6-1234-4567-89ab-cdef01234567",
    "a1b2c3d4-5678-90ab-cdef-1234567890ab"
  ],
  "notebook_id": "n7654321-89ab-cdef-0123-456789abcdef",
  "conversation_history": [
    {
      "role": "user",
      "content": "Quels sont les algorithmes de parcours de graphe ?"
    },
    {
      "role": "assistant",
      "content": "Les deux algorithmes de base sont le parcours en largeur (BFS) et le parcours en profondeur (DFS)..."
    }
  ],
  "max_sources": 5,
  "temperature": 0.3
}
```

- **Response Format (200 OK) (`QueryResponse`)** :
```json
{
  "answer": "L'algorithme de Dijkstra est un algorithme glouton permettant de trouver le plus court chemin entre un sommet source et tous les autres sommets d'un graphe pondéré à poids positifs.\n\n### Principes clés :\n1. Initialisation de la distance de la source à 0 et des autres sommets à l'infini.\n2. Sélection du sommet non visité avec la plus petite distance estimée.\n3. Mise à jour (relâchement) des distances de ses voisins.\n\n### Complexité :\n- Avec une file de priorité (tas binaire) : O((V + E) log V).\n- Avec une matrice d'adjacence : O(V²).",
  "sources": [
    {
      "document_id": "c9b8a7f6-1234-4567-89ab-cdef01234567",
      "file_name": "cours_graphes_l3.pdf",
      "page": 14,
      "score": 0.942,
      "excerpt": "L'algorithme de Dijkstra maintient un ensemble S de sommets dont les distances minimales finales depuis la source ont déjà été déterminées..."
    }
  ],
  "tokens_used": {
    "prompt_tokens": 820,
    "completion_tokens": 240,
    "total_tokens": 1060
  }
}
```

---

### 5.5 Endpoint Génération d'Outils d'Étude

#### `POST /api/v1/generate-study-aid`
Génère du contenu pédagogique structuré en Markdown à partir des documents spécifiés.

- **Content-Type** : `application/json`
- **Request Body JSON (`StudyAidRequest`)** :
```json
{
  "document_ids": [
    "c9b8a7f6-1234-4567-89ab-cdef01234567"
  ],
  "type": "quiz",
  "options": {
    "difficulty": "medium",
    "num_questions": 5
  }
}
```
*Valeurs acceptées pour `type`* : `summary`, `faq`, `quiz`, `flashcards`, `timeline`, `comparison`.

- **Response Format (200 OK) (`StudyAidResponse`)** :
```json
{
  "type": "quiz",
  "content": "### Quiz : Algorithmique des Graphes\n\n**Question 1 :** Quelle est la condition préalable impérative pour appliquer l'algorithme de Dijkstra ?\n- [ ] A) Le graphe doit être non orienté\n- [x] B) Les poids des arcs doivent être strictement non négatifs\n- [ ] C) Le graphe ne doit contenir aucun cycle\n- [ ] D) Le graphe doit être complet\n\n*Explication : Dijkstra échoue en présence de cycles de poids négatifs ou d'arcs négatifs, nécessitant alors l'algorithme de Bellman-Ford.*",
  "sources_used": 3
}
```

---

### 5.6 Endpoint Recherche Sémantique dans la Bibliothèque

#### `POST /api/v1/semantic-search`
Consulte l'index global Qdrant pour trouver les documents les plus proches sémantiquement d'une requête en langage naturel (destiné aux abonnés PREMIUM).

- **Content-Type** : `application/json`
- **Request Body JSON (`SemanticSearchRequest`)** :
```json
{
  "query": "documents traitant des équations de Maxwell et de l'électromagnétisme",
  "user_id": "u1234567-89ab-cdef-0123-456789abcdef",
  "filters": {
    "filiere": "Physique",
    "niveau": "L2",
    "ue": "Électromagnétisme",
    "type": "COURS"
  },
  "limit": 10
}
```

- **Response Format (200 OK) (`SemanticSearchResponse`)** :
```json
{
  "results": [
    {
      "document_id": "d9876543-210a-bcde-f012-3456789abcde",
      "title": "Cours complet d'Électromagnétisme - Chapitre 3",
      "score": 0.895,
      "excerpt": "Les quatre équations de Maxwell régissent l'ensemble des phénomènes électromagnétiques en établissant un lien entre charges, courants et champs..."
    }
  ]
}
```

---

## 6. Architecture RAG, VectorStore & Modèle de Données

### 6.1 Configuration de la Collection Qdrant
- **Nom de la collection** : `pipolink_academic_chunks`
- **Vecteur Dense** : 1024 dimensions (`BAAI/bge-m3`), Métrique Cosine (`Distance.COSINE`).
- **Configuration HNSW** : `m=16`, `ef_construct=100` pour équilibrer vitesse et précision de rappel.

### 6.2 Schema de Payload Chunks (Métadonnées)
Chaque point vectoriel dans Qdrant contient le payload JSON suivant :

```json
{
  "document_id": "c9b8a7f6-1234-4567-89ab-cdef01234567",
  "notebook_id": "n7654321-89ab-cdef-0123-456789abcdef",
  "owner_id": "u1234567-89ab-cdef-0123-456789abcdef",
  "source_type": "LIBRARY", 
  "file_name": "cours_algo.pdf",
  "title": "Cours d'Algorithmique Avancée",
  "niveau": "L3",
  "filiere": "Génie Logiciel",
  "ue": "Algorithmique",
  "type": "COURS",
  "page": 12,
  "chunk_index": 4,
  "text_content": "Contenu brut du chunk...",
  "created_at": "2026-07-24T18:00:00Z"
}
```

### 6.3 Stratégie de Partitionnement & Découpage (Text Splitting)
- **Outil** : `RecursiveCharacterTextSplitter` avec séparateurs `["\n\n", "\n", ". ", " ", ""]`.
- **`chunk_size`** : **1000 caractères**.
- **`chunk_overlap`** : **200 caractères**.
- **Reranking** : Top-K initial de **20 chunks** via Qdrant, réordonnés par `BAAI/bge-reranker-v2-m3` pour retenir le Top-N de **5 chunks** envoyés au LLM.

---

## 7. Architecture du Provider LLM (`AIProvider`)

Pour garantir un remplacement ou basculement de modèle instantané sans modifier la logique applicative, le module `llm/` repose sur une abstraction stricte :

```python
# hiro-rag-agent/llm/base.py
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate_response(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None, 
        temperature: float = 0.3,
        max_tokens: int = 2000
    ) -> Dict[str, Any]:
        """Retourne la réponse textuelle et l'usage des jetons."""
        pass
```

### Drivers d'Implémentation Disponibles :
1. **`OpenRouterLLMProvider`** : Connecteur OpenRouter utilisant `deepseek/deepseek-r1-distill-llama-70b` ou `anthropic/claude-3.5-sonnet`.
2. **`DeepSeekLLMProvider`** : Connecteur natif sur l'API officielle DeepSeek (`deepseek-chat` / `deepseek-reasoner`).
3. **`OllamaLLMProvider`** : Connecteur local pour les environnements de développement déconnectés (`ollama run deepseek-r1:8b`).

---

## 8. Déploiement Cloud & Configuration d'Environnement

### 8.1 Fichier Configuration `.env.example`
```bash
# General Server Config
ENVIRONMENT=production
PORT=8000
LOG_LEVEL=INFO
SECRET_RAG_KEY=votre_cle_secrete_inter_service_tres_longue

# Qdrant Vector Cloud Config
QDRANT_URL=https://xxxx-xxxx.us-east-1-0.aws.cloud.qdrant.io:6333
QDRANT_API_KEY=votre_api_key_qdrant_cloud
QDRANT_COLLECTION_NAME=pipolink_academic_chunks

# LLM Engine Provider Config (openrouter | deepseek | ollama)
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-xxxxxx
OPENROUTER_MODEL=deepseek/deepseek-r1-distill-llama-70b
OPENROUTER_SITE_URL=https://pipolink.app
OPENROUTER_APP_NAME=PipoLink HIRO RAG Agent

# Embeddings & Reranker Config
EMBEDDING_MODEL_NAME=BAAI/bge-m3
RERANKER_MODEL_NAME=BAAI/bge-reranker-v2-m3

# Cloud Storage (Google Cloud Storage)
GCS_BUCKET_NAME=pipolink-documents-storage
GOOGLE_APPLICATION_CREDENTIALS=/app/service-account.json
```

---

### 8.2 Dockerfile Multi-stage (`Dockerfile`)
```dockerfile
# ── Stage 1: Builder & Dependencies ──
FROM python:3.11-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl && \
    rm -rf /var/lib/apt/lists/*

COPY pyproject.toml requirements.txt ./
RUN pip install --no-cache-dir --user -r requirements.txt

# ── Stage 2: Runner ──
FROM python:3.11-slim AS runner

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PATH=/root/.local/bin:$PATH

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 curl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /root/.local /root/.local
COPY . .

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

---

### 8.3 CI/CD GitHub Actions (`.github/workflows/deploy-rag.yml`)
```yaml
name: Deploy HIRO RAG Agent to GCP Cloud Run

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker Auth
        run: gcloud auth configure-docker europe-west1-docker.pkg.dev --quiet

      - name: Build and Push Docker Image
        run: |
          IMAGE_URI="europe-west1-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/pipolink-repo/hiro-rag-agent:${{ github.sha }}"
          docker build -t $IMAGE_URI .
          docker push $IMAGE_URI
          
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy hiro-rag-agent \
            --image europe-west1-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/pipolink-repo/hiro-rag-agent:${{ github.sha }} \
            --platform managed \
            --region europe-west1 \
            --allow-unauthenticated \
            --set-env-vars ENVIRONMENT=production,LLM_PROVIDER=openrouter \
            --set-secrets SECRET_RAG_KEY=RAG_SECRET_KEY:latest,OPENROUTER_API_KEY=OPENROUTER_KEY:latest,QDRANT_API_KEY=QDRANT_KEY:latest
```

---

## 9. Conclusion & Prochaines Étapes
Ce document de spécifications (`specification.md`) fournit l'intégralité du design logiciel et des contrats d'interface pour l'agent RAG **HIRO**. La mise en service de l'agent FastAPI selon ces critères garantira une communication fluide et tolérante aux pannes avec le backend Node.js de PipoLink.
"