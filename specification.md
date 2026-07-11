# Spécification Technique d'Intégration — Agent RAG FastAPI & Backend PipoLink

Ce document décrit l'architecture d'intégration entre le backend principal de **PipoLink** (Node.js/Hono) et l'**Agent de RAG** (Python/FastAPI). Il spécifie la configuration de l'environnement, le comportement des appels réseaux, les mécanismes de tolérance aux pannes (fallbacks), et les routes de l'API FastAPI à implémenter.

---

## 1. Variable d'Environnement et Mode de Fonctionnement

Le backend PipoLink est conçu pour s'encapsuler de manière optionnelle et robuste avec l'agent RAG via la variable d'environnement suivante :

```bash
RAG_AGENT_API_URL=http://localhost:8000
```

### Comportement du Backend Node.js :
1. **Variable manquante ou vide (`RAG_AGENT_API_URL=""`) :**
   * Le backend bascule automatiquement en mode **Fallback**.
   * Les fonctionnalités de recherche intelligente renvoient un message structuré informant l'utilisateur que le service est en cours de conception ou indisponible.
   * Aucune requête HTTP externe n'est tentée.
2. **Variable présente (`RAG_AGENT_API_URL="http..."`) :**
   * Le backend tente de joindre l'agent FastAPI pour chaque opération RAG (Ingestion, Requête, Suppression d'index, Outils d'étude).
   * **Tolérance aux pannes :** Tous les appels sont encapsulés dans des blocs `try/catch`. En cas d'erreur réseau (ex: serveur FastAPI éteint, timeout ou plantage), le backend attrape l'erreur et sert le message de fallback pour garantir que l'application mobile ne crash jamais.

---

## 2. Intégration du Flux Documentaire & Vectorisation

### 2.1 Ingestion de Document (Background non-bloquant)
* **Déclencheur :** Upload réussi d'un document sur le backend principal (`LibraryService.uploadDocument`).
* **Méthode d'appel Node.js :** Appel asynchrone non-bloquant via `Promise.resolve().then(...)` pour ne pas impacter le temps de réponse de la requête mobile d'upload.
* **API FastAPI ciblée :** `POST /api/v1/ingest`
* **Format :** `multipart/form-data`

#### Payload envoyé par le Backend Node.js :
| Champ | Type | Contenu | Description |
| :--- | :--- | :--- | :--- |
| `file` | `UploadFile` | Fichier binaire (Blob) | Le document physique (converti en `Uint8Array` à partir du Buffer local). |
| `document_id` | `str` | Identifiant UUID | ID unique du document créé dans PostgreSQL. |
| `filiere` | `str` | Nom de la filière | Exemple : "Génie Logiciel" (par défaut "Général"). |
| `niveau` | `str` | Code niveau | Exemple : "L3" (par défaut "Général"). |
| `ue` | `str` | Code de l'UE | Exemple : "Algorithmique" (par défaut "Général"). |
| `type` | `str` | Type de document | COURS, TD, TP, RESUME, AUTRE. |

#### Format de Réponse attendu (JSON) :
```json
{
  "status": "success",
  "document_id": "doc_uuid_12345",
  "chunks_count": 28,
  "message": "Le document a été extrait, segmenté et indexé avec succès."
}
```

---

### 2.2 Suppression d'un document de l'index (Background non-bloquant)
* **Déclencheur :** Suppression d'un document dans la bibliothèque (`LibraryService.deleteDocument`).
* **Méthode d'appel Node.js :** Déclenché asynchronement en arrière-plan.
* **API FastAPI ciblée :** `DELETE /api/v1/documents/{document_id}`

#### Format de Réponse attendu (JSON) :
```json
{
  "status": "success",
  "document_id": "doc_uuid_12345",
  "message": "Tous les vecteurs associés à ce document ont été supprimés de la base de données."
}
```

---

## 3. Intégration du Chat Contextuel et des Outils d'Étude

### 3.1 Requête RAG (Chat interactif)
* **Déclencheur :** Question de l'utilisateur envoyée dans un notebook actif (`AiService.chat`).
* **API FastAPI ciblée :** `POST /api/v1/query`
* **Format :** `application/json`

#### Payload envoyé par le Backend Node.js :
```json
{
  "query": "Quel est le principe de l'algorithme de Dijkstra ?",
  "document_ids": ["doc_uuid_1", "doc_uuid_2"],
  "conversation_history": []
}
```

#### Format de Réponse attendu (JSON) :
```json
{
  "answer": "L'algorithme de Dijkstra permet de trouver le plus court chemin entre un sommet source et tous les autres sommets d'un graphe pondéré..."
}
```

#### Comportement en cas de panne ou d'absence de variable d'environnement :
* **Fallback retourné à l'application mobile :**
  > "Désolé, le service de recherche intelligente et de RAG est actuellement en cours de conception ou indisponible."

---

### 3.2 Génération d'Outils d'Étude (Premium)
* **Déclencheur :** Demande de génération de fiches de révision, résumés ou quiz dans le notebook (`AiService.generateStudyAid`).
* **API FastAPI ciblée :** `POST /api/v1/generate-study-aid`
* **Format :** `application/json`

#### Payload envoyé par le Backend Node.js :
```json
{
  "document_ids": ["doc_uuid_1", "doc_uuid_2"],
  "type": "quiz" 
}
```
*(Les types de génération valides sont : `summary`, `faq`, `quiz`, `flashcards`, `timeline`, `comparison`).*

#### Format de Réponse attendu (JSON) :
```json
{
  "content": "### Quiz d'Évaluation\n\n**Question 1** : ...\n- [ ] A)\n- [x] B)"
}
```

#### Comportement en cas de panne ou d'absence de variable d'environnement :
* **Fallback retourné à l'application mobile :**
  > "### Service en cours de conception\n\nDésolé, la génération automatique d'outils d'étude ({type}) est actuellement indisponible ou en cours de conception."

---

## 4. Spécifications et Algorithmes attendus côté FastAPI (Python)

Pour assurer une cohérence totale avec les appels du backend Node.js, l'agent FastAPI doit suivre les règles suivantes :

### A. Découpage du Texte (Text Splitting)
* Utiliser un diviseur de texte intelligent récursif (comme le `RecursiveCharacterTextSplitter` de LangChain).
* **chunk_size :** 1000 caractères.
* **chunk_overlap :** 200 caractères.
* Les métadonnées de chaque chunk **doivent impérativement** contenir le `document_id`.

### B. Recherche Vectorielle (Retrieval)
* Lors d'une requête (`POST /api/v1/query`), la base de données vectorielle doit appliquer un **filtre de métadonnées strict** sur le tableau `document_ids`.
* **Exemple en SQL / Qdrant :** `Filter(must=[FieldCondition(key="document_id", match=MatchAny(any=document_ids))])`
* Ne jamais mélanger de documents extérieurs à la session active du notebook.

### C. Gestion des Doublons (Déduplication)
* Le backend Node.js calcule l'empreinte numérique SHA-256 du document binaire avant l'upload. Si le fichier existe déjà, il n'est pas envoyé à FastAPI.
* FastAPI peut se concentrer uniquement sur le parsing et l'indexation directe sans avoir à gérer la déduplication au niveau de l'API RAG.
