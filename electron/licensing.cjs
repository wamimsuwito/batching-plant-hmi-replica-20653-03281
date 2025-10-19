const { machineIdSync } = require('node-machine-id');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Secret key for encryption (DO NOT SHARE THIS!)
const SECRET_KEY = 'LISA-HMI-SECRET-KEY-2025-FARIKA-INDONESIA-BATCHING-PLANT';
const ALGORITHM = 'aes-256-cbc';
const LICENSE_PREFIX = 'LISA';

/**
 * Get unique hardware ID for this machine
 */
function getHardwareId() {
  try {
    const machineId = machineIdSync({ original: true });
    return machineId.toUpperCase();
  } catch (error) {
    console.error('Error getting hardware ID:', error);
    return null;
  }
}

/**
 * Encrypt data using AES-256
 */
function encrypt(text) {
  const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt data using AES-256
 */
function decrypt(text) {
  try {
    const key = crypto.createHash('sha256').update(SECRET_KEY).digest();
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    return null;
  }
}

/**
 * Generate license key from hardware ID and expiry date
 * This function is used by the license generator tool
 */
function generateLicenseKey(hardwareId, expiryDate) {
  try {
    // Create payload: hardwareId|expiryDate
    const payload = `${hardwareId}|${expiryDate}`;
    
    // Encrypt payload
    const encrypted = encrypt(payload);
    
    // Create checksum
    const checksum = crypto.createHash('md5').update(payload + SECRET_KEY).digest('hex').substring(0, 8);
    
    // Format: encrypted + checksum
    const licenseData = encrypted + '|' + checksum;
    
    // Encode to base64 and format with dashes
    const base64 = Buffer.from(licenseData).toString('base64')
      .replace(/\+/g, '')
      .replace(/\//g, '')
      .replace(/=/g, '');
    
    // Format: LISA-XXXXX-XXXXX-XXXXX-XXXXX
    const formatted = base64.match(/.{1,5}/g).slice(0, 4).join('-');
    
    return `${LICENSE_PREFIX}-${formatted}`;
  } catch (error) {
    console.error('Error generating license key:', error);
    return null;
  }
}

/**
 * Validate license key
 */
function validateLicenseKey(licenseKey) {
  try {
    // Check prefix
    if (!licenseKey.startsWith(LICENSE_PREFIX + '-')) {
      return { valid: false, error: 'Invalid license key format' };
    }

    // Remove prefix and dashes
    const base64Part = licenseKey.substring(LICENSE_PREFIX.length + 1).replace(/-/g, '');
    
    // Decode from base64
    const licenseData = Buffer.from(base64Part, 'base64').toString('utf8');
    const parts = licenseData.split('|');
    
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid license key structure' };
    }

    const encrypted = parts[0] + ':' + parts[1];
    const checksum = parts[2];
    
    // Decrypt payload
    const decrypted = decrypt(encrypted);
    if (!decrypted) {
      return { valid: false, error: 'Invalid license key' };
    }

    const [licenseHardwareId, expiryDateStr] = decrypted.split('|');
    
    // Verify checksum
    const expectedChecksum = crypto.createHash('md5')
      .update(decrypted + SECRET_KEY)
      .digest('hex')
      .substring(0, 8);
    
    if (checksum !== expectedChecksum) {
      return { valid: false, error: 'License key tampered or corrupted' };
    }

    // Get current hardware ID
    const currentHardwareId = getHardwareId();
    if (!currentHardwareId) {
      return { valid: false, error: 'Cannot read hardware ID' };
    }

    // Verify hardware ID
    if (licenseHardwareId !== currentHardwareId) {
      return { valid: false, error: 'License key not valid for this computer' };
    }

    // Check expiration
    const expiryDate = new Date(expiryDateStr);
    const now = new Date();
    
    if (now > expiryDate) {
      return { 
        valid: false, 
        error: 'License expired', 
        expired: true,
        expiryDate: expiryDateStr 
      };
    }

    return { 
      valid: true, 
      hardwareId: licenseHardwareId,
      expiryDate: expiryDateStr 
    };
  } catch (error) {
    console.error('Error validating license:', error);
    return { valid: false, error: 'Invalid license key format' };
  }
}

/**
 * Get license file path
 */
function getLicenseFilePath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'license.dat');
}

/**
 * Save license to file
 */
function saveLicense(licenseKey) {
  try {
    const validation = validateLicenseKey(licenseKey);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const licenseFilePath = getLicenseFilePath();
    const encryptedLicense = encrypt(licenseKey);
    
    fs.writeFileSync(licenseFilePath, encryptedLicense, 'utf8');
    
    return { success: true, expiryDate: validation.expiryDate };
  } catch (error) {
    console.error('Error saving license:', error);
    return { success: false, error: 'Failed to save license' };
  }
}

/**
 * Load license from file
 */
function loadLicense() {
  try {
    const licenseFilePath = getLicenseFilePath();
    
    if (!fs.existsSync(licenseFilePath)) {
      return { valid: false, error: 'No license file found' };
    }

    const encryptedLicense = fs.readFileSync(licenseFilePath, 'utf8');
    const licenseKey = decrypt(encryptedLicense);
    
    if (!licenseKey) {
      return { valid: false, error: 'License file corrupted' };
    }

    const validation = validateLicenseKey(licenseKey);
    return validation;
  } catch (error) {
    console.error('Error loading license:', error);
    return { valid: false, error: 'Failed to load license' };
  }
}

/**
 * Check if license is valid and not expired
 */
function checkLicense() {
  return loadLicense();
}

/**
 * Delete license file (for testing)
 */
function deleteLicense() {
  try {
    const licenseFilePath = getLicenseFilePath();
    if (fs.existsSync(licenseFilePath)) {
      fs.unlinkSync(licenseFilePath);
      return { success: true };
    }
    return { success: true, message: 'No license file to delete' };
  } catch (error) {
    console.error('Error deleting license:', error);
    return { success: false, error: 'Failed to delete license' };
  }
}

module.exports = {
  getHardwareId,
  generateLicenseKey,
  validateLicenseKey,
  saveLicense,
  loadLicense,
  checkLicense,
  deleteLicense
};
