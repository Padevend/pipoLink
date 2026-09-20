/**
 * Construit l'URL complète pour accéder à une ressource statique.
 *
 * Comportement :
 * - URL absolue (http/https/file/data) → retournée telle quelle
 * - Chemin relatif commençant par `/` (ex: /storage/avatars/...) → préfixé par l'API URL (rétrocompat)
 * - Identifiant (ex: UUID) → construit l'URL de téléchargement `/download/:id`
 */
export function getStaticUri(pathOrId: string): string {
    let EXPO_URL = process.env.EXPO_PUBLIC_API_URL || "";

    // URL absolue → retourner telle quelle
    if (pathOrId.startsWith("https://") || pathOrId.startsWith("http://") || pathOrId.startsWith('file://') || pathOrId.startsWith('data://')) {
        return pathOrId;
    }

    if (EXPO_URL && EXPO_URL.endsWith("/")) {
        EXPO_URL = EXPO_URL.slice(0, -1);
    }

    if (pathOrId.startsWith("/")) {
        return `${EXPO_URL}${pathOrId}`;
    }

    return `${EXPO_URL}/download/${pathOrId}`;
}