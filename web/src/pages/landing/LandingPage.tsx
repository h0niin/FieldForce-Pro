import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { getPlanPricing, formatPlanPrice, formatFeatureName, SUPPORTED_CURRENCIES } from '@/utils/pricing';
import { usePublicSubscriptionPlans } from '@/hooks/use-auth';

import {
  ToolOutlined,
  ScheduleOutlined,
  DollarOutlined,
  MobileOutlined,
  CheckCircleFilled,
  TeamOutlined,
  FileTextOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  CloudOutlined,
  BarChartOutlined,
  GlobalOutlined,
  CustomerServiceOutlined,
  MenuOutlined,
  CloseOutlined,
  StarFilled,
  RightOutlined,
  PlayCircleOutlined,
  RocketOutlined,
  AimOutlined,
  SyncOutlined,
  BellOutlined,
  MailOutlined,
  EyeOutlined,
  FundOutlined,
  CrownOutlined,
  ApartmentOutlined,
  BranchesOutlined,
  SunOutlined,
  MoonOutlined,
} from '@ant-design/icons';
import { ReactLenis } from 'lenis/react';
import { useTranslation } from 'react-i18next';
import './LandingPage.css';

// ─── Scroll-reveal hook using IntersectionObserver ───
function useScrollReveal(threshold = 0.15) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const elements = root.querySelectorAll('.lp-reveal');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // animate only once
          }
        });
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [threshold]);

  return containerRef;
}

// ─── Animated counter hook ───
function useCountUp(end: number, duration = 1800) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          observer.unobserve(el);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return { ref, value };
}

// ─── Scroll parallax hook — drives CSS custom properties ───
function useScrollParallax() {
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const hero = heroRef.current;
        if (hero) {
          hero.style.setProperty('--scroll-y', String(y));
        }
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return heroRef;
}

// ─── Mouse glow tracker on a section ───
function useMouseGlow() {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--glow-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--glow-y', `${e.clientY - rect.top}px`);
  }, []);

  return { ref, handleMove };
}

