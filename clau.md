PipoLink — Sync conversations, perf, notifications push, bouton événement, notifs dashboard

 Contexte

 L'app mobile (Expo, app/) affiche des conversations supprimées car la base SQLite locale est alimentée en « upsert only » — rien n'est jamais supprimé localement quand le serveur ne renvoie
 plus une conversation. Les notifications push affichent des textes génériques (« PipoLink / Nouveau message ») car le serveur (server/) envoie un payload FCM hybride notification+data que
 l'OS affiche tel quel quand l'app est fermée ; les annonces et les messages envoyés via REST n'envoient aucun push. Objectifs :

 1. Sync conversations : au démarrage, afficher le cache local instantanément, puis la liste serveur remplace (pas fusionne) la DB locale.
 2. Performance : app rapide/fluide en mauvaise connexion, économe en données/batterie.
 3. Notifs riches : contenu réel (privé : nom envoyeur + message déchiffré ; groupe : nom groupe + envoyeur + message ; annonces et notifs admin avec vrai titre/contenu).
 4. Livraison app fermée : push data-only + handler background natif (@react-native-firebase/messaging + Notifee) — choix validé par l'utilisateur (nouveau build natif accepté).
 5. Bouton « Créer un événement » : carte fermable en haut de la liste des conversations (choix validé), ouvre https://ticky-landing.azariats.cloud.
 6. Dashboard : page pour envoyer une notification (titre + contenu) à tous les utilisateurs actifs (choix validé).

 Ordre critique de déploiement : le nouveau binaire client (C) doit être diffusé AVANT que le serveur passe en push data-only, sinon les anciens binaires n'affichent plus rien. Séquence : PR1
 app JS (A+B+D, OTA-compatible) → PR2 app binaire natif (C-client, v1.1.0) → PR3 serveur (C-server + E-server) → PR4 dashboard.

 ---
 Workstream A — Sync conversations : remplacer, pas fusionner

 A1. app/src/shared/storage/local-db.ts — nouvelle méthode replaceConversations(items)

 - Extraire le corps d'insertion de upsertConversations (lignes 36–52) dans un helper privé insertConversationRow(c).
 - replaceConversations dans db.withTransactionSync() :
   - ids = ids normalisés ; si liste vide → DELETE FROM conversations / messages / pending_messages ; sinon DELETE ... WHERE id NOT IN (?,...) (et conversation_id NOT IN pour messages +
 pending_messages), puis réinsertion de chaque ligne via le helper.
 - Garder upsertConversations pour les mises à jour incrémentales WS (realtime-sync ne doit jamais supprimer).

 A2. app/src/entities/conversation/hooks.ts — useConversations (lignes 15–33)

 - queryFn : localDb.replaceConversations(remote) au lieu de upsertConversations.
 - Bug fix : dans le catch, si le cache est vide, throw e (actuellement retourne undefined silencieusement).
 - initialData inchangé → le local s'affiche instantanément, remplacé dès la réponse serveur.

 A3. app/src/processes/offline-sync/index.ts — syncFromServer() (ligne ~15)

 - upsertConversations(conversations) → replaceConversations(conversations).

 Vérification : supprimer un chat (autre appareil ou soi-même) → rouvrir l'app → il ne réapparaît jamais (y compris après reconnexion WS et redémarrage complet) ; mode avion → la liste locale
 reste intacte ; liste serveur vide → vide le local.

 ---
 Workstream B — Performance / données / batterie (OTA)

 Par priorité, tout à faible risque :

 1. Transactions SQLite — local-db.ts : envelopper les boucles de upsertConversations, upsertMessages, upsertAiSessions, upsertAiMessages, upsertUsers dans db.withTransactionSync(). (Corriger
 au passage le bug clearDownlaodHistory : SQL invalide IN [completed,...] → IN ('completed','failed','cancelled').)
 2. Ligne conversation — app/src/entities/conversation/ui/conversation-item.tsx : supprimer le console.log (ligne 49), React.memo, cache module-level des aperçus déchiffrés Map<lastMessageId,
 string> (cap ~200) pour éviter fetch clé + déchiffrement à chaque rendu.
 3. FlatList — app/src/features/messaging/components/conversation-list.tsx : windowSize={7}, maxToRenderPerBatch={8}, initialNumToRender={12}, removeClippedSubviews. (Ne PAS toucher à
 l'inversion de chat-view — risque > gain.)
 4. Client API — app/src/shared/api/client.ts : timeout AbortController (12 s, surchargable), 1 retry avec backoff 1 s pour les GET sur erreur réseau/timeout uniquement.
 5. Contact-sync — app/src/processes/contact-sync/index.ts : dédupliquer les ids membres (Set), skip des ids déjà synchronisés cette session, concurrence bornée à 4 (au lieu de séquentiel).
 6. Offline-sync — app/src/processes/offline-sync/index.ts : prefetch 8 convs × 30 msgs sur cellulaire vs 12×40 en wifi (NetInfo.fetch()), garde d'intervalle min : skip si dernier sync réussi
 < 60 s.
 7. expo-image — app/src/features/attachments/components/attachment-image.tsx : remplacer RN Image par expo-image (cachePolicy="disk", transition={150}, recyclingKey).
 8. URL WS fallback — app/src/shared/websocket/manager.ts : remplacer ws://10.0.2.2:3000/ws par wss://api-plink.lyrastudio.org/ws (garder l'override env).

 ---
 Workstream C — Refonte push (data-only FCM, déchiffrement client)

 Architecture retenue

 @react-native-firebase/app + @react-native-firebase/messaging (token, onMessage, setBackgroundMessageHandler) + @notifee/react-native pour TOUT l'affichage/canaux/taps. Retrait complet
 d'expo-notifications (un seul propriétaire de canaux et un seul pipeline de tap ; scheduleNotificationAsync en contexte headless n'est pas supporté).
 - Résolution du mismatch de canal : le serveur n'envoie plus de channelId (data-only) ; le client est seul propriétaire (id par défaut 'default' de app/src/features/notifications/types.ts).
 - SecureStore en headless : généralement OK mais traité comme non fiable → try/catch autour de l'accès clé ; fallback « {sender} · Nouveau message ». Le handler ne doit jamais throw.
 - iOS : data-only + app tuée peu fiable (nécessiterait une NSE) — hors périmètre, app Android-first. À documenter.

 C-client (NOUVEAU BINAIRE NATIF, v1.1.0)

 C-c1. Packages/config
 - app/package.json : ajouter @react-native-firebase/app, @react-native-firebase/messaging, @notifee/react-native (versions compatibles RN 0.81 / SDK 54) ; retirer expo-notifications
 (utilisateurs connus : push.ts, app/src/app/settings/notifications.tsx) ; "main" : "expo-router/entry" → "index.js".
 - Nouveau app/index.js : import './src/features/notifications/background-handler'; import 'expo-router/entry';
 - app/app.json : plugins — retirer "expo-notifications", ajouter "@react-native-firebase/app" et "@react-native-firebase/messaging" ; ajouter permission POST_NOTIFICATIONS ; bump version à
 1.1.0 (avec runtimeVersion.policy: appVersion, isole le binaire des OTA 1.0.x — ne jamais publier un bundle OTA important RNFB vers le runtime 1.0.x). googleServicesFile déjà en place.
 - Rebuild : npx expo prebuild --clean puis deploy-apk.sh / eas build -p android.

 C-c2. Nouveau app/src/features/notifications/background-handler.ts (importé par index.js)
 - Type PushData : type: 'MESSAGE'|'ANNOUNCEMENT'|'ADMIN_BROADCAST' + champs message (messageId, chatId, chatType, chatName, senderName, senderId, cipherText, iv, messageType) + champs
 plaintext (title, body, announcementId).
 - displayPush(data) :
   - MESSAGE : tenter déchiffrement via ensureChatKeyForChat + decrypt (try/catch complet). Privé : titre = senderName, corps = texte déchiffré (fallback « Nouveau message »). Groupe : titre =
 chatName, corps = « {senderName}: {texte} » (fallback « {senderName} · Nouveau message »). Affichage notifee.displayNotification({ id: messageId, ..., data: { conversationId }, android: {
 channelId, pressAction: { id: 'default', launchActivity: 'default' } } }) — id: messageId = dédup OS.
   - ANNOUNCEMENT/ADMIN_BROADCAST : titre/corps directs du payload (fallback « Nouvelle annonce »).
   - Garde : data.senderId === currentUserId (AsyncStorage) → return.
 - Enregistrement : messaging().setBackgroundMessageHandler(...) + notifee.onBackgroundEvent (PRESS → ouvre l'app).
 - ensureChannel() : lit les settings persistés (NotificationChannelSettings) et notifee.createChannel (idempotent).

 C-c3. Réécriture app/src/features/notifications/push.ts
 - registerForPushNotifications() : notifee.requestPermission() → messaging().getToken() → POST /devices/fcm-token (inchangé) ; ajouter messaging().onTokenRefresh(...) ; garder le no-op Expo
 Go.
 - showLocalNotification() réimplémenté sur notifee.displayNotification.
 - Dédup foreground : LRU Set<messageId> (cap 100) partagé entre le handler WS message.created et messaging().onMessage. onMessage : si WS connecté → return (WS gère) ; sinon displayPush
 (couvre app ouverte + WS down).
 - Taps : notifee.onForegroundEvent PRESS → router.push('/chat/'+conversationId) ; cold start via notifee.getInitialNotification() dans app/src/app/_layout.tsx (remplacer les appels ligne
 ~77).
 - Handlers WS notification.created / announcement.created : afficher le vrai titre/corps désormais présents dans les payloads serveur.
 - app/src/app/settings/notifications.tsx : remplacer les appels expo-notifications par notifee.createChannel.
 - i18n : fallbacks fr/en ; le handler headless utilise une mini map statique de chaînes (fr par défaut), pas i18next.

 C-server

 C-s1. server/src/app/services/fcm.service.ts — nouvelle méthode sendDataPush(tokens, data)
 - Chunks ≤500 tokens par sendEachForMulticast ; message sans bloc notification : { tokens, data, android: { priority: 'high' }, apns: { headers: { 'apns-push-type': 'background',
 'apns-priority': '5' }, payload: { aps: { 'content-available': 1 } } } }.
 - Toutes les valeurs data stringifiées ; garde 4 KB : si > ~3800 octets sérialisés, retirer cipherText/iv (le client affichera le fallback).
 - Réutiliser purgeInvalidTokens par chunk. Tokens Expo restants : continuer à leur envoyer une notif Expo classique générique (ils ne peuvent pas exécuter le handler headless).
 - Garder sendPushNotification pour ban/restore/deleteDocument admin (non-E2E).

 C-s2. Nouveau server/app/services/message-push.service.ts
 - pushNewMessage(senderId, conversationId, message) : 1 requête chat {type, name} + sender {username} ; 1 requête groupée devices de tous les membres ≠ sender avec fcm_token != null ; puis
 sendDataPush(tokens, { type:'MESSAGE', messageId, chatId, chatType, chatName, senderName, senderId, cipherText, iv, messageType }).

 C-s3. Branchements
 - server/src/modules/websocket/handlers/message.handler.ts (lignes 38–70) : supprimer la requête devices + push générique par membre ; appeler pushNewMessage(...) une fois après la boucle ;
 remplacer les createNotification par membre par un seul prisma.notification.createMany (garder les emits WS NotificationCreated par membre).
 - server/app/controllers/messaging.controller.ts sendMessage (chemin REST) : même batching + pushNewMessage(...) — le chemin REST envoie enfin des push.

 C-s4. Annonces — server/app/controllers/announcement.controller.ts (lignes 39–58)
 - Promise.all(createNotification) → prisma.notification.createMany.
 - Enrichir le payload WS NotificationCreated par utilisateur avec { announcementId, title, body: content.slice(0,180) }.
 - Ajouter le fan-out push : devices des utilisateurs actifs (sauf auteur) → sendDataPush(tokens, { type:'ANNOUNCEMENT', announcementId, title, body: content.slice(0,500) }).

 Risques : anciens binaires n'affichent rien en data-only → binaire d'abord (option : flag env PUSH_DATA_ONLY pour rollout progressif). « Forcer l'arrêt » Android bloque FCM (comportement
 plateforme, swipe-kill OK).

 Vérification C : app tuée + chat privé → nom envoyeur + corps déchiffré, tap ouvre /chat/{id} ; groupe → titre = nom groupe, corps = Envoyeur: texte ; clé manquante → fallback sans crash
 headless (adb logcat) ; foreground → exactement 1 notification ; annonce publiée → push avec vrai titre/contenu sur appareil tué ; message envoyé via REST (curl) → push reçu app tuée ; les
 builds 1.0.x ne reçoivent pas l'OTA 1.1.0.

 ---
 Workstream D — Carte « Créer un événement » (OTA, sans backend)

 - Nouveau app/src/features/events/components/event-promo-card.tsx : carte nativewind (titre, sous-titre, CTA, petit ✕). Tap →
 WebBrowser.openBrowserAsync('https://ticky-landing.azariats.cloud') (expo-web-browser déjà installé, inutilisé — custom tab in-app).
 - Hook useEventCardDismissed() → { dismissed, dismiss } ; rend null pendant le chargement/si fermée (pas de flash). Persistance AsyncStorage clé EVENT_CARD_DISMISSED_V1 — fermeture permanente
 par appareil (le suffixe _V1 permet de la faire réapparaître plus tard en passant à _V2).
 - Montage : ListHeaderComponent dans app/src/features/messaging/components/conversation-list.tsx.
 - i18n : events.promoTitle (« Créer un événement »), events.promoSubtitle, events.promoCta dans app/src/i18n/locales/{fr,en}/.

 Vérification : carte visible en haut, scrolle avec la liste ; tap ouvre le navigateur in-app, retour OK ; fermeture persiste après redémarrage ; fr/en corrects.

 ---
 Workstream E — Notifications broadcast depuis le dashboard

 Serveur

 - Nouveau server/app/validators/admin-notification.validator.ts : { title: 1–120, body: 1–500 } (modèle : announcement.validator.ts).
 - server/app/controllers/admin.controller.ts — nouvelle action sendBroadcastNotification : valider → users actifs → prisma.notification.createMany (type: 'ADMIN_BROADCAST') → emits WS
 NotificationCreated par user avec { title, body, type } → devices actifs avec token → sendDataPush(tokens, { type: 'ADMIN_BROADCAST', title, body }) → réponse { recipients: n }.
 (Notification.type est un champ string → pas de migration.)
 - server/start/routes/admin.route.ts : POST /admin/notifications derrière le roleMiddleware admin existant.
 - Historique des envois : non inclus en v1 (aucun modèle de groupage n'existe ; le toast dashboard affiche le nombre de destinataires).

 Dashboard (copier le pattern « updates »)

 - dashboard/src/share/lib/api.ts : méthode sendBroadcastNotification, liée dans le constructeur.
 - Nouveau dashboard/src/features/notifications/model/use_notifications.ts : useMutation + toasts (cf. use_updates.ts) ; succès : « Envoyée à N utilisateurs ».
 - Nouveau dashboard/src/features/notifications/ui/notifications_feat.tsx : champs titre/corps avec maxLength + compteurs, modal de confirmation (« Envoyer à TOUS les utilisateurs actifs ? »),
 bouton désactivé pendant l'envoi (structure de updates_feat.tsx).
 - Nouveau dashboard/src/pages/notifications/ui/notifications_page.tsx ; route dans dashboard/src/providers/router/routes.tsx ; entrée sidebar dans dashboard/src/components/sidebar.tsx.

 Vérification : non-admin → 403 ; envoi → lignes DB + notif in-app temps réel avec vrai contenu + push sur appareil tué (après déploiement C) ; champs vides rejetés des deux côtés.

 ---
 Livraison

 ┌────────────────────┬─────────────────────────────────────────────────────────────────────────────┐
 │     Changement     │                                    Mode                                     │
 ├────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
 │ A, B, D            │ OTA sur runtime 1.0.x existant                                              │
 ├────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
 │ C-client           │ Nouveau build natif v1.1.0 (npx expo prebuild --clean, deploy-apk.sh / EAS) │
 ├────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
 │ C-server, E-server │ Déploiement serveur, après diffusion du binaire (ou flag PUSH_DATA_ONLY)    │
 ├────────────────────┼─────────────────────────────────────────────────────────────────────────────┤
 │ E-dashboard        │ Déploiement statique                                                        │
 └────────────────────┴─────────────────────────────────────────────────────────────────────────────┘
