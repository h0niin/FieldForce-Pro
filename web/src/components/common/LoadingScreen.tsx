/**
 * LoadingScreen.tsx — FieldForce Pro
 *
 * Production-ready website loading screen component.
 *
 * Features:
 *  • Liquid-fill animation driven by a `progress` prop (0–100)
 *  • CSS clip-path: inset() fills the logo from bottom to top
 *  • Smooth 0.25s transition — no jitter when progress updates rapidly
 *  • Full light / dark theme support via body.dark class
 *  • Auto fade-out + unmount when progress reaches 100
 *  • Accepts an optional `onComplete` callback
 *
 * Usage:
 * ─────────────────────────────────────────────
 * // Static (controlled externally):
 * <LoadingScreen progress={progress} onComplete={() => setLoading(false)} />
 *
 * // Self-managed demo mode (mock interval built-in):
 * <LoadingScreen demo />
 * ─────────────────────────────────────────────
 *
 * Developer integration note:
 *   To sync with real loading:
 *     const [progress, setProgress] = useState(0);
 *     // Fire setProgress(n) as assets / API calls resolve.
 *     // When all done, call setProgress(100).
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import './LoadingScreen.css';

/* ─────────────────────────────────────────────────────────────────
   SVG PATHS (inline, no external assets)
───────────────────────────────────────────────────────────────── */

/**
 * Squircle: 190×190 rounded rect centred in a 200×200 viewBox.
 * rx=48 approximates the smooth squircle curvature from the logo.
 */
const SQUIRCLE_PROPS = {
  x: 5,
  y: 5,
  width: 190,
  height: 190,
  rx: 48,
  ry: 48,
} as const;

/**
 * Lightning bolt path — exact shape from the provided reference SVG.
 * Source: 512×512 viewBox with squircle at x=32,y=32,w=448,h=448.
 * Scaled to 200×200: x_new = 5 + (x_src − 32) × (190/448), y_new = 5 + (y_src − 32) × (190/448).
 * Arc radii scaled by the same factor (8→⁈3.4, 4→⁈1.7).
 *
 * Shape: horizontal top bar → rounded upper-right → diagonal down to inner notch
 *        → step right to outer-right → long diagonal to bottom-left tip (rounded)
 *        → diagonal up-right to inner-left notch → step left to outer-left
 *        → diagonal up-right to close
 */
const BOLT_PATH =
  'M 87.3 38.9 L 137.3 38.9 A 3.4 3.4 0 0 1 140.3 42.8 ' +
  'L 117.4 74.6 A 1.7 1.7 0 0 0 118.7 77.1 ' +
  'L 142.4 77.1 A 3.4 3.4 0 0 1 145.4 81.3 ' +
  'L 64.8 158.5 A 3.4 3.4 0 0 1 59.3 155.6 ' +
  'L 83.9 99.2 A 1.7 1.7 0 0 0 82.2 96.6 ' +
  'L 55.9 96.6 A 3.4 3.4 0 0 1 52.9 91.9 ' +
  'L 84.3 41.1 A 3.4 3.4 0 0 1 87.3 38.9 Z';

/* ─────────────────────────────────────────────────────────────────
   LOADING MESSAGES  (cycled while progress < 100)
───────────────────────────────────────────────────────────────── */
const LOADING_MESSAGES = [
  'Initialising workspace…',
  'Loading your data…',
  'Syncing field agents…',
  'Preparing dashboard…',
  'Almost ready…',
];

/* ─────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────── */
export interface LoadingScreenProps {
  /**
   * Current loading progress, 0–100.
   * When this reaches 100 the overlay will fade out and unmount.
   */
  progress?: number;

  /**
   * Demo/self-managed mode.
   * When true the component runs its own mock progress interval
   * so you can preview it without wiring up external state.
   */
  demo?: boolean;

  /**
   * Fired once the fade-out transition completes and the
   * component has fully unmounted from the DOM.
   */
  onComplete?: () => void;

