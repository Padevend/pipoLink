export function safeJsonParse(raw: string): { ok: true; value: any } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? "Invalid JSON" };
  }
}
