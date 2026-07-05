# Comparatif des Plans PipoLink

Ce document décrit en détail les fonctionnalités, limites techniques et tarifs applicables aux différents plans d'utilisation de **PipoLink**.

---

## Synthèse comparative

| Fonctionnalité | Plan GRATUIT (FREE) | Plan PREMIUM |
| :--- | :--- | :--- |
| **Tarif** | 0 XAF | 1 000 XAF / mois |
| **Moyen de Paiement** | — | Mobile Money (MTN / Orange Money CM) |
| **IA Hiro (Chat)** | Limité à 20 messages par jour | Illimité |
| **Outils d'Étude IA** | Indisponible | Accès complet (Résumés, Quiz, FAQ, Flashcards, etc.) |
| **Import de Documents** | Limité à 5 documents au total | Illimité |
| **Taille Max par Fichier** | 5 Mo | 50 Mo (limite maximale du serveur) |
| **Facturation** | Aucun frais | Facture envoyée par e-mail après chaque paiement |

---

## 1. Plan GRATUIT (FREE)

Le plan par défaut activé lors de l'inscription de l'utilisateur. Il permet de découvrir les fonctionnalités de base de l'application mais présente plusieurs limitations :
*   **Limitation IA** : L'accès à l'assistant d'apprentissage Hiro est limité à **20 questions par jour**. Une fois la limite atteinte, l'utilisateur doit attendre le lendemain (00:00 UTC) ou passer au plan PREMIUM.
*   **Absence d'Outils d'Étude** : La génération automatisée de résumés, quiz, FAQ, flashcards et chronologies à partir de documents est bloquée. L'API renvoie un statut `402 Payment Required` en cas de tentative.
*   **Limitation de Stockage** : La bibliothèque personnelle de l'utilisateur ne peut contenir que **5 documents** actifs en même temps. Pour importer un nouveau document, l'utilisateur doit supprimer une ressource existante.
*   **Taille de Fichier** : Les fichiers individuels importés ne peuvent pas dépasser **5 Mo**.

---

## 2. Plan PREMIUM

Conçu pour les étudiants et chercheurs ayant besoin d'un espace d'apprentissage complet, rapide et sans restrictions :
*   **Accès complet à Hiro** : Chattez sans limitation journalière avec l'assistant IA.
*   **Génération d'Outils d'Étude** : Générez en un clic des fiches de révision, quiz interactifs et chronologies à partir de vos documents importés.
*   **Stockage Étendu** : Importez un nombre illimité de fichiers dans votre espace personnel.
*   **Gros Fichiers** : Importez des fichiers volumineux (livres, thèses, diaporamas complets) jusqu'à **50 Mo** par fichier.
*   **Facturation Transparente** : À chaque paiement ou renouvellement de l'abonnement mensuel (1 000 XAF), une facture formelle au format HTML est transmise sur l'adresse e-mail associée au compte.
*   **Activation Instantanée** : Le plan est activé dès la confirmation du paiement par USSD, et le statut de l'abonnement est propagé en temps réel vers l'application mobile sans rafraîchissement manuel.
