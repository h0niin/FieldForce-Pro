import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark';
export type CurrencyType = 'USD' | 'INR' | 'AED' | 'SAR' | 'QAR' | 'KWD' | 'OMR' | 'BHD' | 'EUR';

interface UiState {
  sidebarCollapsed: boolean;
  theme: ThemeMode;
  locale: string;
  currency: CurrencyType;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  setLocale: (locale: string) => void;
  setCurrency: (currency: CurrencyType) => void;
  chatbotEnabled: boolean;
  setChatbotEnabled: (enabled: boolean) => void;
}

const detectDefaultCurrency = (): CurrencyType => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!tz) return 'USD';
  if (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('India')) return 'INR';
  if (tz.includes('Dublin') || tz.includes('Ireland')) return 'EUR';
  if (tz.includes('Dubai')) return 'AED';
  if (tz.includes('Riyadh')) return 'SAR';
  if (tz.includes('Qatar') || tz.includes('Doha')) return 'QAR';
  if (tz.includes('Kuwait')) return 'KWD';
  if (tz.includes('Muscat')) return 'OMR';
  if (tz.includes('Bahrain')) return 'BHD';
  return 'USD';
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'light',
      locale: 'en',
      currency: detectDefaultCurrency(),

      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setTheme: (theme) => set({ theme }),
      setLocale: (locale) => set({ locale }),
      setCurrency: (currency) => set({ currency }),
      chatbotEnabled: true,
      setChatbotEnabled: (enabled) => set({ chatbotEnabled: enabled }),
    }),
    {
      name: 'ui-storage',
    },
  ),
);
