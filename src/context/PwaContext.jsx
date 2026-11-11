'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const PwaContext = createContext(null);

export function PwaProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect standalone display mode
    const checkStandalone = () => {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
      setIsInstalled(isStandalone);
    };
    checkStandalone();

    const displayModeQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = (e) => setIsInstalled(e.matches);
    displayModeQuery.addEventListener('change', handleDisplayChange);

    // Detect iOS & In-app browsers (P-544)
    const ua = window.navigator.userAgent || '';
    const isIosDevice = /iPhone|iPad|iPod/i.test(ua);
    setIsIos(isIosDevice);

    const isInApp = /FBAN|FBAV|Instagram|TikTok|Line/i.test(ua);
    setIsInAppBrowser(isInApp);

    // Global error & unhandledrejection reporting (P-563)
    const handleGlobalError = (event) => {
      console.warn('[PWA Client Error Handled]:', event.message || event);
    };
    const handleUnhandledRejection = (event) => {
      console.warn('[PWA Unhandled Rejection Handled]:', event.reason || event);
    };
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Chromium beforeinstallprompt (P-416)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // Register Service Worker and manage lifecycle updates
    let updateInterval = null;
    let handleVisibilityChange = null;

    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          // If there is already a waiting worker on load
          if (reg.waiting) {
            setWaitingWorker(reg.waiting);
            setUpdateAvailable(true);
          }

          // Listen for new workers installing and becoming ready
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                setUpdateAvailable(true);
              }
            });
          });

          // Check for service worker updates periodically (every 10 min)
          updateInterval = setInterval(() => {
            if (reg && typeof reg.update === 'function') {
              reg.update().catch(() => {});
            }
          }, 10 * 60 * 1000);

          // Check for updates when user returns to the tab/app
          handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && reg && typeof reg.update === 'function') {
              reg.update().catch(() => {});
            }
          };
          document.addEventListener('visibilitychange', handleVisibilityChange);
        })
        .catch((err) => {
          console.warn('[SW Registration Notice]:', err);
        });

      let refreshing = false;
      const hadControllerOnLoad = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing && hadControllerOnLoad) {
          refreshing = true;
          window.location.reload();
        }
      });
    }

    return () => {
      displayModeQuery.removeEventListener('change', handleDisplayChange);
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      if (updateInterval) clearInterval(updateInterval);
      if (handleVisibilityChange) document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsInstallable(false);
    return outcome === 'accepted';
  };

  const applyUpdate = () => {
    if (waitingWorker) {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        }, { once: true });
      }
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return (
    <PwaContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isIos,
        isInAppBrowser,
        updateAvailable,
        promptInstall,
        applyUpdate,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}

export const usePwa = () => useContext(PwaContext);
