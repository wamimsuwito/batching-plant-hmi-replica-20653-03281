import { useState, useEffect } from 'react';

export interface DeveloperSettings {
  developerName: string;
  supportEmail: string;
  supportPhone: string;
  appVersion: string;
}

export interface CompanySettings {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  logo: string;
  developer: DeveloperSettings;
}

const DEFAULT_DEVELOPER: DeveloperSettings = {
  developerName: "Technical Support",
  supportEmail: "support@example.com",
  supportPhone: "000000000000",
  appVersion: "1.0.0"
};

const DEFAULT_SETTINGS: CompanySettings = {
  name: "NAMA PERUSAHAAN",
  tagline: "READYMIX & PRECAST CONCRETE",
  address: "Alamat Perusahaan",
  phone: "Telepon Perusahaan",
  logo: "/src/assets/default-company-logo.png",
  developer: DEFAULT_DEVELOPER
};

const STORAGE_KEY = 'company-settings';

export function useCompanySettings() {
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure developer settings exist (migration for old data)
        if (!parsed.developer) {
          parsed.developer = DEFAULT_DEVELOPER;
        }
        return parsed;
      } catch (e) {
        console.error('Failed to parse company settings:', e);
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companySettings));
  }, [companySettings]);

  const updateSettings = (newSettings: Partial<CompanySettings>) => {
    setCompanySettings(prev => ({ ...prev, ...newSettings }));
  };

  const updateDeveloperSettings = (newDeveloperSettings: Partial<DeveloperSettings>) => {
    setCompanySettings(prev => ({
      ...prev,
      developer: { ...prev.developer, ...newDeveloperSettings }
    }));
  };

  const resetToDefault = () => {
    setCompanySettings(DEFAULT_SETTINGS);
  };

  return {
    companySettings,
    updateSettings,
    updateDeveloperSettings,
    resetToDefault,
    DEFAULT_SETTINGS,
    DEFAULT_DEVELOPER
  };
}
