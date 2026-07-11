# Rapport d'Audit Exhaustif PipoLink

## Informations Générales
- **Projet** : PipoLink
- **Périmètre** : Audit de Sécurité et Fonctionnel de bout-en-bout (Mobile + Backend)
- **Objectif** : Identifier les failles de sécurité, les fuites de données, les défauts de logique métier et les risques d'infrastructure.

---

## 1. Vulnérabilités Critiques (CRITICAL)

### 1.1 Maintien des sessions actives après déconnexion, changement de mot de passe ou suppression de compte
**Fichier :** `server/app/middlewares/auth.middleware.ts` / `server/app/services/auth.service.ts`
- **Description** : Le middleware d'authentification valide les JWT (Access Tokens) valables 30 jours en vérifiant uniquement si l'appareil associé (`device.revokedAt`) a été révoqué. Cependant, les méthodes `logout`, `logoutAll` (appelée lors d'un changement de mot de passe) et le service de suppression de compte se contentent de révoquer le `refreshToken` ou d'anonymiser l'utilisateur sans révoquer l'appareil.
- **Conséquence** : Un token JWT volé reste parfaitement valide pendant 30 jours, même si l'utilisateur se déconnecte, modifie son mot de passe pour expulser un intrus, ou supprime son compte.
- **Recommandation** : Le middleware doit vérifier `refreshToken.revokedAt` (via le `tokenId` dans le payload JWT), l'état du compte (`isAnonymized`), ou alors `logoutAll` doit révoquer explicitement tous les appareils.

### 1.2 Corruption des clés E2EE lors du contournement de la récupération (Bypass)
**Fichier :** `server/app/services/auth.service.ts` (`completeRecovery`)
- **Description** : Lorsqu'un utilisateur perd sa clé privée et choisit d'ignorer la récupération (`forceNew: true`), l'application génère un nouveau jeu de clés. Le backend `completeRecovery` copie alors aveuglément les anciens enregistrements `chatMemberKey` vers le nouvel appareil. 
- **Conséquence** : Ces clés de groupe sont chiffrées avec l'ancienne clé publique (que le client n'a plus). Le client sera incapable de les déchiffrer, ce qui provoquera des plantages ou un blocage complet de l'accès aux anciens groupes.
- **Recommandation** : Le backend ne doit pas copier les `chatMemberKey` si une nouvelle identité asymétrique est générée, ou le client doit explicitement envoyer un flag indiquant s'il a pu restaurer la clé ou s'il s'agit d'une nouvelle génération.

### 1.3 Path Traversal lors de la suppression de fichiers
**Fichier :** `server/app/services/file.service.ts` (`deleteFileByUrl`)
- **Description** : La fonction `deleteFileByUrl` utilise un simple `.replace("/storage/", "")` pour extraire le chemin relatif, puis le concatène avec le répertoire de base. Aucune vérification de traversée de répertoire n'est effectuée.
- **Conséquence** : Un attaquant ayant la possibilité de fournir ou de manipuler une URL de fichier (ex: `../../../../etc/passwd`) pourrait forcer le serveur à supprimer des fichiers arbitraires sur le système hôte.
- **Recommandation** : Résoudre le chemin absolu avec `path.resolve` et s'assurer qu'il commence strictement par le `STORAGE_PATH`.

### 1.4 Fuite permanente des fichiers personnels IA à la suppression du compte
**Fichier :** `server/app/services/account-deletion.service.ts`
- **Description** : Lors de la suppression (anonymisation) du compte, le service supprime les `aiSession` et `aiMessage`, mais omet de supprimer les documents de type `AI_ATTACHMENT` et leurs fichiers physiques associés.
- **Conséquence** : Les fichiers PDF/Images personnels uploadés pour l'IA restent stockés indéfiniment sur les serveurs ou sur Google Drive, violant gravement le RGPD et la confidentialité des utilisateurs.
- **Recommandation** : Inclure la suppression physique et logique des documents de type `AI_ATTACHMENT` dans le pipeline de suppression de compte (`_cleanupAuxiliaryData`).

---

## 2. Vulnérabilités Élevées (HIGH)

### 2.1 Perte financière par désynchronisation du fournisseur de paiement
**Fichier :** `server/app/services/payment.service.ts` (`initiatePayment`)
- **Description** : Lors de l'initiation d'un paiement via MeSomb (`makeCollect`), l'ID interne du paiement (`payment.id`) n'est pas fourni au fournisseur (via un champ `reference` ou équivalent). L'association se fait a posteriori en enregistrant `transaction.pk` dans `providerRef`. 
- **Conséquence** : Si la connexion réseau est coupée ou si le serveur plante *après* l'envoi de la requête mais *avant* la réception de la réponse, `providerRef` reste nul. Lorsque le Webhook de succès arrivera, le backend sera incapable de retrouver le paiement, l'utilisateur sera débité mais n'obtiendra jamais son accès Premium.
- **Recommandation** : Transmettre `payment.id` dans le champ de référence/nonce de la transaction MeSomb pour garantir une réconciliation infaillible dans le Webhook.

