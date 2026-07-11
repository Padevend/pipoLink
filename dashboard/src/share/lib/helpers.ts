import { api } from "./api";

export function getStaticUrl(url: string): string {
    if (url.startsWith("http"))
        return url;

    if (url.startsWith("/"))
        url = url.substring(1);

    return `${api.publicurl}/${url}`;
}