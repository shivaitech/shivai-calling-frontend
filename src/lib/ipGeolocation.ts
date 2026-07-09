export interface IPLocationResult {
  city: string;
  region: string;
  country: string;
  countryCode?: string;
  zip?: string;
  isp?: string;
  lat?: number | null;
  lon?: number | null;
  timezone?: string;
  status: "resolved" | "private" | "invalid" | "failed";
  ip?: string;
  provider?: string;
}

const successCache = new Map<string, IPLocationResult>();
const inflight = new Map<string, Promise<IPLocationResult>>();

const IPINFO_TOKEN = import.meta.env.VITE_IPINFO_TOKEN as string | undefined;

function isPrivateIP(ip: string): boolean {
  if (!ip) return false;
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^127\./,
    /^169\.254\./,
    /^::1$/,
    /^fc00:/i,
    /^fe80:/i,
    /^0\.0\.0\.0$/,
    /^255\.255\.255\.255$/,
  ];
  return privateRanges.some((range) => range.test(ip));
}

function invalidResult(ip?: string): IPLocationResult {
  return {
    city: "Unknown",
    region: "Unknown",
    country: "Unknown",
    status: "invalid",
    ip,
  };
}

function privateResult(ip: string): IPLocationResult {
  return {
    city: "Private Network",
    region: "Local",
    country: "N/A",
    status: "private",
    ip,
  };
}

function failedResult(ip: string): IPLocationResult {
  return {
    city: "Unknown",
    region: "Unknown",
    country: "Unknown",
    status: "failed",
    ip,
  };
}

function hasLocationData(result: IPLocationResult): boolean {
  const values = [result.city, result.region, result.country];
  return values.some(
    (v) => v && v.toLowerCase() !== "unknown" && v !== "N/A"
  );
}

/** True when location has enough data to show in the UI. */
export function isUsableLocation(
  location: Partial<IPLocationResult> | null | undefined
): boolean {
  if (!location) return false;
  if (location.status === "private") return true;
  return hasLocationData({
    city: location.city || "Unknown",
    region: location.region || "Unknown",
    country: location.country || "Unknown",
    status: location.status || "failed",
  });
}

/** True when we should call geo APIs (missing or stub backend location). */
export function needsLocationResolution(
  location: Partial<IPLocationResult> | null | undefined
): boolean {
  if (!location) return true;
  if (location.status === "private") return false;
  return !isUsableLocation(location);
}

/** Normalize API session.location into our standard shape. */
export function normalizeSessionLocation(
  raw: Partial<IPLocationResult> | null | undefined,
  ip?: string
): IPLocationResult | null {
  if (!raw) return null;
  if (raw.status === "private") {
    return { ...privateResult(ip || raw.ip || ""), ...raw, status: "private" };
  }
  if (isUsableLocation(raw)) {
    return {
      city: raw.city || "Unknown",
      region: raw.region || "Unknown",
      country: raw.country || "Unknown",
      countryCode: raw.countryCode,
      zip: raw.zip,
      isp: raw.isp,
      lat: raw.lat,
      lon: raw.lon,
      timezone: raw.timezone,
      status: "resolved",
      ip: ip || raw.ip,
      provider: raw.provider,
    };
  }
  return null;
}

