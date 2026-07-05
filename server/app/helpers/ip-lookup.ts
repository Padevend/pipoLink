export async function getLocationFromIp(ip: string): Promise<string> {
  if (
    !ip ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("127.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    ip.startsWith("::ffff:127.") ||
    ip.startsWith("::ffff:192.168.") ||
    ip.startsWith("::ffff:10.")
  ) {
    return "Réseau Local";
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    const response = await fetch(`http://ip-api.com/json/${ip}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data: any = await response.json();
      if (data && data.status === "success") {
        const city = data.city || "";
        const country = data.country || "";
        return `${city}${city && country ? ", " : ""}${country}` || "Inconnu";
      }
    }
  } catch (error) {
    // Fail silently
  }
  return "Inconnu";
}