export default function LandingPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data: plans } = usePublicSubscriptionPlans();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [scrolled, setScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const currency = useUiStore((s) => s.currency);
  const setCurrency = useUiStore((s) => s.setCurrency);

  useEffect(() => {
    const stored = localStorage.getItem('ui-storage');
    let hasCurrency = false;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.state && parsed.state.currency) {
          hasCurrency = true;
        }
      } catch (e) {}
    }
    
    if (!hasCurrency) {
      fetch('https://ipapi.co/json/')
        .then((res) => res.json())
        .then((data) => {
          if (data.country_code === 'IN') {
            setCurrency('INR');
          } else {
            setCurrency('USD');
          }
        })
        .catch(() => {});
    }
  }, [setCurrency]);
  const [isDark, setIsDark] = useState(() => {
    // If user has explicitly chosen a theme, respect it
    const saved = localStorage.getItem('lp-theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    // Otherwise, follow Chrome / OS system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const revealRef = useScrollReveal();
  const heroParallax = useScrollParallax();
  const featuresGlow = useMouseGlow();

  // Counters for hero stats
  const stat1 = useCountUp(40);
  const stat2 = useCountUp(95);
  const stat3 = useCountUp(3);
  const stat4 = useCountUp(60);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
      // Scroll progress for navbar indicator
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docH > 0 ? Math.min(window.scrollY / docH, 1) : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync with system theme changes (e.g., Chrome switching dark mode)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      // Only auto-follow system if user hasn't manually overridden
      const saved = localStorage.getItem('lp-theme');
      if (!saved) {
        setIsDark(e.matches);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Dark mode toggle — persists to localStorage
  useEffect(() => {
    const el = document.querySelector('.landing-page');
    if (el) {
      el.classList.toggle('dark', isDark);
    }
    localStorage.setItem('lp-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const scrollToSection = (id: string) => {
    setMobileNavOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
    setLangOpen(false);
    // Force RTL/LTR switch if needed
    document.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  const languages = [
    { key: 'en', label: 'English' },
    { key: 'ar', label: 'العربية' },
    { key: 'ml', label: 'മലയാളം' },
    { key: 'hi', label: 'हिन्दी' },
  ];

  const currentLang = languages.find(l => l.key === i18n.language) || languages[0];

  return (
    <ReactLenis root>
      <div className={`landing-page${isDark ? ' dark' : ''}`} ref={revealRef}>
        {/* ========== Navbar ========== */}
        <nav className={`lp-navbar ${scrolled ? 'scrolled' : ''}`}>
          <div className="lp-scroll-progress" style={{ transform: `scaleX(${scrollProgress})`, transformOrigin: i18n.language === 'ar' ? 'right' : 'left' }} />
          <div className="lp-navbar-inner">
            <a href="#" className="lp-logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              <div className="lp-logo-icon" aria-label="FieldForce Pro icon">
                <svg width="20" height="20" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  {/* Exact lightning bolt from reference SVG */}
                  <path
                    d="M 226,112 L 344,112 A 8,8 0 0,1 351,121 L 297,196 A 4,4 0 0,0 300,202 L 356,202 A 8,8 0 0,1 363,212 L 173,394 A 8,8 0 0,1 160,387 L 218,254 A 4,4 0 0,0 214,248 L 152,248 A 8,8 0 0,1 145,237 L 219,117 A 8,8 0 0,1 226,112 Z"
                    fill="white"
                  />
                </svg>
              </div>
              {t('app.name')}
            </a>

            <ul className="lp-nav-links">
              <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>{t('landing.nav.features')}</a></li>
              <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>{t('landing.nav.howItWorks')}</a></li>
              <li><a href="#solutions" onClick={(e) => { e.preventDefault(); scrollToSection('solutions'); }}>{t('landing.nav.solutions')}</a></li>
              <li><a href="#testimonials" onClick={(e) => { e.preventDefault(); scrollToSection('testimonials'); }}>{t('landing.nav.testimonials')}</a></li>
              <li><a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }}>{t('landing.nav.pricing')}</a></li>
            </ul>

            <div className="lp-nav-actions">
              {/* Language Switcher */}
              <div className="lp-lang-switcher">
                <button
                  className="lp-lang-btn"
                  onClick={() => setLangOpen(!langOpen)}
                >
                  <GlobalOutlined /> {currentLang.label}
                </button>
                {langOpen && (
                  <div className="lp-lang-dropdown">
                    {languages.map((l) => (
                      <button
                        key={l.key}
                        className={i18n.language === l.key ? 'active' : ''}
                        onClick={() => handleLanguageChange(l.key)}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Currency Switcher */}
              <div className="lp-lang-switcher" style={{ marginLeft: 8 }}>
                <button
                  className="lp-lang-btn"
                  onClick={() => setCurrencyOpen(!currencyOpen)}
                >
                  💵 {currency}
                </button>
                {currencyOpen && (
                  <div className="lp-lang-dropdown">
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <button
                        key={c.key}
                        className={currency === c.key ? 'active' : ''}
                        onClick={() => {
                          setCurrency(c.key);
                          setCurrencyOpen(false);
                        }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dark mode toggle */}
              <button
                id="lp-theme-toggle"
                className="lp-theme-toggle"
                onClick={() => setIsDark((d) => !d)}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Light mode' : 'Dark mode'}
              >
                {isDark ? <SunOutlined /> : <MoonOutlined />}
              </button>

              {isAuthenticated ? (
                <button
                  className="lp-user-avatar-btn"
                  onClick={() => navigate('/dashboard')}
                  title={user ? `${user.first_name} ${user.last_name}` : t('nav.dashboard')}
                >
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="avatar" className="lp-user-avatar-img" />
                  ) : (
                    <span className="lp-user-avatar-initials">
                      {user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() : 'U'}
                    </span>
                  )}
                </button>
              ) : (
                <>
                  <button className="lp-btn lp-btn-ghost" onClick={() => navigate('/login')}>{t('auth.login')}</button>
                  <button className="lp-btn lp-btn-primary" onClick={() => navigate('/register')}>
                    Get Started
                  </button>
                </>
              )}
            </div>

            <button className="lp-mobile-toggle" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
              {mobileNavOpen ? <CloseOutlined /> : <MenuOutlined />}
            </button>
          </div>
        </nav>

        {/* Mobile Nav Drawer */}
        <div className={`lp-mobile-nav ${mobileNavOpen ? 'open' : ''}`}>
          <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>{t('landing.nav.features')}</a>
          <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>{t('landing.nav.howItWorks')}</a>
          <a href="#solutions" onClick={(e) => { e.preventDefault(); scrollToSection('solutions'); }}>{t('landing.nav.solutions')}</a>
          <a href="#testimonials" onClick={(e) => { e.preventDefault(); scrollToSection('testimonials'); }}>{t('landing.nav.testimonials')}</a>
          <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }}>{t('landing.nav.pricing')}</a>
          <div className="lp-mobile-nav-actions">
            {/* Mobile Language Selection */}
            <div className="lp-mobile-lang-list">
              {languages.map((l) => (
                <button
                  key={l.key}
                  onClick={() => handleLanguageChange(l.key)}
                  className={`lp-mobile-lang-btn ${i18n.language === l.key ? 'active' : ''}`}
                >
                  <GlobalOutlined /> {l.label}
                </button>
              ))}
            </div>

            {isAuthenticated ? (
              <button className="lp-btn lp-btn-primary" onClick={() => navigate('/dashboard')} style={{ width: '100%' }}>
                {t('landing.nav.goToDashboard')}
              </button>
            ) : (
              <>
                <button className="lp-btn lp-btn-outline" onClick={() => navigate('/login')} style={{ width: '100%' }}>{t('auth.login')}</button>
                <button className="lp-btn lp-btn-primary" onClick={() => navigate('/register')} style={{ width: '100%' }}>
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>

        {/* ========== Hero Section ========== */}
        <section className="lp-hero" ref={heroParallax}>
          {/* Fluid gradient mesh blobs */}
          <div className="lp-hero-blobs" aria-hidden="true">
            <div className="lp-blob lp-blob-1" />
            <div className="lp-blob lp-blob-2" />
          </div>
          {/* Decorative elements from reference */}
          <div className="lp-hero-decor" aria-hidden="true">
            <span className="lp-decor-bracket lp-bracket-tl">{'┌ ┐'}</span>
            <span className="lp-decor-bracket lp-bracket-bl">{'└ ┘'}</span>
            <span className="lp-decor-bracket lp-bracket-tr">{'┌ ┐'}</span>
            <span className="lp-decor-bracket lp-bracket-br">{'└ ┘'}</span>
            <span className="lp-decor-plus lp-plus-1">+</span>
            <span className="lp-decor-plus lp-plus-2">+</span>
            <span className="lp-decor-plus lp-plus-3">+</span>
            <span className="lp-decor-plus lp-plus-4">+</span>
            <span className="lp-decor-plus lp-plus-5">+</span>
            <span className="lp-decor-plus lp-plus-6">+</span>
            <span className="lp-decor-vtext lp-vtext-left">FieldForce</span>
            <span className="lp-decor-vtext lp-vtext-right">Pro</span>
            <div className="lp-decor-shapes">
              <span className="lp-shape lp-shape-circle" />
              <span className="lp-shape lp-shape-triangle" />
              <span className="lp-shape lp-shape-square" />
            </div>
            <div className="lp-decor-qr" />
            <div className="lp-decor-rings" />
          </div>
          <div className="lp-container">
            <div className="lp-hero-content lp-parallax-content">
              <div className="lp-hero-badge">
                <span className="lp-badge-dot" />
                <RocketOutlined /> {t('landing.hero.badge')}
              </div>
              <h1 className="lp-text-reveal">
                {t('landing.hero.title1')}{' '}
                <span>{t('landing.hero.title2')}</span>
              </h1>
              <p className="lp-hero-subtitle">
                {t('landing.hero.subtitle')}
              </p>
              <div className="lp-hero-actions">
                <button className="lp-btn lp-btn-primary lp-btn-lg" onClick={() => navigate('/register')}>
                  Get Started Free <RightOutlined />
                </button>
                <button className="lp-btn lp-btn-outline lp-btn-lg" onClick={() => scrollToSection('how-it-works')}>
                  <PlayCircleOutlined /> {t('landing.hero.learnMore')}
                </button>
              </div>
              <div className="lp-hero-stats">
                <div className="lp-hero-stat">
                  <span className="lp-hero-stat-value" ref={stat1.ref}>{stat1.value}%</span>
                  <span className="lp-hero-stat-label">{t('landing.hero.stat1')}</span>
                </div>
                <div className="lp-hero-stat">
                  <span className="lp-hero-stat-value" ref={stat2.ref}>{stat2.value}%</span>
                  <span className="lp-hero-stat-label">{t('landing.hero.stat2')}</span>
                </div>
                <div className="lp-hero-stat">
                  <span className="lp-hero-stat-value" ref={stat3.ref}>{stat3.value}x</span>
                  <span className="lp-hero-stat-label">{t('landing.hero.stat3')}</span>
                </div>
                <div className="lp-hero-stat">
                  <span className="lp-hero-stat-value" ref={stat4.ref}>{stat4.value}%</span>
                  <span className="lp-hero-stat-label">{t('landing.hero.stat4')}</span>
                </div>
              </div>
            </div>

            {/* Dashboard Mockup */}
            <div className="lp-hero-image lp-parallax-image">
              <div className="lp-hero-screenshot">
                <div className="lp-dashboard-mockup">
                  <div className="lp-mockup-topbar">
                    <div className="lp-mockup-dot" />
                    <div className="lp-mockup-dot" />
                    <div className="lp-mockup-dot" />
                  </div>
                  <div className="lp-mockup-body">
                    <div className="lp-mockup-sidebar">
                      <div className="lp-mockup-sidebar-item active">
                        <div className="lp-mockup-sidebar-icon" /> {t('nav.dashboard')}
                      </div>
                      <div className="lp-mockup-sidebar-item">
                        <div className="lp-mockup-sidebar-icon" /> {t('nav.workOrders')}
                      </div>
                      <div className="lp-mockup-sidebar-item">
                        <div className="lp-mockup-sidebar-icon" /> {t('sidebar.dispatchBoard')}
                      </div>
                      <div className="lp-mockup-sidebar-item">
                        <div className="lp-mockup-sidebar-icon" /> {t('nav.invoices')}
                      </div>
                      <div className="lp-mockup-sidebar-item">
                        <div className="lp-mockup-sidebar-icon" /> {t('nav.reports')}
                      </div>
                      <div className="lp-mockup-sidebar-item">
                        <div className="lp-mockup-sidebar-icon" /> {t('nav.contacts')}
                      </div>
                    </div>
                    <div className="lp-mockup-content">
                      <div className="lp-mockup-header-bar">
                        <span className="lp-mockup-title">{t('landing.mockup.dashboardOverview')}</span>
                        <span className="lp-mockup-btn-sm">+ {t('workOrders.actions.create')}</span>
                      </div>
                      <div className="lp-mockup-stats-row">
                        <div className="lp-mockup-stat-card">
                          <div className="lp-mockup-stat-label">{t('dashboard.activeJobs')}</div>
                          <div className="lp-mockup-stat-value" style={{ color: '#2563eb' }}>24</div>
                        </div>
                        <div className="lp-mockup-stat-card">
                          <div className="lp-mockup-stat-label">{t('common.completed')}</div>
                          <div className="lp-mockup-stat-value" style={{ color: '#10b981' }}>156</div>
                        </div>
                        <div className="lp-mockup-stat-card">
                          <div className="lp-mockup-stat-label">{t('dashboard.revenue')}</div>
                          <div className="lp-mockup-stat-value" style={{ color: '#f59e0b' }}>$48K</div>
                        </div>
                        <div className="lp-mockup-stat-card">
                          <div className="lp-mockup-stat-label">{t('landing.mockup.technicians')}</div>
                          <div className="lp-mockup-stat-value" style={{ color: '#8b5cf6' }}>18</div>
                        </div>
                      </div>
                      <div className="lp-mockup-chart">
                        <div className="lp-mockup-chart-title">{t('landing.mockup.weeklyPerformance')}</div>
                        <div className="lp-mockup-chart-bars">
                          <div className="lp-mockup-bar" style={{ height: '60%' }} />
                          <div className="lp-mockup-bar" style={{ height: '80%' }} />
                          <div className="lp-mockup-bar" style={{ height: '45%' }} />
                          <div className="lp-mockup-bar" style={{ height: '90%' }} />
                          <div className="lp-mockup-bar" style={{ height: '70%' }} />
                          <div className="lp-mockup-bar" style={{ height: '55%' }} />
                          <div className="lp-mockup-bar" style={{ height: '85%' }} />
                          <div className="lp-mockup-bar" style={{ height: '65%' }} />
                          <div className="lp-mockup-bar" style={{ height: '75%' }} />
                          <div className="lp-mockup-bar" style={{ height: '95%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== Trusted By ========== */}
        <section className="lp-trusted">
          <div className="lp-container">
            <p className="lp-trusted-title lp-reveal lp-reveal-up">{t('landing.trusted.title')}</p>
            <div className="lp-trusted-logos">
              <div className="lp-trusted-logos-track">
                {[...Array(2)].flatMap((_, dupeIdx) =>
                  [
                    { name: 'TechServ', color: '#2563eb' },
                    { name: 'AirFlow', color: '#06b6d4' },
                    { name: 'ProFix', color: '#10b981' },
                    { name: 'ElectraCo', color: '#f59e0b' },
                    { name: 'CleanPro', color: '#8b5cf6' },
                    { name: 'SolarEdge', color: '#ef4444' },
                    { name: 'PipeMaster', color: '#ec4899' },
                    { name: 'BuildRight', color: '#14b8a6' },
                  ].map((company) => (
                    <div key={`${company.name}-${dupeIdx}`} className="lp-trusted-logo">
                      <div className="lp-trusted-logo-dot" style={{ background: company.color }}>
                        {company.name[0]}
                      </div>
                      {company.name}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ========== Core Features (4 Pillars) ========== */}
        <section id="features" className="lp-section lp-section-alt lp-glow-section" ref={featuresGlow.ref} onMouseMove={featuresGlow.handleMove}>
          <div className="lp-glow-blob" />
          <div className="lp-container">
            <div className="lp-section-header lp-reveal lp-reveal-up">
              <span className="lp-section-tag">{t('landing.nav.features')}</span>
              <h2 className="lp-section-title">{t('landing.features.title')}</h2>
              <p className="lp-section-subtitle">
                {t('landing.features.subtitle')}
              </p>
            </div>

            <div className="lp-features-grid">
              {[
                {
                  icon: <CustomerServiceOutlined />, color: 'blue',
                  title: 'AI‑Powered Customer Chatbot',
                  desc: '24/7 intelligent support that creates tickets, answers FAQs, and generates estimates automatically.',
                  bullets: ['Ticket creation from chat', 'FAQ knowledge base', 'AI estimate generation', 'Multi-language support'],
                },
                {
                  icon: <ScheduleOutlined />, color: 'cyan',
                  title: 'Autonomous Scheduling & Dispatch',
                  desc: 'AI-driven job assignment that optimises routes, skills, and availability — reducing travel time by 30%.',
                  bullets: ['Skill-based auto-assign', 'AI route optimisation', 'Drag-and-drop board', 'Real-time GPS tracking'],
                },
                {
                  icon: <SyncOutlined />, color: 'green',
                  title: 'Predictive Maintenance (IoT + LSTM)',
                  desc: 'IoT sensor data combined with LSTM models to forecast equipment failures before they happen.',
                  bullets: ['Sensor data ingestion', 'LSTM failure prediction', 'Automated work order creation', 'Asset health dashboards'],
                },
                {
                  icon: <EyeOutlined />, color: 'amber',
                  title: 'Computer‑Vision Quality Assurance',
                  desc: 'YOLOv8-powered visual inspection that detects defects, verifies job completion, and flags anomalies.',
                  bullets: ['YOLOv8 object detection', 'Defect classification', 'Photo-based job verification', 'Compliance photo audit'],
                },
                {
                  icon: <FileTextOutlined />, color: 'blue',
                  title: 'Document AI (OCR + LLM)',
                  desc: 'Extract and structure data from invoices, contracts, and job sheets with OCR and large language models.',
                  bullets: ['Invoice OCR extraction', 'Contract parsing', 'Auto-fill from documents', 'LLM-powered summaries'],
                },
                {
                  icon: <BarChartOutlined />, color: 'cyan',
                  title: 'Natural‑Language Analytics',
                  desc: 'Ask questions in plain English and get instant charts, reports, and operational insights.',
                  bullets: ['Plain-English queries', 'Auto-generated charts', 'KPI trend analysis', 'Exportable reports'],
                },
                {
                  icon: <FundOutlined />, color: 'green',
                  title: 'Churn & Demand Forecasting',
                  desc: 'Gradient-boosting + Prophet models predict customer churn and future service demand to keep you ahead.',
                  bullets: ['Churn risk scoring', 'Demand forecasting', 'Revenue projections', 'Seasonal trend detection'],
                },
                {
                  icon: <CrownOutlined />, color: 'amber',
                  title: 'Super‑Admin Dashboard',
                  desc: 'Full-platform oversight with audit logs, API-key management, health monitoring, and billing analytics.',
                  bullets: ['Complete audit logs', 'API key management', 'System health monitoring', 'Billing analytics'],
                },
                {
                  icon: <ApartmentOutlined />, color: 'blue',
                  title: 'Full‑Stack FSM Modules',
                  desc: 'Every module you need: Contacts, Assets, Service Requests, Estimates, Work Orders, Inventory, SLA, Reviews.',
                  bullets: ['Asset registry & IoT', 'SLA management', 'Inventory tracking', 'Reviews & ratings'],
                },
                {
                  icon: <MailOutlined />, color: 'cyan',
                  title: 'Multi‑Channel Intake',
                  desc: 'Capture service requests via email, web form, WhatsApp, SMS, AI chat, and REST API — all in one inbox.',
                  bullets: ['Email & web form', 'WhatsApp & SMS', 'AI chat intake', 'REST API ingestion'],
                },
                {
                  icon: <BranchesOutlined />, color: 'green',
                  title: 'Blueprint Workflow Editor',
                  desc: 'Visual drag-and-drop state-machine editor to design and customise your own service workflows.',
                  bullets: ['Visual state-machine editor', 'Custom status transitions', 'Conditional logic rules', 'Template library'],
                },
                {
                  icon: <MobileOutlined />, color: 'amber',
                  title: 'Offline‑First Mobile App',
                  desc: 'WatermelonDB-powered sync gives field techs full functionality even without internet connectivity.',
                  bullets: ['WatermelonDB sync engine', 'Offline job management', 'Photo & signature capture', 'Voice notes & AI assist'],
                },
                {
                  icon: <SafetyCertificateOutlined />, color: 'blue',
                  title: 'Enterprise‑Grade Security',
                  desc: 'JWT + 2FA authentication, unlimited custom RBAC, full audit trails, and SOC-2-ready infrastructure.',
                  bullets: ['JWT + 2FA auth', 'Unlimited custom RBAC', 'Full audit trails', 'SOC-2-ready'],
                },
                {
                  icon: <GlobalOutlined />, color: 'cyan',
                  title: 'Internationalisation (25+ Languages)',
                  desc: 'Locale-aware UI with RTL support and 25+ languages so your global team works in their own language.',
                  bullets: ['25+ languages', 'RTL layout support', 'Locale-aware formatting', 'Per-user language setting'],
                },
                {
                  icon: <ApiOutlined />, color: 'green',
                  title: 'Extensible API Marketplace',
                  desc: 'REST, GraphQL, and Webhooks give partners and developers a first-class integration platform.',
                  bullets: ['REST & GraphQL APIs', 'Webhooks engine', 'OAuth 2.0 apps', 'Developer sandbox'],
                },
              ].map((feat, idx) => (
                <div key={idx} className={`lp-feature-card lp-reveal lp-reveal-up lp-stagger-${(idx % 4) + 1}`}>
                  <div className={`lp-feature-icon lp-feature-icon-${feat.color}`}>{feat.icon}</div>
                  <h3>{feat.title}</h3>
                  <p>{feat.desc}</p>
                  <ul className="lp-feature-list">
                    {feat.bullets.map((b) => (
                      <li key={b}><CheckCircleFilled className="lp-check" /> {b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== How It Works ========== */}
        <section id="how-it-works" className="lp-section">
          <div className="lp-container">
            <div className="lp-section-header lp-reveal lp-reveal-up">
              <span className="lp-section-tag">{t('landing.nav.howItWorks')}</span>
              <h2 className="lp-section-title">{t('landing.hiw.title')}</h2>
              <p className="lp-section-subtitle">
                {t('landing.hiw.subtitle')}
              </p>
            </div>

            <div className="lp-hiw">
              {[
                { num: '01', icon: <MailOutlined />, title: t('landing.hiw.step1.title'), desc: t('landing.hiw.step1.desc'), color: '#818cf8', bg: 'rgba(99,102,241,0.12)' },
                { num: '02', icon: <FileTextOutlined />, title: t('landing.hiw.step2.title'), desc: t('landing.hiw.step2.desc'), color: '#22d3ee', bg: 'rgba(6,182,212,0.12)' },
                { num: '03', icon: <AimOutlined />, title: t('landing.hiw.step3.title'), desc: t('landing.hiw.step3.desc'), color: '#34d399', bg: 'rgba(16,185,129,0.12)' },
                { num: '04', icon: <DollarOutlined />, title: t('landing.hiw.step4.title'), desc: t('landing.hiw.step4.desc'), color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
              ].map((step, idx) => (
                <div key={step.num} className={`lp-hiw-card lp-reveal lp-reveal-up lp-stagger-${idx + 1}`}>
                  <div className="lp-hiw-card-top">
                    <div className="lp-hiw-icon" style={{ background: step.bg, color: step.color }}>{step.icon}</div>
                    <span className="lp-hiw-num" style={{ color: step.color }}>{step.num}</span>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== Feature Highlights (Alternating) ========== */}
        <section id="solutions" className="lp-section lp-section-alt">
          <div className="lp-container">
            <div className="lp-section-header lp-reveal lp-reveal-up">
              <span className="lp-section-tag">{t('landing.nav.solutions')}</span>
              <h2 className="lp-section-title">{t('landing.solutions.title')}</h2>
              <p className="lp-section-subtitle">
                {t('landing.solutions.subtitle')}
              </p>
            </div>

            {/* Highlight 1 — Work Orders */}
            <div className="lp-highlight">
              <div className="lp-highlight-content lp-reveal lp-reveal-right">
                <span className="lp-section-tag">{t('nav.workOrders')}</span>
                <h3>{t('landing.solutions.h1.title')}</h3>
                <p>
                  {t('landing.solutions.h1.desc')}
                </p>
                <div className="lp-highlight-features">
                  <div className="lp-highlight-feature">
                    <div className="lp-highlight-feature-icon"><AimOutlined /></div>
                    <div className="lp-highlight-feature-text">
                      <h4>{t('landing.solutions.h1.f1.title')}</h4>
                      <p>{t('landing.solutions.h1.f1.desc')}</p>
                    </div>
                  </div>
                  <div className="lp-highlight-feature">
                    <div className="lp-highlight-feature-icon"><FileTextOutlined /></div>
                    <div className="lp-highlight-feature-text">
                      <h4>{t('landing.solutions.h1.f2.title')}</h4>
                      <p>{t('landing.solutions.h1.f2.desc')}</p>
                    </div>
                  </div>
                  <div className="lp-highlight-feature">
                    <div className="lp-highlight-feature-icon"><SyncOutlined /></div>
                    <div className="lp-highlight-feature-text">
                      <h4>{t('landing.solutions.h1.f3.title')}</h4>
                      <p>{t('landing.solutions.h1.f3.desc')}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lp-highlight-visual lp-reveal lp-reveal-left">
                <div className="lp-highlight-image">
                  <div className="lp-highlight-placeholder" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(6,182,212,0.06) 100%)' }}>
                    <div className="lp-mock-card-grid">
                      <div className="lp-mock-card">
                        <div className="lp-mock-card-header">
                          <span className="lp-mock-card-title">WO-1024</span>
                          <span className="lp-mock-badge lp-mock-badge-blue">{t('common.inProgress')}</span>
                        </div>
                        <div className="lp-mock-card-meta">{t('landing.mockup.hvacRepair')}</div>
                        <div className="lp-mock-progress"><div className="lp-mock-progress-bar" style={{ width: '70%' }} /></div>
                      </div>
                      <div className="lp-mock-card">
                        <div className="lp-mock-card-header">
                          <span className="lp-mock-card-title">WO-1025</span>
                          <span className="lp-mock-badge lp-mock-badge-green">{t('common.completed')}</span>
                        </div>
                        <div className="lp-mock-card-meta">{t('landing.mockup.electricalInspection')}</div>
                        <div className="lp-mock-progress"><div className="lp-mock-progress-bar" style={{ width: '100%', background: '#10b981' }} /></div>
                      </div>
                      <div className="lp-mock-card">
                        <div className="lp-mock-card-header">
                          <span className="lp-mock-card-title">WO-1026</span>
                          <span className="lp-mock-badge lp-mock-badge-amber">{t('common.scheduled')}</span>
                        </div>
                        <div className="lp-mock-card-meta">{t('landing.mockup.plumbingMaintenance')}</div>
                        <div className="lp-mock-progress"><div className="lp-mock-progress-bar" style={{ width: '30%', background: '#f59e0b' }} /></div>
                      </div>
                      <div className="lp-mock-card">
                        <div className="lp-mock-card-header">
                          <span className="lp-mock-card-title">WO-1027</span>
                          <span className="lp-mock-badge lp-mock-badge-red">{t('common.urgent')}</span>
                        </div>
                        <div className="lp-mock-card-meta">{t('landing.mockup.generatorFix')}</div>
                        <div className="lp-mock-progress"><div className="lp-mock-progress-bar" style={{ width: '10%', background: '#ef4444' }} /></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Highlight 2 — Scheduling */}
            <div className="lp-highlight reverse">
              <div className="lp-highlight-content lp-reveal lp-reveal-left">
                <span className="lp-section-tag">{t('nav.scheduling')}</span>
                <h3>{t('landing.solutions.h2.title')}</h3>
                <p>
                  {t('landing.solutions.h2.desc')}
                </p>
                <div className="lp-highlight-features">
                  <div className="lp-highlight-feature">
                    <div className="lp-highlight-feature-icon"><TeamOutlined /></div>
                    <div className="lp-highlight-feature-text">
                      <h4>{t('landing.solutions.h2.f1.title')}</h4>
                      <p>{t('landing.solutions.h2.f1.desc')}</p>
                    </div>
                  </div>
                  <div className="lp-highlight-feature">
                    <div className="lp-highlight-feature-icon"><GlobalOutlined /></div>
                    <div className="lp-highlight-feature-text">
                      <h4>{t('landing.solutions.h2.f2.title')}</h4>
                      <p>{t('landing.solutions.h2.f2.desc')}</p>
                    </div>
                  </div>
                  <div className="lp-highlight-feature">
                    <div className="lp-highlight-feature-icon"><BellOutlined /></div>
                    <div className="lp-highlight-feature-text">
                      <h4>{t('landing.solutions.h2.f3.title')}</h4>
                      <p>{t('landing.solutions.h2.f3.desc')}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lp-highlight-visual lp-reveal lp-reveal-right">
                <div className="lp-highlight-image">
                  <div className="lp-highlight-placeholder" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(16,185,129,0.06) 100%)' }}>
                    <div className="lp-mock-dispatch">
                      <div className="lp-mock-timeline">
                        {[
                          { name: 'Alex M.', color: '#2563eb', task: t('landing.mockup.hvacRepair'), time: '9:00 AM' },
                          { name: 'Sarah K.', color: '#10b981', task: t('landing.mockup.electricalInspection'), time: '10:30 AM' },
                          { name: 'James L.', color: '#f59e0b', task: t('landing.mockup.plumbingFix'), time: '11:00 AM' },
                          { name: 'Rita P.', color: '#8b5cf6', task: t('landing.mockup.generatorService'), time: '1:00 PM' },
                          { name: 'Dave C.', color: '#ef4444', task: t('landing.mockup.fireSafety'), time: '2:30 PM' },
                        ].map((item) => (
                          <div key={item.name} className="lp-mock-timeline-item">
                            <div className="lp-mock-avatar" style={{ background: item.color }}>{item.name.split(' ').map(n => n[0]).join('')}</div>
                            <div className="lp-mock-timeline-info">
                              <div className="lp-mock-timeline-name">{item.name}</div>
                              <div className="lp-mock-timeline-task">{item.task}</div>
                            </div>
                            <div className="lp-mock-timeline-time">{item.time}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Highlight 3 — Invoicing */}
            <div className="lp-highlight">
              <div className="lp-highlight-content lp-reveal lp-reveal-right">
                <span className="lp-section-tag">{t('nav.invoices')}</span>
                <h3>{t('landing.solutions.h3.title')}</h3>
                <p>
                  {t('landing.solutions.h3.desc')}
                </p>
                <div className="lp-highlight-features">
                  <div className="lp-highlight-feature">
                    <div className="lp-highlight-feature-icon"><DollarOutlined /></div>
                    <div className="lp-highlight-feature-text">
                      <h4>{t('landing.solutions.h3.f1.title')}</h4>
                      <p>{t('landing.solutions.h3.f1.desc')}</p>
                    </div>
                  </div>
                  <div className="lp-highlight-feature">
                    <div className="lp-highlight-feature-icon"><SafetyCertificateOutlined /></div>
                    <div className="lp-highlight-feature-text">
                      <h4>{t('landing.solutions.h3.f2.title')}</h4>
                      <p>{t('landing.solutions.h3.f2.desc')}</p>
                    </div>
                  </div>
                  <div className="lp-highlight-feature">
                    <div className="lp-highlight-feature-icon"><BarChartOutlined /></div>
                    <div className="lp-highlight-feature-text">
                      <h4>{t('landing.solutions.h3.f3.title')}</h4>
                      <p>{t('landing.solutions.h3.f3.desc')}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lp-highlight-visual lp-reveal lp-reveal-left">
                <div className="lp-highlight-image">
                  <div className="lp-highlight-placeholder" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(245,158,11,0.06) 100%)' }}>
                    <div className="lp-mock-invoice">
                      <div className="lp-mock-invoice-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>{t('landing.mockup.invoiceNum')}</span>
                          <span className="lp-mock-badge lp-mock-badge-green">{t('common.paid')}</span>
                        </div>
                        <div className="lp-mock-invoice-row">
                          <span className="lp-mock-invoice-label">{t('landing.mockup.hvacRepair')}</span>
                          <span className="lp-mock-invoice-value">$1,200.00</span>
                        </div>
                        <div className="lp-mock-invoice-row">
                          <span className="lp-mock-invoice-label">{t('landing.mockup.parts')}</span>
                          <span className="lp-mock-invoice-value">$850.00</span>
                        </div>
                        <div className="lp-mock-invoice-row">
                          <span className="lp-mock-invoice-label">{t('landing.mockup.labor')}</span>
                          <span className="lp-mock-invoice-value">$480.00</span>
                        </div>
                        <div className="lp-mock-invoice-row">
                          <span className="lp-mock-invoice-label">{t('landing.mockup.tax')}</span>
                          <span className="lp-mock-invoice-value">$202.40</span>
                        </div>
                        <div className="lp-mock-invoice-row" style={{ borderTop: '2px solid rgba(255,255,255,0.1)', paddingTop: 12, marginTop: 4 }}>
                          <span className="lp-mock-invoice-label" style={{ fontWeight: 700, color: '#e2e8f0' }}>{t('common.total')}</span>
                          <span className="lp-mock-invoice-value" style={{ fontSize: 18, color: '#10b981' }}>$2,732.40</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Highlight 4 — Mobile App */}
            <div className="lp-highlight reverse">
              <div className="lp-highlight-content lp-reveal lp-reveal-left">
                <span className="lp-section-tag">{t('landing.nav.mobileApp')}</span>
                <h3>{t('landing.solutions.h4.title')}</h3>
                <p>
                  {t('landing.solutions.h4.desc')}
                </p>
                <div className="lp-highlight-features">
                  <div className="lp-highlight-feature">
                    <div className="lp-highlight-feature-icon"><CloudOutlined /></div>
                    <div className="lp-highlight-feature-text">
                      <h4>{t('landing.solutions.h4.f1.title')}</h4>
                      <p>{t('landing.solutions.h4.f1.desc')}</p>
                    </div>
                  </div>
                  <div className="lp-highlight-feature">
                    <div className="lp-highlight-feature-icon"><ThunderboltOutlined /></div>
                    <div className="lp-highlight-feature-text">
                      <h4>{t('landing.solutions.h4.f2.title')}</h4>
                      <p>{t('landing.solutions.h4.f2.desc')}</p>
                    </div>
                  </div>
                  <div className="lp-highlight-feature">
                    <div className="lp-highlight-feature-icon"><CustomerServiceOutlined /></div>
                    <div className="lp-highlight-feature-text">
                      <h4>{t('landing.solutions.h4.f3.title')}</h4>
                      <p>{t('landing.solutions.h4.f3.desc')}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lp-highlight-visual lp-reveal lp-reveal-right" style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="lp-mock-mobile">
                  <div className="lp-mock-mobile-screen">
                    <div className="lp-mock-mobile-status">
                      <span>9:41</span>
                      <span>100%</span>
                    </div>
                    <div className="lp-mock-mobile-header">{t('landing.mockup.myJobsToday')}</div>
                    <div className="lp-mock-mobile-body">
                      {[
                        { title: t('landing.mockup.hvacRepair'), sub: 'Tower B, Floor 3 — 9:00 AM', badge: t('landing.mockup.inTransit'), color: 'rgba(59,130,246,0.2)' },
                        { title: t('landing.mockup.electricalCheck'), sub: 'Block C — 10:30 AM', badge: t('common.scheduled'), color: 'rgba(245,158,11,0.2)' },
                        { title: t('landing.mockup.plumbingFix'), sub: 'Unit 14 — 11:00 AM', badge: t('common.scheduled'), color: 'rgba(245,158,11,0.2)' },
                        { title: t('landing.mockup.generatorService'), sub: 'HQ — 1:00 PM', badge: t('common.scheduled'), color: 'rgba(245,158,11,0.2)' },
                      ].map((job) => (
                        <div key={job.title} className="lp-mock-mobile-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="lp-mock-mobile-card-title">{job.title}</span>
                            <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 100, background: job.color, fontWeight: 600 }}>{job.badge}</span>
                          </div>
                          <div className="lp-mock-mobile-card-sub">{job.sub}</div>
                        </div>
                      ))}
                    </div>
                    <div className="lp-mock-mobile-nav">
                      <div className="lp-mock-mobile-nav-item active" />
                      <div className="lp-mock-mobile-nav-item" />
                      <div className="lp-mock-mobile-nav-item" />
                      <div className="lp-mock-mobile-nav-item" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== Testimonials ========== */}
        <section id="testimonials" className="lp-section">
          <div className="lp-container">
            <div className="lp-section-header lp-reveal lp-reveal-up">
              <span className="lp-section-tag">{t('landing.nav.testimonials')}</span>
              <h2 className="lp-section-title">{t('landing.testimonials.title')}</h2>
              <p className="lp-section-subtitle">
                {t('landing.testimonials.subtitle')}
              </p>
            </div>

            <div className="lp-testimonials-grid">
              <div className="lp-testimonial lp-reveal lp-reveal-up lp-stagger-1">
                <div className="lp-testimonial-stars">
                  <StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled />
                </div>
                <p className="lp-testimonial-text">
                  &ldquo;{t('landing.testimonials.t1.text')}&rdquo;
                </p>
                <div className="lp-testimonial-author">
                  <div className="lp-testimonial-avatar" style={{ background: '#2563eb' }}>MR</div>
                  <div className="lp-testimonial-info">
                    <h4>{t('landing.testimonials.t1.author')}</h4>
                    <p>{t('landing.testimonials.t1.role')}</p>
                  </div>
                </div>
              </div>

              <div className="lp-testimonial lp-reveal lp-reveal-up lp-stagger-2">
                <div className="lp-testimonial-stars">
                  <StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled />
                </div>
                <p className="lp-testimonial-text">
                  &ldquo;{t('landing.testimonials.t2.text')}&rdquo;
                </p>
                <div className="lp-testimonial-author">
                  <div className="lp-testimonial-avatar" style={{ background: '#10b981' }}>SC</div>
                  <div className="lp-testimonial-info">
                    <h4>{t('landing.testimonials.t2.author')}</h4>
                    <p>{t('landing.testimonials.t2.role')}</p>
                  </div>
                </div>
              </div>

              <div className="lp-testimonial lp-reveal lp-reveal-up lp-stagger-3">
                <div className="lp-testimonial-stars">
                  <StarFilled /><StarFilled /><StarFilled /><StarFilled /><StarFilled />
                </div>
                <p className="lp-testimonial-text">
                  &ldquo;{t('landing.testimonials.t3.text')}&rdquo;
                </p>
                <div className="lp-testimonial-author">
                  <div className="lp-testimonial-avatar" style={{ background: '#f59e0b' }}>DK</div>
                  <div className="lp-testimonial-info">
                    <h4>{t('landing.testimonials.t3.author')}</h4>
                    <p>{t('landing.testimonials.t3.role')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== Integrations ========== */}
        <section id="integrations" className="lp-section lp-section-alt">
          <div className="lp-container">
            <div className="lp-section-header lp-reveal lp-reveal-up">
              <span className="lp-section-tag">{t('landing.integrations.tag')}</span>
              <h2 className="lp-section-title">{t('landing.integrations.title')}</h2>
              <p className="lp-section-subtitle">
                {t('landing.integrations.subtitle')}
              </p>
            </div>

            <div className="lp-integrations-grid">
              {[
                { name: 'QuickBooks', icon: <DollarOutlined />, bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
                { name: 'Stripe', icon: <SafetyCertificateOutlined />, bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
                { name: 'Google Maps', icon: <GlobalOutlined />, bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
                { name: 'Slack', icon: <CustomerServiceOutlined />, bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' },
                { name: 'REST API', icon: <ApiOutlined />, bg: 'rgba(99,102,241,0.15)', color: '#818cf8' },
                { name: 'Webhooks', icon: <ThunderboltOutlined />, bg: 'rgba(236,72,153,0.15)', color: '#f472b6' },
              ].map((integration, idx) => (
                <div key={integration.name} className={`lp-integration-card lp-reveal lp-reveal-scale lp-stagger-${idx + 1}`}>
                  <div className="lp-integration-icon" style={{ background: integration.bg, color: integration.color }}>
                    {integration.icon}
                  </div>
                  <h4>{integration.name}</h4>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== Pricing CTA ========== */}
        <section id="pricing" className="lp-pricing-section">
          {(() => {
            const basicPlan = plans?.find((p) => p.name.toLowerCase() === 'basic');
            const professionalPlan = plans?.find((p) => p.name.toLowerCase().includes('professional') || p.name.toLowerCase() === 'pro');
            const enterprisePlan = plans?.find((p) => p.name.toLowerCase() === 'enterprise');

            const basicPrice = basicPlan ? formatPlanPrice(basicPlan.price_monthly, basicPlan.currency || 'USD', currency) : getPlanPricing('basic', currency).formatted;
            const professionalPrice = professionalPlan ? formatPlanPrice(professionalPlan.price_monthly, professionalPlan.currency || 'USD', currency) : getPlanPricing('professional', currency).formatted;
            const enterprisePrice = enterprisePlan ? formatPlanPrice(enterprisePlan.price_monthly, enterprisePlan.currency || 'USD', currency) : getPlanPricing('enterprise', currency).formatted;

            const basicLimit = basicPlan?.max_appointments_monthly !== undefined ? (basicPlan.max_appointments_monthly ? `${basicPlan.max_appointments_monthly} appointments/mo` : 'Unlimited appointments') : '100 appointments/mo';
            const professionalLimit = professionalPlan?.max_appointments_monthly !== undefined ? (professionalPlan.max_appointments_monthly ? `${professionalPlan.max_appointments_monthly} appointments/mo` : 'Unlimited appointments') : '500 appointments/mo';
            const enterpriseLimit = enterprisePlan?.max_appointments_monthly !== undefined ? (enterprisePlan.max_appointments_monthly ? `${enterprisePlan.max_appointments_monthly} appointments/mo` : 'Unlimited appointments') : '2000 appointments/mo';

            const basicFeatures = basicPlan?.features || ['Up to 100 appointments/mo', 'Up to 200 users', 'Work Orders & Scheduling', 'Service Requests', 'Customer Portal', 'Basic Reports'];
            const professionalFeatures = professionalPlan?.features || ['Up to 500 appointments/mo', 'Up to 200 users', 'Everything in Basic', 'AI Scheduling & Dispatch', 'Invoices & Payments', 'Advanced Analytics', 'API Access'];
            const enterpriseFeatures = enterprisePlan?.features || ['Up to 2000 appointments/mo', 'Up to 200 users', 'Everything in Professional', 'Predictive Maintenance (IoT)', 'Computer Vision QA', 'Custom Integrations', 'Dedicated Support'];

            return (
              <div className="lp-container">
                <div className="lp-pricing-content lp-reveal lp-reveal-up">
                  <h2>Simple, Transparent Pricing</h2>
                  <p>Start with a <strong>15-day free trial</strong> on any plan. No credit card required.</p>
                </div>

                <div className="lp-pricing-cards" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  {/* Basic */}
                  <div className="lp-price-card lp-reveal lp-reveal-up lp-stagger-1">
                    <div className="lp-pricing-users-tag">{basicLimit}</div>
                    <h3>Basic</h3>
                    <div className="lp-price">{basicPrice}<span>/mo</span></div>
                    <p className="lp-price-desc">Perfect for small service teams getting started.</p>
                    <ul className="lp-price-features">
                      {basicFeatures.map((f: string) => (
                        <li key={f}><CheckCircleFilled className="lp-check" /> {formatFeatureName(f)}</li>
                      ))}
                    </ul>
                    <div className="lp-trial-badge">15-day free trial</div>
                    <button className="lp-btn lp-btn-outline" style={{ width: '100%', borderColor: 'rgba(255,255,255,0.3)', color: 'white' }} onClick={() => navigate('/register?plan=basic')}>
                      Get Started
                    </button>
                  </div>

                  {/* Professional */}
                  <div className="lp-price-card featured lp-reveal lp-reveal-up lp-stagger-2">
                    <div className="lp-pricing-users-tag" style={{ background: 'rgba(139,92,246,0.3)', color: '#c4b5fd' }}>{professionalLimit}</div>
                    <h3>Professional</h3>
                    <div className="lp-price">{professionalPrice}<span>/mo</span></div>
                    <p className="lp-price-desc">For growing teams that need AI-powered automation.</p>
                    <ul className="lp-price-features">
                      {professionalFeatures.map((f: string) => (
                        <li key={f}><CheckCircleFilled className="lp-check" /> {formatFeatureName(f)}</li>
                      ))}
                    </ul>
                    <div className="lp-trial-badge">15-day free trial</div>
                    <button className="lp-btn lp-btn-primary" style={{ width: '100%' }} onClick={() => navigate('/register?plan=professional')}>
                      Get Started
                    </button>
                  </div>

                  {/* Enterprise */}
                  <div className="lp-price-card lp-reveal lp-reveal-up lp-stagger-3">
                    <div className="lp-pricing-users-tag">{enterpriseLimit}</div>
                    <h3>Enterprise</h3>
                    <div className="lp-price">{enterprisePrice}<span>/mo</span></div>
                    <p className="lp-price-desc">Full-featured platform for large field service operations.</p>
                    <ul className="lp-price-features">
                      {enterpriseFeatures.map((f: string) => (
                        <li key={f}><CheckCircleFilled className="lp-check" /> {formatFeatureName(f)}</li>
                      ))}
                    </ul>
                    <div className="lp-trial-badge">15-day free trial</div>
                    <button className="lp-btn lp-btn-outline" style={{ width: '100%', borderColor: 'rgba(255,255,255,0.3)', color: 'white' }} onClick={() => navigate('/register?plan=enterprise')}>
                      Get Started
                    </button>
                  </div>

                  {/* Custom */}
                  <div className="lp-price-card lp-price-card-custom lp-reveal lp-reveal-up lp-stagger-4">
                    <div className="lp-pricing-users-tag" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>Custom limits</div>
                    <h3>Custom</h3>
                    <div className="lp-price" style={{ fontSize: 28 }}>Tailored</div>

                <p className="lp-price-desc">Enterprise-scale plans designed around your exact needs.</p>
                <ul className="lp-price-features">
                  <li><CheckCircleFilled className="lp-check" /> 200+ users available</li>
                  <li><CheckCircleFilled className="lp-check" /> Custom appointments limit</li>
                  <li><CheckCircleFilled className="lp-check" /> Custom SLA & contracts</li>
                  <li><CheckCircleFilled className="lp-check" /> On-premise options</li>
                  <li><CheckCircleFilled className="lp-check" /> White-label available</li>
                  <li><CheckCircleFilled className="lp-check" /> Priority onboarding</li>
                </ul>
                <div style={{ flex: 1 }} />
                <button className="lp-btn lp-btn-outline" style={{ width: '100%', borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', marginTop: 8 }} onClick={() => window.location.href = 'mailto:sales@fieldforce.com'}>
                  Contact Sales →
                </button>
              </div>
            </div>
          </div>
            );
          })()}
        </section>


        {/* ========== Footer ========== */}
        <footer className="lp-footer">
          <div className="lp-container">
            <div className="lp-footer-grid">
              <div className="lp-footer-brand">
                <h3>
                  <div className="lp-logo-icon" style={{ width: 32, height: 32, fontSize: 14, borderRadius: 8 }}>FF</div>
                  {t('app.name')}
                </h3>
                <p>
                  {t('landing.footer.desc')}
                </p>
                <div className="lp-footer-social">
                  <a href="#" className="lp-footer-social-link" aria-label="Twitter">
                    <GlobalOutlined />
                  </a>
                  <a href="#" className="lp-footer-social-link" aria-label="Team">
                    <TeamOutlined />
                  </a>
                  <a href="#" className="lp-footer-social-link" aria-label="GitHub">
                    <ApiOutlined />
                  </a>
                </div>
              </div>

              <div className="lp-footer-column">
                <h4>{t('landing.footer.product')}</h4>
                <ul className="lp-footer-links">
                  <li><a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>{t('landing.nav.features')}</a></li>
                  <li><a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }}>{t('landing.nav.pricing')}</a></li>
                  <li><a href="#integrations">{t('landing.integrations.tag')}</a></li>
                  <li><a href="#" onClick={(e) => e.preventDefault()}>{t('landing.footer.apiDocs')}</a></li>
                  <li><a href="#" onClick={(e) => e.preventDefault()}>{t('landing.footer.changelog')}</a></li>
                </ul>
              </div>

              <div className="lp-footer-column">
                <h4>{t('landing.nav.solutions')}</h4>
                <ul className="lp-footer-links">
                  <li><a href="#" onClick={(e) => e.preventDefault()}>HVAC</a></li>
                  <li><a href="#" onClick={(e) => e.preventDefault()}>Electrical</a></li>
                  <li><a href="#" onClick={(e) => e.preventDefault()}>Plumbing</a></li>
                  <li><a href="#" onClick={(e) => e.preventDefault()}>Cleaning</a></li>
                  <li><a href="#" onClick={(e) => e.preventDefault()}>Property Mgmt</a></li>
                </ul>
              </div>

              <div className="lp-footer-column">
                <h4>{t('landing.footer.company')}</h4>
                <ul className="lp-footer-links">
                  <li><a href="#" onClick={(e) => e.preventDefault()}>{t('landing.footer.aboutUs')}</a></li>
                  <li><a href="#" onClick={(e) => e.preventDefault()}>{t('landing.footer.careers')}</a></li>
                  <li><a href="#" onClick={(e) => e.preventDefault()}>{t('landing.footer.blog')}</a></li>
                  <li><a href="#" onClick={(e) => e.preventDefault()}>{t('landing.footer.contact')}</a></li>
                  <li><a href="#" onClick={(e) => e.preventDefault()}>{t('landing.footer.partners')}</a></li>
                </ul>
              </div>

              <div className="lp-footer-column">
                <h4>{t('landing.footer.support')}</h4>
                <ul className="lp-footer-links">
                  <li><a href="#" onClick={(e) => e.preventDefault()}>{t('landing.footer.helpCenter')}</a></li>
                  <li><a href="#" onClick={(e) => e.preventDefault()}>{t('landing.footer.documentation')}</a></li>
                  <li><a href="#" onClick={(e) => e.preventDefault()}>{t('landing.footer.community')}</a></li>
                  <li><a href="#" onClick={(e) => e.preventDefault()}>{t('landing.footer.statusPage')}</a></li>
                  <li><a href="#" onClick={(e) => e.preventDefault()}>{t('landing.footer.training')}</a></li>
                </ul>
              </div>
            </div>

            <div className="lp-footer-bottom">
              <span>&copy; {new Date().getFullYear()} {t('app.name')}. {t('landing.footer.allRightsReserved')}</span>
              <div className="lp-footer-bottom-links">
                <a href="#" onClick={(e) => e.preventDefault()}>{t('landing.footer.privacyPolicy')}</a>
                <a href="#" onClick={(e) => e.preventDefault()}>{t('landing.footer.termsOfService')}</a>
                <a href="#" onClick={(e) => e.preventDefault()}>{t('landing.footer.cookiePolicy')}</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ReactLenis>
  );
}