async function fetchJson(url: string, timeoutMs = 8000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function resolveViaIpinfo(ip: string): Promise<IPLocationResult | null> {
  if (!IPINFO_TOKEN) return null;
  const data = await fetchJson(
    `https://ipinfo.io/${ip}/json?token=${encodeURIComponent(IPINFO_TOKEN)}`
  );
  if (data?.bogon || data?.error) return null;
  return {
    city: data.city || "Unknown",
    region: data.region || "Unknown",
    country: data.country || "Unknown",
    countryCode: data.country || "",
    zip: data.postal || "",
    isp: data.org || "Unknown ISP",
    lat: data.loc ? Number(data.loc.split(",")[0]) : null,
    lon: data.loc ? Number(data.loc.split(",")[1]) : null,
    timezone: data.timezone || "",
    status: "resolved",
    ip,
    provider: "ipinfo",
  };
}

async function resolveViaIpwhois(ip: string): Promise<IPLocationResult | null> {
  const data = await fetchJson(`https://ipwho.is/${ip}`);
  if (!data?.success) return null;
  return {
    city: data.city || "Unknown",
    region: data.region || data.region_code || "Unknown",
    country: data.country || "Unknown",
    countryCode: data.country_code || "",
    zip: data.postal || "",
    isp: data.connection?.isp || data.connection?.org || "Unknown ISP",
    lat: data.latitude ?? null,
    lon: data.longitude ?? null,
    timezone: data.timezone?.id || "",
    status: "resolved",
    ip,
    provider: "ipwhois",
  };
}

async function resolveViaIpapiCo(ip: string): Promise<IPLocationResult | null> {
  const data = await fetchJson(`https://ipapi.co/${ip}/json/`);
  if (data?.error || data?.reason) return null;
  return {
    city: data.city || "Unknown",
    region: data.region || "Unknown",
    country: data.country_name || "Unknown",
    countryCode: data.country_code || "",
    zip: data.postal || "",
    isp: data.org || "Unknown ISP",
    lat: data.latitude ?? null,
    lon: data.longitude ?? null,
    timezone: data.timezone || "",
    status: "resolved",
    ip,
    provider: "ipapi.co",
  };
}

async function resolveWithProviders(ip: string): Promise<IPLocationResult> {
  const providers = [
    resolveViaIpinfo,
    resolveViaIpwhois,
    resolveViaIpapiCo,
  ];

  for (const provider of providers) {
    try {
      const result = await provider(ip);
      if (result && hasLocationData(result)) {
        return result;
      }
    } catch (error) {
      console.warn(`[geoip] provider failed for ${ip}:`, error);
    }
  }

  return failedResult(ip);
}

/** Resolve a single IP with in-memory cache (successes only) and deduped inflight requests. */
export async function resolveIPLocation(ip: string): Promise<IPLocationResult> {
  const normalized = (ip || "").trim();
  if (!normalized || normalized === "Unknown" || normalized === "N/A") {
    return invalidResult(normalized);
  }
  if (isPrivateIP(normalized)) {
    return privateResult(normalized);
  }
  if (successCache.has(normalized)) {
    return successCache.get(normalized)!;
  }
  if (inflight.has(normalized)) {
    return inflight.get(normalized)!;
  }

  const promise = resolveWithProviders(normalized).then((result) => {
    if (result.status === "resolved") {
      successCache.set(normalized, result);
    }
    inflight.delete(normalized);
    return result;
  });

  inflight.set(normalized, promise);
  return promise;
}

/** Resolve many IPs with limited concurrency to avoid free-tier rate limits. */
export async function resolveIPLocationsBatch(
  ips: string[],
  concurrency = 2
): Promise<Record<string, IPLocationResult>> {
  const unique = [...new Set(ips.map((ip) => (ip || "").trim()).filter(Boolean))];
  const results: Record<string, IPLocationResult> = {};
  let index = 0;

  async function worker() {
    while (index < unique.length) {
      const current = unique[index++];
      results[current] = await resolveIPLocation(current);
      // Small pause between lookups for free APIs
      await new Promise((r) => setTimeout(r, 120));
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, unique.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

export function formatIPLocationLabel(
  location: IPLocationResult | null | undefined,
  ip?: string
): string {
  if (!location) return ip ? `Resolving (${ip})` : "";

  if (location.status === "private") {
    return `${location.city}${ip ? ` (${ip})` : ""}`;
  }
  if (location.status === "failed") {
    return ip ? `Unable to resolve (${ip})` : "Unable to resolve";
  }

  const city =
    location.city?.toLowerCase() !== "unknown" ? location.city : "";
  const region =
    location.region &&
    location.region.toLowerCase() !== "unknown" &&
    location.region !== location.city
      ? location.region
      : "";
  const country =
    location.country?.toLowerCase() !== "unknown" &&
    location.country !== "N/A"
      ? location.country
      : "";

  const label = [city, region, country].filter(Boolean).join(", ");
  if (label) return label;
  return ip ? `Unknown (${ip})` : "Unknown";
}
