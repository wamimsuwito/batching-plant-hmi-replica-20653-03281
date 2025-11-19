/**
 * Storage Versioning Utility
 * Mengelola versi localStorage untuk mencegah konflik settings lama
 * saat instalasi Electron baru
 */

const CURRENT_VERSION = '2.0.0'; // Update setiap ada breaking changes
const VERSION_KEY = 'app_storage_version';

export const checkAndClearOldStorage = () => {
  const savedVersion = localStorage.getItem(VERSION_KEY);
  
  if (savedVersion !== CURRENT_VERSION) {
    console.warn(`🔄 Storage version mismatch: ${savedVersion || 'none'} -> ${CURRENT_VERSION}`);
    console.log('🗑️ Clearing old settings to prevent conflicts...');
    
    // Backup settings yang penting (optional)
    const backupKeys = ['bp_naming_settings', 'mixing_sequence_settings'];
    const backup: Record<string, string> = {};
    
    backupKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          // Validate JSON sebelum backup
          JSON.parse(value);
          backup[key] = value;
        } catch (e) {
          console.warn(`⚠️ Skipping invalid backup for ${key}`);
        }
      }
    });
    
    // Clear all localStorage
    localStorage.clear();
    
    // Restore backup jika kompatibel
    if (Object.keys(backup).length > 0) {
      console.log('♻️ Restoring compatible settings:', Object.keys(backup));
      Object.entries(backup).forEach(([key, value]) => {
        localStorage.setItem(key, value);
      });
    }
    
    console.log('✅ Storage cleared. Fresh start with version:', CURRENT_VERSION);
    
    // Set new version
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    
    return true; // Indicates storage was cleared
  } else {
    console.log(`✅ Storage version OK: ${CURRENT_VERSION}`);
    return false; // No clearing needed
  }
};

/**
 * Force clear all localStorage (untuk manual reset button)
 */
export const forceResetStorage = () => {
  console.warn('🗑️ FORCE RESET: Clearing ALL localStorage');
  localStorage.clear();
  localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
  console.log('✅ Storage reset complete');
};
