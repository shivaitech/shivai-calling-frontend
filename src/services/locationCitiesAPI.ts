import axios from "axios";

// Cities lookup via the free CountriesNow API (no key required).
// POST https://countriesnow.space/api/v0.1/countries/cities
//   body: { country: "<country name>" }
//   resp: { error: boolean, msg: string, data: string[] }
//
// Kept separate from the authed backend services since this is a public,
// third-party lookup. Results are cached in-memory per country name.

const CITIES_ENDPOINT = "https://countriesnow.space/api/v0.1/countries/cities";

const cache = new Map<string, string[]>();

export const getCitiesForCountry = async (countryName: string): Promise<string[]> => {
  const key = (countryName || "").trim();
  if (!key) return [];
  if (cache.has(key)) return cache.get(key)!;

  try {
    const res = await axios.post(
      CITIES_ENDPOINT,
      { country: key },
      { headers: { "Content-Type": "application/json" }, timeout: 12000 }
    );
    const data: string[] = Array.isArray(res.data?.data) ? res.data.data : [];
    // De-dupe + sort for a clean dropdown.
    const cities = Array.from(new Set(data.map((c) => String(c).trim()).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b)
    );
    cache.set(key, cities);
    return cities;
  } catch (error: any) {
    console.error("Error fetching cities:", error);
    throw new Error("Couldn't load cities for this country. You can type it manually.");
  }
};

export default { getCitiesForCountry };
