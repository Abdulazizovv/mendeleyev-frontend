'use client';

import { useEffect } from 'react';

export function PWAInstaller() {
  useEffect(() => {
    // Service Worker faqat production muhitida ishlaydi
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            // Unregister any stale service workers
            registration.update();
          })
          .catch(() => {
            // SW registration failed — app still works without it
          });
      });
    } else if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'production') {
      // Development: unregister any previously registered SW to prevent cache issues
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => reg.unregister());
      });
    }
  }, []);

  return null;
}
