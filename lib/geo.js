const COUNTRY_BY_TZ = [
  { match: "Europe/Madrid", country: "España", flag: "🇪🇸", currency: "EUR" },
  { match: "Europe/", country: "Europa", flag: "🇪🇺", currency: "EUR" },
  { match: "Asia/Dubai", country: "Emiratos Árabes Unidos", flag: "🇦🇪", currency: "AED" },
  { match: "Asia/Riyadh", country: "Arabia Saudí", flag: "🇸🇦", currency: "SAR" },
  { match: "Asia/Tokyo", country: "Japón", flag: "🇯🇵", currency: "JPY" },
  { match: "Asia/Kolkata", country: "India", flag: "🇮🇳", currency: "INR" },
  { match: "Asia/Shanghai", country: "China", flag: "🇨🇳", currency: "CNY" },
  { match: "America/New_York", country: "Estados Unidos", flag: "🇺🇸", currency: "USD" },
  { match: "America/Los_Angeles", country: "Estados Unidos", flag: "🇺🇸", currency: "USD" },
  { match: "America/Mexico_City", country: "México", flag: "🇲🇽", currency: "MXN" },
  { match: "America/Sao_Paulo", country: "Brasil", flag: "🇧🇷", currency: "BRL" },
  { match: "America/Bogota", country: "Colombia", flag: "🇨🇴", currency: "COP" },
  { match: "America/Argentina", country: "Argentina", flag: "🇦🇷", currency: "ARS" },
  { match: "America/", country: "América", flag: "🌎", currency: "USD" },
  { match: "Africa/", country: "África", flag: "🌍", currency: "USD" },
  { match: "Australia/", country: "Australia", flag: "🇦🇺", currency: "AUD" },
];

export function detectCountry() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    for (const c of COUNTRY_BY_TZ) {
      if (tz === c.match || (c.match.endsWith("/") && tz.startsWith(c.match))) return c;
    }
  } catch (e) {}
  return { country: "España", flag: "🇪🇸", currency: "EUR" };
}