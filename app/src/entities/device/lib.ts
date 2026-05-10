export function getDeviceLabel(platform: 'ios' | 'android' | 'web' | 'desktop'): string {
  return platform === 'desktop' ? 'Desktop' : platform.toUpperCase();
}
