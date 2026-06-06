import { useEffect, useRef, useState, useCallback } from 'react';
import { useRoutes } from 'react-router-dom';
import { ConfigProvider, theme as antTheme, App as AntApp } from 'antd';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/store/ui.store';
import { routes } from '@/routes';
import NotificationToast from '@/components/common/NotificationToast';
import { ChatbotWidget } from '@/components/chat/ChatbotWidget';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import './index.css';

/* ─────────────────────────────────────────────────────────────────
   useRealLoadProgress
   Tracks actual browser resource loading to drive the loading bar.

   Weight breakdown (sums to 100):
     • DOM interactive  (document.readyState ≥ 'interactive') → 20 pts
     • Network resources (JS, CSS, fonts, XHR via PerformanceObserver) → 60 pts
     • Images decoded   (HTMLImageElement.decode) → 20 pts

   Hard timeout: always completes within MAX_WAIT_MS.
───────────────────────────────────────────────────────────────── */
const MAX_WAIT_MS = 8000;

function useRealLoadProgress(enabled: boolean) {
  const [progress, setProgress] = useState(() => {
    // Eagerly seed progress so cached pages don't flash 0→100
    if (document.readyState === 'complete') return 80; // network done, images pending
    if (document.readyState === 'interactive') return 20;
    return 0;
  });
  // Use refs so callbacks always see latest values without re-subscribing
  const domReadyRef      = useRef(false); // 20 pts
  const networkDoneRef   = useRef(false); // 60 pts
  const imagesDoneRef    = useRef(false); // 20 pts
  const networkTotalRef  = useRef(0);
  const networkLoadedRef = useRef(0);
  const completedRef     = useRef(false);

  const recalc = useCallback(() => {
    if (completedRef.current) return;

    let pts = 0;

    // 1. DOM interactive (20 pts)
    if (domReadyRef.current) pts += 20;

    // 2. Network resources (0–60 pts, proportional)
    if (networkDoneRef.current) {
      pts += 60;
    } else if (networkTotalRef.current > 0) {
      pts += Math.round((networkLoadedRef.current / networkTotalRef.current) * 60);
    }

    // 3. Images (20 pts)
    if (imagesDoneRef.current) pts += 20;

    setProgress(Math.min(100, pts));
  }, []);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setProgress(100);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // ── Hard timeout safety net ──────────────────────────────────
    const hardTimeout = setTimeout(finish, MAX_WAIT_MS);

    // ── 1. DOM readyState ────────────────────────────────────────
    const onDomReady = () => {
      domReadyRef.current = true;
      recalc();
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onDomReady, { once: true });
    } else {
      onDomReady();
    }

    // ── 2. Network resources via PerformanceObserver ─────────────
    //    We snapshot resources already loaded, then observe new ones.
    const snapshotExisting = () => {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      networkTotalRef.current  += entries.length;
      networkLoadedRef.current += entries.length;
    };
    snapshotExisting();

    let observer: PerformanceObserver | null = null;
    if (typeof PerformanceObserver !== 'undefined') {
      observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];
        networkTotalRef.current  += entries.length;
        networkLoadedRef.current += entries.length;
        recalc();
      });
      observer.observe({ type: 'resource', buffered: false });
    }

    // When window load fires, all synchronous resources are done
    const onWindowLoad = () => {
      networkDoneRef.current = true;
      recalc();

      // ── 3. Images: decode all <img> elements ─────────────────
      const imgs = Array.from(document.images).filter(
        (img) => !img.complete || img.naturalWidth === 0
      );

      if (imgs.length === 0) {
        imagesDoneRef.current = true;
        recalc();
        return;
      }

      Promise.allSettled(
        imgs.map((img) =>
          img.decode().catch(() => { /* ignore decode errors */ })
        )
      ).then(() => {
        imagesDoneRef.current = true;
        recalc();
      });
    };

    if (document.readyState === 'complete') {
      onWindowLoad();
    } else {
      window.addEventListener('load', onWindowLoad, { once: true });
    }

    // Initial recalc to show immediate progress on cached pages
    recalc();

    return () => {
      clearTimeout(hardTimeout);
      observer?.disconnect();
      document.removeEventListener('DOMContentLoaded', onDomReady);
      window.removeEventListener('load', onWindowLoad);
    };
  }, [enabled, recalc, finish]);

  return progress;
}

export default function App() {
  const { i18n } = useTranslation();
  const themeMode = useUiStore((s) => s.theme);
  const element = useRoutes(routes);

  const direction = i18n.language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = i18n.language;
  }, [direction, i18n.language]);

  // Track whether the initial loading screen has been dismissed
  const [showLoader, setShowLoader] = useState(true);
  const loadProgress = useRealLoadProgress(showLoader);

  // Note: User authentication is checked in PrivateRoute component

  // Update body class for global CSS support.
  // body.dark (index.css) defines the dark-theme CSS variables, so the class
  // must be applied when themeMode is 'dark' — matching the Ant Design
  // darkAlgorithm config below.
  useEffect(() => {
    if (themeMode === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [themeMode]);

  return (
    <ConfigProvider
      direction={direction}
      theme={{
        algorithm: themeMode === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#2563eb', // Solux Blue
          borderRadius: 8,
          fontFamily: "'Inter', sans-serif",
          colorBgLayout: themeMode === 'dark' ? '#141414' : '#f3f4f6',
          colorBgContainer: themeMode === 'dark' ? '#1f1f1f' : '#ffffff',
        },
        components: {
          Button: {
            controlHeight: 40,
            borderRadius: 8,
          },
          Input: {
            controlHeight: 40,
            borderRadius: 8,
            colorBgContainer: themeMode === 'dark' ? '#1f1f1f' : '#ffffff',
          },
          Card: {
            borderRadiusLG: 12,
            colorBgContainer: themeMode === 'dark' ? '#1f1f1f' : '#ffffff',
            colorBorderSecondary: themeMode === 'dark' ? '#303030' : '#f0f0f0',
          },
          Table: {
            colorBgContainer: themeMode === 'dark' ? '#1f1f1f' : '#ffffff',
          }
        }
      }}
    >
      <AntApp>
        {/* ── Boot Loading Screen ────────────────────────────────
            Progress is driven by real browser load events:
            DOM ready (20%), network resources (60%), images (20%).
            Hard timeout: 8 s fallback to prevent infinite hang.
        ─────────────────────────────────────────────────────── */}
        {showLoader && (
          <LoadingScreen
            progress={loadProgress}
            onComplete={() => setShowLoader(false)}
          />
        )}
        <NotificationToast />
        {element}
        <ChatbotWidget />
      </AntApp>
    </ConfigProvider>
  );
}
