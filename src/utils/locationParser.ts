// Robust helper to extract city/country/postalCode from a Google-style address
// or from Places API address_components.

export interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface ParsedLocation {
  city: string | null;
  country: string | null;
  postalCode: string | null;
  street: string | null;
}

const EMPTY: ParsedLocation = { city: null, country: null, postalCode: null, street: null };

// Common country names we want to recognize when parsing free-text addresses.
// Kept short — anything unmatched falls back to "last segment without digits".
const KNOWN_COUNTRIES = new Set(
  [
    'hrvatska', 'croatia', 'slovenija', 'slovenia', 'srbija', 'serbia',
    'bosna i hercegovina', 'bosnia and herzegovina', 'crna gora', 'montenegro',
    'austria', 'österreich', 'austrija', 'deutschland', 'germany', 'njemačka',
    'italia', 'italy', 'italija', 'magyarország', 'hungary', 'mađarska',
    'france', 'francuska', 'españa', 'spain', 'španjolska', 'portugal',
    'united kingdom', 'uk', 'great britain', 'england', 'ireland', 'irska',
    'nederland', 'netherlands', 'nizozemska', 'belgium', 'belgique', 'belgija',
    'schweiz', 'switzerland', 'švicarska', 'sverige', 'sweden', 'švedska',
    'norge', 'norway', 'norveška', 'danmark', 'denmark', 'danska',
    'polska', 'poland', 'poljska', 'česká republika', 'czechia', 'češka',
    'slovensko', 'slovakia', 'slovačka', 'united states', 'usa', 'us',
    'canada', 'kanada',
  ].map((s) => s.toLowerCase())
);

function fromComponents(components: GoogleAddressComponent[]): ParsedLocation {
  const find = (...types: string[]) =>
    components.find((c) => types.some((t) => c.types.includes(t)));

  const cityComp =
    find('locality') ||
    find('postal_town') ||
    find('administrative_area_level_3') ||
    find('administrative_area_level_2') ||
    find('sublocality', 'sublocality_level_1');
  const countryComp = find('country');
  const postalComp = find('postal_code');
  const routeComp = find('route');
  const numberComp = find('street_number');

  const street = routeComp
    ? `${routeComp.long_name}${numberComp ? ' ' + numberComp.long_name : ''}`
    : null;

  return {
    city: cityComp?.long_name?.trim() || null,
    country: countryComp?.long_name?.trim() || null,
    postalCode: postalComp?.long_name?.trim() || null,
    street,
  };
}

function fromText(location: string): ParsedLocation {
  if (!location) return EMPTY;
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return EMPTY;

  let country: string | null = null;
  let cityIdx = parts.length - 1;

  // 1) If the last segment looks like a country (text only / known country), take it.
  const last = parts[parts.length - 1];
  const lastNoDigits = /^[^\d]+$/.test(last);
  if (parts.length >= 2 && (lastNoDigits || KNOWN_COUNTRIES.has(last.toLowerCase()))) {
    country = last;
    cityIdx = parts.length - 2;
  }

  // 2) City segment: strip leading postal code if present (e.g. "10000 Zagreb").
  let postalCode: string | null = null;
  let cityRaw = parts[cityIdx] || '';
  const postalMatch = cityRaw.match(/\b(\d{3,6})\b/);
  if (postalMatch) {
    postalCode = postalMatch[1];
    cityRaw = cityRaw.replace(postalMatch[0], '').trim();
  }
  // Sometimes postal code is a separate segment right before the city.
  if (!postalCode && cityIdx > 0) {
    const prev = parts[cityIdx - 1];
    const prevPostal = prev.match(/^\d{3,6}$/);
    if (prevPostal) postalCode = prevPostal[0];
  }

  const city = cityRaw && /[a-zA-ZÀ-ž]/.test(cityRaw) ? cityRaw : null;
  const street = cityIdx > 0 ? parts.slice(0, cityIdx).join(', ') || null : null;

  return { city, country, postalCode, street };
}

export function parseLocation(
  location?: string | null,
  components?: GoogleAddressComponent[] | null
): ParsedLocation {
  if (components && components.length > 0) {
    const fromComp = fromComponents(components);
    // If components missed something, try to backfill from the text.
    if (fromComp.city && fromComp.country) return fromComp;
    const fromTxt = location ? fromText(location) : EMPTY;
    return {
      city: fromComp.city || fromTxt.city,
      country: fromComp.country || fromTxt.country,
      postalCode: fromComp.postalCode || fromTxt.postalCode,
      street: fromComp.street || fromTxt.street,
    };
  }
  return location ? fromText(location) : EMPTY;
}
