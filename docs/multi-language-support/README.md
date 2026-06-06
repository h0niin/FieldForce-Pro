# Multi-Language Support (hanin)

FieldForce Pro now supports multiple languages across the entire platform, including the public landing page and all internal dashboards/settings. Supported languages include **English**, **Arabic (العربية)**, **Malayalam (മലയാളം)**, and **Hindi (हिन्दी)**.

---

## How to Test

**Landing Page:**
1. Visit the landing page (`/landing` or root).
2. Use the **Language Switcher** in the top navbar (represented by a Globe icon).
3. Select **Arabic**. The text will translate, and the layout will automatically switch to **Right-to-Left (RTL)** mode.
4. Select **Malayalam** or **Hindi**. The text will update to the respective scripts while maintaining the Left-to-Right (LTR) layout.

**Internal Application:**
1. Log in to the application.
2. The **Language Switcher** is also available in the main header next to the dark mode toggle.
3. Switching languages here will instantly translate the sidebar, dashboard widgets, table headers, form labels, and notifications.
4. Language preference is persisted in `localStorage`, so it remains active across sessions.

---

## Files Changed

### Core Infrastructure

#### 1. `web/src/i18n.ts` (New File)
- **Feature**: Configures `i18next` with `react-i18next`.
- **Backend**: Uses `i18next-http-backend` to load translation files from `/public/locales/{{lng}}/{{ns}}.json`.
- **Detection**: Uses `i18next-browser-languagedetector` to remember user preference.

#### 2. `web/src/main.tsx`
- **Integration**: Initializes the `i18n` instance before rendering the React app.

#### 3. `web/src/App.tsx`
- **RTL Support**: Dynamically sets `document.dir` to `rtl` when Arabic is selected.
- **Ant Design Integration**: Wraps the app in Ant Design's `ConfigProvider` with the appropriate `locale` (enUS, arEG, etc.) and `direction`.

### UI Components

#### 4. `web/src/components/layout/Header.tsx`
- **Language Switcher**: Added a dropdown menu using the `GlobalOutlined` icon.
- **Logic**: Calls `i18n.changeLanguage(key)` and updates local storage.

#### 5. `web/src/pages/landing/LandingPage.tsx`
- **Extraction**: Every hardcoded string (100+) was replaced with `t('landing.xxx')` calls.
- **Navbar Integration**: Integrated the language switcher directly into the marketing navbar.
- **RTL Styles**: Optimized CSS to handle layout flipping seamlessly.

### Translation Catalogs

#### 6. `web/public/locales/`
- **Structure**: Organized into language folders (`en`, `ar`, `ml`, `hi`).
- **Files**: `common.json` contains the primary translation keys for the entire app.
- **Scope**: Over 1,500 keys were extracted and translated for each language.

---

## Developer Guide: Adding New Translations

To maintain internationalization as you add new features, follow these steps:

### 1. Wrap Strings in `t()`
Instead of hardcoding text, use the `useTranslation` hook:
```tsx
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
// ...
<h1>{t('workOrders.title')}</h1>
```

### 2. Update the English Catalog
Add the new key to `web/public/locales/en/common.json`:
```json
{
  "workOrders": {
    "title": "Work Orders"
  }
}
```

### 3. Sync Other Locales
Run a sync script or manually add the keys to `ar`, `ml`, and `hi` JSON files. If a translation is not yet available, use the English value as a fallback.

