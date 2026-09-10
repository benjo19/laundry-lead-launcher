// Central place for auth redirect URLs.
// Google OAuth must always come back to the production origin, because that is
// the only URL registered in Supabase Auth + Google Cloud Console.
export const PRODUCTION_ORIGIN = 'https://laundry-lead-launcher.lovable.app';

const isLocalhost = () =>
  typeof window !== 'undefined' &&
  /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);

/** Origin used for OAuth redirects (production unless running locally). */
export const getOAuthOrigin = (): string =>
  isLocalhost() ? window.location.origin : PRODUCTION_ORIGIN;

/** Full redirect URL for OAuth sign-in. */
export const getOAuthRedirectUrl = (path = '/'): string =>
  `${getOAuthOrigin()}${path}`;

/** Origin for email links (signup confirm / password reset). */
export const getEmailRedirectOrigin = (): string =>
  typeof window !== 'undefined' ? window.location.origin : PRODUCTION_ORIGIN;
