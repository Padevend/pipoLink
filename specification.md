# Spécification Backend FastAPI — Moteur de RAG (Retrieval-Augmented Generation)

Ce document décrit les spécifications techniques pour le développement et l'exposition du service de RAG (Retrieval-Augmented Generation) développé en **Python** avec **FastAPI**. Ce serveur est responsable de l'extraction, de la vectorisation (embeddings), du stockage vectoriel et de la génération de réponses augmentées par le contexte des documents de cours.

---

## 1. Architecture Générale et Outils Recommandés

- **Framework Web :** FastAPI
- **Parsing de Documents :** PyPDF, python-docx, et python-pptx (ou unstructured)
- **Framework de RAG :** LangChain ou LlamaIndex
- **Base de Données Vectorielle :** Qdrant, ChromaDB ou PgVector
- **Modèles d'Embeddings :** `text-embedding-3-small` (OpenAI) ou un modèle local via HuggingFace (ex. `cohere-embed-multilingual-v3.0` ou `bge-m3`)
- **Modèle de Génération (LLM) :** `gpt-4o-mini` (OpenAI), Mistral AI (ex. `mistral-large`), ou un LLM local type Llama-3 / Mistral-7B via Ollama.

---

## 2. Spécification des Routes de l'API

### 2.1 Route d'Ingestion & Vectorisation
Permet d'extraire le texte d'un document, de le découper en segments (chunks), de générer les vecteurs correspondants et de les stocker dans la base vectorielle.

- **Route :** `POST /api/v1/ingest`
- **Format du Body :** `multipart/form-data`

#### Paramètres du Body (Payload) :
| Champ | Type | Obligatoire | Description |
| :--- | :--- | :--- | :--- |
| `file` | `UploadFile` | Oui | Le fichier binaire du document (PDF, DOCX, TXT). |
| `document_id` | `str` | Oui | L'identifiant unique du document dans la base principale. |
| `filiere` | `str` | Non | Filière académique (ex: "Génie Logiciel"). |
| `niveau` | `str` | Non | Niveau d'études (ex: "L3"). |
| `ue` | `str` | Non | Unité d'Enseignement (ex: "Algorithmique"). |
| `type` | `str` | Non | Catégorie (COURS, TD, TP, RESUME, AUTRE). |

#### Format de Réponse :
- **Status Code :** `201 Created`
- **Format :** `application/json`
```json
{
  "status": "success",
  "document_id": "doc_abc123xyz",
  "chunks_count": 42,
  "message": "Le document a été extrait, segmenté et indexé avec succès."
}
```

#### Traitement côté Serveur :
1. **Lecture du fichier :** Récupération du flux binaire.
2. **Extraction de texte :**
   - Utilisation de `PyPDF` pour les PDF.
   - Utilisation de `python-docx` pour les documents Word.
   - Fallback text-brut pour les `.txt`.
3. **Segmentation (Chunking) :**
   - Découper le texte en segments avec un `RecursiveCharacterTextSplitter`.
   - Paramètres suggérés : `chunk_size=1000` caractères, `chunk_overlap=200` caractères.
4. **Métadonnées :** Chaque chunk doit être associé à des métadonnées strictes :
   ```json
   {
     "document_id": "doc_abc123xyz",
     "filiere": "Génie Logiciel",
     "niveau": "L3",
     "ue": "Algorithmique",
     "type": "COURS"
   }
   ```
5. **Génération d'Embeddings :** Appel au modèle vectoriel pour générer les représentations numériques de chaque chunk.
6. **Stockage Vectoriel :** Insertion des points (vecteurs + métadonnées) dans la collection de la VectorDB.

---

### 2.2 Route de Génération RAG (Requête contextuelle)
Permet à l'utilisateur de poser une question à l'IA en limitant sa recherche à un ou plusieurs documents spécifiques.

- **Route :** `POST /api/v1/query`
- **Format du Body :** `application/json`

#### Corps de la Requête (Payload) :
```json
{
  "query": "Explique-moi le théorème de Taylor-Young et donne un exemple.",
  "document_ids": ["doc_123", "doc_456"],
  "conversation_history": [
    {
      "role": "user",
      "content": "Bonjour"
    },
    {
      "role": "assistant",
      "content": "Bonjour ! Comment puis-je vous aider aujourd'hui ?"
    }
  ],
  "temperature": 0.3
}
```

