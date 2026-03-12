/**
 * GeoIP Service - Resolves IP addresses to geographic location (city, country, region)
 * Uses multiple free GeoIP services with fallback support
 */

export interface GeoIPData {
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  organization?: string;
}

class GeoIPService {
  private cacheMap: Map<string, GeoIPData> = new Map();

  /**
   * Resolves an IP address to geographic location data
   * Uses multiple services with fallback support
   * Caches results to avoid repeated API calls
   */
  async resolveIP(ip: string): Promise<GeoIPData> {
    // Validate IP format
    if (!ip || ip === 'unknown' || ip === 'Unknown') {
      return {};
    }

    // Check cache first
    if (this.cacheMap.has(ip)) {
      const cached = this.cacheMap.get(ip);
      if (cached) return cached;
    }

    // Try multiple GeoIP services in order
    const services = [
      this.tryIPAPI.bind(this),
      this.tryIPInfoIO.bind(this),
      this.tryIPGeolocationIO.bind(this),
      this.tryAbstractIP.bind(this),
    ];

    for (const service of services) {
      try {
        const result = await service(ip);
        if (result && (result.city || result.country)) {
          // Cache successful result
          this.cacheMap.set(ip, result);
          console.log(`✅ Resolved IP (${ip}):`, result);
          return result;
        }
      } catch (error) {
        console.warn(`⚠️ Service failed:`, { ip, error });
        // Continue to next service
      }
    }

    console.warn(`❌ Could not resolve IP: ${ip}`);
    return { ip };
  }

  /**
   * Try ipapi.co (free, no API key required, 30K requests/day)
   */
  private async tryIPAPI(ip: string): Promise<GeoIPData | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        signal: controller.signal,
        mode: 'cors',
      });
      clearTimeout(timeout);

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
        organization: data.org,
      };
    } catch (error) {
      console.warn('ipapi.co failed:', error);
      return null;
    }
  }

  /**
   * Try ipinfo.io (free, no API key required, 50K requests/month)
   */
  private async tryIPInfoIO(ip: string): Promise<GeoIPData | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`https://ipinfo.io/${ip}?token=0b3acb9e86e0b0`, {
        signal: controller.signal,
        mode: 'cors',
      });
      clearTimeout(timeout);

      if (!response.ok) return null;

      const data = await response.json();
      const [latitude, longitude] = data.loc ? data.loc.split(',').map((s: string) => parseFloat(s)) : [undefined, undefined];

      return {
        ip: data.ip,
        city: data.city || undefined,
        region: data.region || undefined,
        country: data.country || undefined,
        latitude,
        longitude,
        timezone: data.timezone,
        organization: data.org,
      };
    } catch (error) {
      console.warn('ipinfo.io failed:', error);
      return null;
    }
  }

  /**
   * Try ip-geolocation.com (free tier available)
   */
  private async tryIPGeolocationIO(ip: string): Promise<GeoIPData | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`https://api.ipgeolocation.io/ipgeo?apiKey=4d8fb5b87dac47f5975e6bbd10a1e447&ip=${ip}`, {
        signal: controller.signal,
        mode: 'cors',
      });
      clearTimeout(timeout);

      if (!response.ok) return null;

      const data = await response.json();
      if (data.status === 'FAILED') return null;

      return {
        ip: data.ip,
        city: data.city || undefined,
        region: data.state_prov || undefined,
        country: data.country_name || undefined,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.time_zone?.name,
        isp: data.isp,
        organization: data.organization,
      };
    } catch (error) {
      console.warn('ip-geolocation.io failed:', error);
      return null;
    }
  }

  /**
   * Try abstractapi.com (free tier: 20K/month, no API key for demo)
   */
  private async tryAbstractIP(ip: string): Promise<GeoIPData | null> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`https://ipgeolocation.abstractapi.com/v1/?api_key=8d8fc4e29a5046c6a2ac7b24c3f9a1b8&ip_address=${ip}`, {
        signal: controller.signal,
        mode: 'cors',
      });
      clearTimeout(timeout);

      if (!response.ok) return null;

      const data = await response.json();

      return {
        ip: data.ip_address,
        city: data.city || undefined,
        region: data.region || undefined,
        country: data.country || undefined,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone?.name,
      };
    } catch (error) {
      console.warn('abstractapi failed:', error);
      return null;
    }
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cacheMap.clear();
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
