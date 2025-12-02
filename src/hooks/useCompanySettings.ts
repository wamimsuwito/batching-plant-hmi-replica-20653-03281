import { useState, useEffect } from 'react';

export interface CompanySettings {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  logo: string;
}

const DEFAULT_SETTINGS: CompanySettings = {
  name: "NAMA PERUSAHAAN",
  tagline: "READYMIX & PRECAST CONCRETE",
  address: "Alamat Perusahaan",
  phone: "Telepon Perusahaan",
  logo: "/src/assets/default-company-logo.png"
};

const STORAGE_KEY = 'company-settings';

export function useCompanySettings() {
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
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

  const resetToDefault = () => {
    setCompanySettings(DEFAULT_SETTINGS);
  };

  return {
    companySettings,
    updateSettings,
    resetToDefault,
    DEFAULT_SETTINGS
  };
}