### 2.2 Vol de temps d'abonnement Premium
**Fichier :** `server/app/services/payment.service.ts` (`completePayment`)
- **Description** : Lorsqu'un utilisateur renouvelle son abonnement, `currentPeriodEnd` est défini arbitrairement à `DateTime.now().plus({ months: 1 })`. 
- **Conséquence** : Si un utilisateur renouvelle son abonnement alors qu'il lui reste 2 semaines de Premium, ces 2 semaines sont écrasées et perdues. 
- **Recommandation** : Calculer la nouvelle date d'expiration en l'additionnant à la date d'expiration existante si celle-ci se trouve dans le futur.

### 2.3 Fuite de stockage physique de la bibliothèque
**Fichier :** `server/app/services/library.service.ts` (`deleteDocument`)
- **Description** : La méthode `deleteDocument` supprime la ligne `document` de la base de données de PostgreSQL, mais ne fait jamais appel à `fileService.deleteFileByUrl` pour supprimer le document de Google Drive ou du système de fichiers local.
- **Conséquence** : Accumulation infinie de fichiers "fantômes", saturant rapidement le stockage de production (surtout avec des PDF académiques).
- **Recommandation** : Appeler impérativement le nettoyage physique avant ou après la suppression en base.

### 2.4 Faille de sécurité E2EE lors de l'invitation de groupe
**Fichier :** `server/app/services/messaging.service.ts` (`joinViaInvitation`)
- **Description** : Contrairement à `addMember`, la méthode de jointure par invitation ne vérifie pas si l'utilisateur entrant a fourni des clés chiffrées (`encryptedKeys`) pour *l'ensemble* de ses appareils actifs. 
- **Conséquence** : Un utilisateur (ou un client altéré) peut rejoindre un groupe sans fournir les clés pour ses autres appareils. Ces derniers seront définitivement exclus de la conversation chiffrée.
- **Recommandation** : Appliquer la même validation stricte des appareils actifs dans `joinViaInvitation` que dans `addMember`.

---

## 3. Problèmes Modérés & Maintenabilité (MEDIUM)

### 3.1 Clés de groupe orphelines (Base de données)
**Fichier :** `server/app/services/messaging.service.ts` / `device.service.ts`
- **Description** : Lorsqu'un utilisateur quitte un groupe (`leaveGroup`, `deleteChat`) ou révoque un appareil (`revokeDevice`), l'application oublie de supprimer les enregistrements `chatMemberKey` correspondants.
- **Conséquence** : La base de données accumule des clés E2EE inutiles qui peuvent perturber le cycle de vie asymétrique.
- **Recommandation** : Inclure des cascades ou des suppressions manuelles systématiques des `chatMemberKey` lors de ces actions.

### 3.2 Race Condition dans l'upload de documents (Contournement de limite Free)
**Fichier :** `server/app/controllers/library.controller.ts` (`uploadDocument`)
- **Description** : Le contrôle `if (count >= 5)` n'est pas sécurisé contre la concurrence. En envoyant plusieurs requêtes HTTP simultanées, un utilisateur `FREE` peut uploader plus de 5 documents avant que le compteur ne soit mis à jour en base de données.
- **Recommandation** : Utiliser un verrouillage côté base (ou un décompte en transaction) si les quotas doivent être stricts.

### 3.3 Race Condition des Webhooks de Paiement
**Fichier :** `server/app/services/payment.service.ts` (`completePayment`)
- **Description** : Si `handleWebhook` et la fin de `initiatePayment` déclenchent `completePayment` simultanément, l'état `payment.status` peut être lu par les deux avant l'écriture.
- **Conséquence** : Bien que mineur financièrement grâce à l'écrasement brut des dates, cela entraîne des emails en double (factures) et des logs d'audit pollués.
- **Recommandation** : Implémenter un verrouillage optimiste sur le statut du `Payment` ou utiliser un bloc de transaction dédié lors de la validation.

---

## Synthèse

L'audit révèle une architecture cryptographique (E2EE) prometteuse mais compromise par des défauts d'intégration au niveau du backend. Les priorités absolues avant la mise en production concernent **la gestion des sessions (révocation inefficace des JWT)** et la **prévention du blocage cryptographique lors du bypass de clé**.

L'implémentation actuelle **n'est pas apte à être déployée en l'état** et nécessite des corrections immédiates sur les points classés CRITICAL.
