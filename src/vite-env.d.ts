/// <reference types="vite/client" />

interface Window {
  env?: {
    isElectron: boolean;
  };
  licensing?: {
    getHardwareId: () => Promise<string>;
    validateLicense: (licenseKey: string) => Promise<any>;
    saveLicense: (licenseKey: string) => Promise<any>;
    checkLicense: () => Promise<any>;
  };
}
