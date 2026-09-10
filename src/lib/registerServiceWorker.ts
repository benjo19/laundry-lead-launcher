/**
 * Single, guarded entry point for service-worker registration.
 *
 * The service worker must never run in dev, Lovable preview or inside an iframe,
 * otherwise stale HTML/JS keeps being served after a new deploy.
 */

const SW_URL = '/sw.js';

const isPreviewHost = (hostname: string): boolean =>
  hostname.startsWith('id-preview--') ||
  hostname.startsWith('preview--') ||
  hostname === 'lovableproject.com' ||
  hostname.endsWith('.lovableproject.com') ||
  hostname === 'lovableproject-dev.com' ||
  hostname.endsWith('.lovableproject-dev.com') ||
  hostname === 'beta.lovable.dev' ||
  hostname.endsWith('.beta.lovable.dev');

const isInIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

const unregisterAppServiceWorkers = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      registrations
        .filter((registration) => {
          const scriptURL =
            registration.active?.scriptURL ||
            registration.waiting?.scriptURL ||
            registration.installing?.scriptURL ||
            '';
          return scriptURL.endsWith(SW_URL);
        })
        .map((registration) => registration.unregister()),
    );
  } catch {
    // ignore – unregistering is best effort
  }
};

export const registerServiceWorker = (): void => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const killSwitch = new URLSearchParams(window.location.search).get('sw') === 'off';
  const shouldRefuse =
    !import.meta.env.PROD ||
    isInIframe() ||
    isPreviewHost(window.location.hostname) ||
    killSwitch;

  if (shouldRefuse) {
    void unregisterAppServiceWorkers();
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(SW_URL, { updateViaCache: 'none' })
      .then((registration) => {
        // Pick up a new deploy as soon as it is available.
        void registration.update();

        // Check again whenever the app regains focus.
        window.addEventListener('focus', () => {
          void registration.update();
        });
      })
      .catch(() => {
        // registration failures must never break the app
      });
  });

  // autoUpdate + skipWaiting: reload once when the new worker takes control.
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
};
