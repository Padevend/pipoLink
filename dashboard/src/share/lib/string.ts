const string = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-"

export function generateUuid(length: number = 9): string {
    return Array.from(
        { length },
        () => string[Math.floor(Math.random() * string.length)]
    ).join('')
}