  /**
   * Optional CSS class added to the overlay root.
   */
  className?: string;
}

/* ─────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────── */
export function LoadingScreen({
  progress: externalProgress,
  demo = false,
  onComplete,
  className = '',
}: LoadingScreenProps) {

  /* ── State ────────────────────────────────────────────────────── */
  const [internalProgress, setInternalProgress] = useState(0);
  const [isFading, setIsFading]   = useState(false);
  const [isMounted, setIsMounted] = useState(true);
  const [msgIndex, setMsgIndex]   = useState(0);

  /* Determine which progress value to use */
  const rawProgress = demo ? internalProgress : (externalProgress ?? 0);
  const progress    = Math.min(100, Math.max(0, rawProgress));

  /* ── Theme detection (follows OS / browser colour scheme) ─────── */
  const [isDark, setIsDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  /* ── Demo: mock progress interval ────────────────────────────── */
  useEffect(() => {
    if (!demo) return;

    let current = 0;
    const id = setInterval(() => {
      // Simulate realistic loading: fast at start, slows near end
      const increment =
        current < 30 ? Math.random() * 6 + 3   // 3–9% per tick (fast)
        : current < 70 ? Math.random() * 4 + 2 // 2–6% per tick (medium)
        : current < 90 ? Math.random() * 2 + 1 // 1–3% per tick (slow)
        : Math.random() * 1 + 0.5;             // 0.5–1.5% per tick (crawl)

      current = Math.min(100, current + increment);
      setInternalProgress(current);

      if (current >= 100) clearInterval(id);
    }, 150);

    return () => clearInterval(id);
  }, [demo]);

  /* ── Cycle loading message ────────────────────────────────────── */
  useEffect(() => {
    if (progress >= 100) return;
    const id = setInterval(() => {
      setMsgIndex(i => (i + 1) % LOADING_MESSAGES.length);
    }, 1800);
    return () => clearInterval(id);
  }, [progress]);

  /* ── Fade-out when complete ───────────────────────────────────── */
  useEffect(() => {
    if (progress < 100) return;

    // Brief pause at 100% before fading
    const pauseId = setTimeout(() => {
      setIsFading(true);

      // Wait for CSS fade-out transition (0.65s) then unmount
      const unmountId = setTimeout(() => {
        setIsMounted(false);
        onComplete?.();
      }, 680);

      return () => clearTimeout(unmountId);
    }, 350);

    return () => clearTimeout(pauseId);
  }, [progress, onComplete]);

  /* ── Bail early if unmounted ──────────────────────────────────── */
  if (!isMounted) return null;

  /* ──────────────────────────────────────────────────────────────
     LIQUID-FILL CLIP PATH
     ─────────────────────────────────────────────────────────────
     CSS  clip-path: inset(top right bottom left)
     Top inset = (100 - progress)%  → starts at 100% (nothing visible)
                                       ends   at 0%   (fully visible)
     The SVG fill layer is revealed from the BOTTOM upward as
     the top inset shrinks.
  ────────────────────────────────────────────────────────────── */
  const topInset  = (100 - progress).toFixed(3);
  const fillClip  = `inset(${topInset}% 0% 0% 0%)`;

  /* ── Glow intensity grows with progress ───────────────────────── */
  const glowActive = progress > 10;

  return (
    <div
      className={[
        'ls-overlay',
        isDark ? 'ls-theme-dark' : 'ls-theme-light',
        isFading ? 'ls-is-fading' : '',
        className,
      ].filter(Boolean).join(' ')}
      role="status"
      aria-label={`Loading FieldForce Pro, ${Math.round(progress)} percent complete`}
      aria-live="polite"
    >
      <div className="ls-content">

        {/* ── Logo ───────────────────────────────────────────────── */}
        <div className={`ls-logo-wrapper ${glowActive ? 'ls-glow-active' : ''}`}>

          {/* Breathing pulse rings (decorative) */}
          <div className="ls-pulse-ring" aria-hidden="true" />
          <div className="ls-pulse-ring" aria-hidden="true" />

          {/* ── LAYER 1: Outline SVG (always visible) ────────────── */}
          <svg
            className="ls-svg-outline"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Squircle outline */}
            <rect
              className="ls-squircle-outline"
              {...SQUIRCLE_PROPS}
            />
            {/* Bolt outline */}
            <path
              className="ls-bolt-outline"
              d={BOLT_PATH}
            />
          </svg>

          {/* ── LAYER 2: Fill SVG (clipped bottom-to-top) ────────── */}
          <div
            className="ls-fill-clip-wrapper"
            style={{ clipPath: fillClip }}
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 200 200"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '100%', height: '100%' }}
            >
              {/* Blue squircle fill */}
              <rect
                className="ls-squircle-fill"
                {...SQUIRCLE_PROPS}
              />
              {/* White bolt fill — sits on top of the blue */}
              <path
                className="ls-bolt-fill"
                d={BOLT_PATH}
              />
            </svg>
          </div>
        </div>

        {/* ── Brand text ─────────────────────────────────────────── */}
        <div className="ls-meta">
          <span className="ls-brand-name">FieldForce Pro</span>
          <span className="ls-tagline">Field Service Management</span>
        </div>

        {/* ── Progress row ───────────────────────────────────────── */}
        <div className="ls-progress-row">
          {/* Thin progress bar */}
          <div className="ls-bar-track" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="ls-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Percentage + status message */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span className="ls-percentage">{Math.round(progress)}%</span>
            <span className="ls-status-msg">
              {progress >= 100 ? 'Ready!' : LOADING_MESSAGES[msgIndex]}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   HOOK — useLoadingProgress
   ─────────────────────────────────────────────────────────────────
   Provides a clean API for tracking multiple async tasks and
   computing an aggregate progress value.

   Example:
   ──────────────────────────────────────────────────────────────
   const { progress, trackPromise } = useLoadingProgress();

   useEffect(() => {
     trackPromise(fetchUser(),         { weight: 40 });
     trackPromise(fetchConfig(),       { weight: 20 });
     trackPromise(preloadAssets(),     { weight: 40 });
   }, []);

   return <LoadingScreen progress={progress} />;
   ──────────────────────────────────────────────────────────────
*/
interface TrackOptions {
  /** Relative weight of this task (default 1). Higher = more progress impact. */
  weight?: number;
}

export function useLoadingProgress() {
  const tasksRef  = useRef<Map<symbol, { done: boolean; weight: number }>>(new Map());
  const [progress, setProgress] = useState(0);

  const recalculate = useCallback(() => {
    const tasks    = Array.from(tasksRef.current.values());
    const total    = tasks.reduce((s, t) => s + t.weight, 0);
    const done     = tasks.reduce((s, t) => s + (t.done ? t.weight : 0), 0);
    const pct      = total === 0 ? 0 : Math.round((done / total) * 100);
    setProgress(pct);
  }, []);

  const trackPromise = useCallback(
    <T,>(promise: Promise<T>, options: TrackOptions = {}): Promise<T> => {
      const key    = Symbol();
      const weight = options.weight ?? 1;

      tasksRef.current.set(key, { done: false, weight });
      recalculate();

      promise
        .catch(() => {/* absorb errors — don't stall the loader */})
        .finally(() => {
          const task = tasksRef.current.get(key);
          if (task) {
            tasksRef.current.set(key, { ...task, done: true });
            recalculate();
          }
        });

      return promise;
    },
    [recalculate]
  );

  /**
   * Manually advance progress by a fixed amount.
   * Useful for steps that don't return a Promise.
   */
  const advance = useCallback((amount: number) => {
    setProgress(prev => Math.min(100, prev + amount));
  }, []);

  /**
   * Force progress to 100 (e.g. after a timeout fallback).
   */
  const complete = useCallback(() => setProgress(100), []);

  return { progress, trackPromise, advance, complete };
}

export default LoadingScreen;
