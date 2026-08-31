import { api } from "./api";

/**
 * Construit l'URL complète pour accéder à une ressource statique.
 *
 * Comportement :
 * - URL absolue (http/https) → retournée telle quelle
 * - Chemin relatif commençant par `/` → préfixé par l'API URL (rétrocompat)
 * - Identifiant (ex: UUID) → construit l'URL de téléchargement `/download/:id`
 */
export function getStaticUrl(urlOrId: string): string {
    if (urlOrId.startsWith("http"))
        return urlOrId;

    // Chemin relatif → rétrocompatibilité
    if (urlOrId.startsWith("/")) {
        const path = urlOrId.substring(1);
        return `${api.publicurl}/${path}`;
    }

    // Sinon → c'est un ID, construire l'URL de téléchargement
    return `${api.publicurl}/download/${urlOrId}`;
}