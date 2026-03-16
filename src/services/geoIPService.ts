/**
 * GeoIP Service - Resolves IP addresses to geographic location
 * Uses a simple fallback approach - attempts resolution but gracefully fails
 * This is optional functionality that enhances display, not required for app to work
 */

export interface GeoIPData {
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

class GeoIPService {
  private cacheMap: Map<string, GeoIPData> = new Map();
  private failedIPs: Set<string> = new Set(); // Track IPs that failed to avoid retry

  /**
   * Resolves an IP address to geographic location data
   * This is a best-effort service - failures are silent and don't block the app
   */
  async resolveIP(ip: string): Promise<GeoIPData> {
    // Validate IP format
    if (!ip || ip === 'unknown' || ip === 'Unknown') {
      return {};
    }

    // Don't retry IPs that already failed
    if (this.failedIPs.has(ip)) {
      return { ip };
    }

    // Check cache first
    if (this.cacheMap.has(ip)) {
      const cached = this.cacheMap.get(ip);
      return cached || { ip };
    }

    // Try single most reliable service with timeout
    try {
      const result = await Promise.race([
        this.tryIPAPI(ip),
        new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 3000)
        ),
      ]);
      
      if (result && (result.city || result.country)) {
        this.cacheMap.set(ip, result);
        return result;
      }
    } catch (error) {
      // Silent fail - mark as failed and return just IP
      this.failedIPs.add(ip);
    }

    return { ip };
  }

  /**
   * Try ipapi.co - simple, no auth required
   * Falls back gracefully if blocked by CORS or rate limit
   */
  private async tryIPAPI(ip: string): Promise<GeoIPData | null> {
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) return null;
      
      const data = await response.json();
      if (data.error) return null;

      return {
        ip: data.ip,
        city: data.city || undefined,
        region: data.region || undefined,
        country: data.country_name || undefined,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
      };
    } catch (error) {
      // Silently fail - CORS, rate limit, or network error
      return null;
    }
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cacheMap.clear();
    this.failedIPs.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cacheMap.size;
  }
}

// Export singleton instance
export const geoIPService = new GeoIPService();
export default geoIPService;
