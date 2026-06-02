export function getStaticUri(path: string): string {
    if (path.startsWith("https://") || path.startsWith("http://") || path.startsWith('data:')) {
        return path;
    }

    if(path.startsWith('/')){
        path = path.substring(1);
    }

    return `${process.env.EXPO_PUBLIC_API_URL}/${path}`;
}