#### Explication des Champs :
- `query` (`str`, obligatoire) : La question posée par l'utilisateur.
- `document_ids` (`List[str]`, obligatoire) : Liste d'identifiants de documents servant de filtre contextuel. La recherche sémantique ne se fera **que** sur ces documents.
- `conversation_history` (`List[Dict]`, optionnel) : Liste ordonnée de messages précédents pour maintenir le contexte du dialogue. Chaque objet contient un `role` (user/assistant) et `content`.
- `temperature` (`float`, optionnel) : Niveau de créativité du LLM (défaut: `0.2` pour maximiser la factualité).

#### Format de Réponse :
- **Status Code :** `200 OK`
- **Format :** `application/json`
```json
{
  "answer": "Le théorème de Taylor-Young permet d'approcher une fonction dérivable au voisinage d'un point par un polynôme...",
  "sources": [
    {
      "document_id": "doc_123",
      "title": "Cours d'Analyse Réelle - Chapitre 2",
      "chunk_text": "...on utilise Taylor-Young pour obtenir un développement limité au voisinage de a...",
      "score": 0.89
    }
  ]
}
```

#### Traitement côté Serveur :
1. **Vectorisation de la requête :** Générer l'embedding de `query`.
2. **Recherche de similarité (Retrieval) :**
   - Effectuer une recherche dans la VectorDB avec le vecteur de la requête.
   - Appliquer un filtre strict de métadonnées : `document_id IN [document_ids]`.
   - Limiter le nombre de résultats (ex: `top_k=4` ou `top_k=5` chunks).
3. **Sélection et Formatage du contexte :** Rassembler le texte des chunks les plus pertinents sous forme de bloc textuel consolidé.
4. **Construction du Prompt Système :**
   - Injecter les chunks sous forme de "Contexte de référence".
   - Demander au LLM de répondre **exclusivement** à l'aide du contexte fourni. Si le contexte ne contient pas l'information, le LLM doit l'indiquer explicitement.
5. **Historique de conversation :** Concaténer l'historique reçu dans la structure de message finale.
6. **Appel LLM (Generation) :** Envoyer le prompt construit au LLM choisi.
7. **Formatage de la réponse :** Renvoyer la réponse générée ainsi que la liste des sources correspondantes pour affichage des citations.

---

### 2.3 Route de Suppression d'Index
Nettoie l'index vectoriel lorsqu'un document est supprimé de la bibliothèque générale.

- **Route :** `DELETE /api/v1/documents/{document_id}`
- **Format du Body :** Aucun (paramètre de path)

#### Format de Réponse :
- **Status Code :** `200 OK`
- **Format :** `application/json`
```json
{
  "status": "success",
  "document_id": "doc_abc123xyz",
  "message": "Tous les vecteurs associés à ce document ont été supprimés de la base de données."
}
```

#### Traitement côté Serveur :
1. Envoyer une commande de suppression à la VectorDB en filtrant sur la métadonnée : `document_id == document_id`.
2. Retourner le message de confirmation après exécution.

---

### 2.4 Route de Diagnostic (Healthcheck)
Permet à l'application ou à l'infrastructure de s'assurer du bon fonctionnement du service.

- **Route :** `GET /api/v1/health`

#### Format de Réponse :
- **Status Code :** `200 OK`
```json
{
  "status": "healthy",
  "vectordb_connected": true,
  "llm_provider_reachable": true
}
```

---

## 3. Recommandations et Points Clés de Conception

### A. Gestion des formats de fichiers et tailles limites
- **Formats recommandés :** `.pdf`, `.docx`, `.pptx`, `.txt`, `.md`.
- **Taille maximale conseillée :** 20 Mo par fichier.
- **MIME Types validés côté serveur :**
  - `application/pdf`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX)
  - `text/plain`

### B. Gestion des Doublons
Lorsqu'un utilisateur uploade un fichier portant le même nom ou identique :
1. **Vérification d'empreinte (Hash SHA-256) :** Il est recommandé de calculer le hash du fichier binaire côté backend principal.
2. Si le hash existe déjà pour cet utilisateur, **ne pas re-vectoriser** le document. Renvoyer simplement l'identifiant existant ou l'associer directement pour éviter les coûts d'embeddings et de stockage en double.

### C. Suivi de Progression (Non-bloquant)
- L'upload étant asynchrone et non-bloquant depuis l'application mobile (géré via des tâches de fond React Query), le backend principal doit recevoir le document, créer son enregistrement dans PostgreSQL à l'état `PENDING_INDEXING`, puis déléguer le travail de vectorisation (FastAPI) via un worker asynchrone (ex: **Celery** ou **FastAPI BackgroundTasks**).
- Dès que FastAPI termine l'ingestion, il notifie le backend principal (par exemple via un webhook interne) qui change le statut en `INDEXED`. L'application mobile met alors à jour l'UI grâce à l'invalidation des queries.
