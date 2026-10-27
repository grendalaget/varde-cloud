import { isIP } from "node:net";

export function normalizeIp(ip?: string | null): string | null {
  const trimmed = ip?.trim();
  if (!trimmed) return null;

  let address = trimmed;
  const zoneAt = address.indexOf("%");
  if (zoneAt !== -1) {
    const zone = address.slice(zoneAt + 1);
    address = address.slice(0, zoneAt);
    if (!zone || isIP(address) !== 6) return null;
  }

  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(address);
  if (mapped && isIP(mapped[1]) === 4) return mapped[1];
  if (isIP(address) === 4) return address;
  if (isIP(address) !== 6) return null;

  try {
    const hostname = new URL(`http://[${address}]`).hostname;
    return hostname.startsWith("[") && hostname.endsWith("]")
      ? hostname.slice(1, -1).toLowerCase()
      : null;
  } catch {
    return null;
  }
}

export function sameIp(a?: string | null, b?: string | null): boolean {
  const normalizedA = normalizeIp(a);
  const normalizedB = normalizeIp(b);
  return normalizedA !== null && normalizedB !== null && normalizedA === normalizedB;
}
