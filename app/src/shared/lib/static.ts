export function getStaticUri(path: string): string {
    let EXPO_URL = process.env.EXPO_PUBLIC_API_URL || "";

    if (path.startsWith("https://") || path.startsWith("http://") || path.startsWith('file://') || path.startsWith('data://')) {
        return path;
    }

    if (EXPO_URL && EXPO_URL.endsWith("/")) {
        EXPO_URL = EXPO_URL.slice(0, -1);
    }

    return `${EXPO_URL}${path}`;
}