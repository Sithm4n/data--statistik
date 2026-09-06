import bcrypt from 'bcryptjs';
import { AuthUser, LoginAttemptRecord, SecurityStatus } from '../types';

const STORAGE_KEY_USER = 'sis_auth_user_v1';
const STORAGE_KEY_SESSION = 'sis_auth_session_v1';
const STORAGE_KEY_ATTEMPTS = 'sis_auth_attempts_v1';
const STORAGE_KEY_LOCKOUT = 'sis_auth_lockout_v1';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 menit
const FAILED_LOGIN_DELAY_MS = 1400; // Time-delay mitigation (1.4 detik)

interface StoredCredentials {
  username: string;
  passwordHash: string;
  fullName: string;
  role: string;
  updatedAt: string;
}

interface LockoutState {
  consecutiveFailures: number;
  lockoutUntil: number; // timestamp
}

// Initial seed: username: 'adminstatistik', password: '12345678'
function getOrInitCredentials(): StoredCredentials {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to read credentials from localStorage', err);
  }

  // Generate bcrypt salt & hash for default password
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync('12345678', salt);

  const initialUser: StoredCredentials = {
    username: 'adminstatistik',
    passwordHash: hash,
    fullName: 'Administrator Statistik',
    role: 'Super Admin',
    updatedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(initialUser));
  } catch (err) {
    console.error('Failed to save default credentials', err);
  }

  return initialUser;
}

function getLockoutState(): LockoutState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LOCKOUT);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('Failed to read lockout state', err);
  }
  return { consecutiveFailures: 0, lockoutUntil: 0 };
}

function saveLockoutState(state: LockoutState): void {
  try {
    localStorage.setItem(STORAGE_KEY_LOCKOUT, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save lockout state', err);
  }
}

function logAttempt(username: string, status: 'SUCCESS' | 'FAILED' | 'LOCKED'): void {
  try {
    const attemptsStr = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
    const list: LoginAttemptRecord[] = attemptsStr ? JSON.parse(attemptsStr) : [];
    
    const newRecord: LoginAttemptRecord = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      dateFormatted: new Date().toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'medium'
      }),
      ipAddress: '127.0.0.1 (Client/Local)',
      usernameAttempted: username || '(kosong)',
      status,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 40) : 'Web'
    };

    // Keep last 40 attempts
    const updated = [newRecord, ...list].slice(0, 40);
    localStorage.setItem(STORAGE_KEY_ATTEMPTS, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to log login attempt', err);
  }
}

// Time-delay mitigation helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  /**
   * Cek status apakah akun/IP sedang terkunci
   */
  getSecurityStatus(): SecurityStatus {
    const lockout = getLockoutState();
    const now = Date.now();
    const isLocked = lockout.lockoutUntil > now;
    const lockoutRemainingSeconds = isLocked ? Math.ceil((lockout.lockoutUntil - now) / 1000) : 0;

    // Jika waktu lockout sudah habis, reset counter kegagalan
    if (!isLocked && lockout.lockoutUntil > 0) {
      saveLockoutState({ consecutiveFailures: 0, lockoutUntil: 0 });
    }

    return {
      isLocked,
      lockoutRemainingSeconds,
      consecutiveFailures: isLocked ? MAX_FAILED_ATTEMPTS : lockout.consecutiveFailures,
      maxAttempts: MAX_FAILED_ATTEMPTS,
      lockoutMinutes: 15
    };
  },

  /**
   * Proses otentikasi login dengan proteksi:
   * 1. Account Lockout & Rate Limiting (5x gagal -> 15 menit)
   * 2. Time-Delay Mitigation (1.4 detik delay pada kegagalan)
   * 3. Password Hashing (Bcrypt comparison)
   * 4. Generic Error Response ("Username atau Password salah")
   */
  async login(usernameInput: string, passwordInput: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
    const status = this.getSecurityStatus();

    // 1. Account Lockout check
    if (status.isLocked) {
      const minutes = Math.floor(status.lockoutRemainingSeconds / 60);
      const seconds = status.lockoutRemainingSeconds % 60;
      logAttempt(usernameInput, 'LOCKED');
      return {
        success: false,
        error: `Akun terkunci sementara karena terdeteksi ${MAX_FAILED_ATTEMPTS}x percobaan gagal. Silakan tunggu ${minutes}m ${seconds}s sebelum mencoba kembali.`
      };
    }

    // Input sanitization & normalization
    const cleanUsername = (usernameInput || '').trim();
    const cleanPassword = passwordInput || '';

    const creds = getOrInitCredentials();
    const lockout = getLockoutState();

    // Cek apakah username cocok (case-insensitive)
    const isUserMatch = cleanUsername.toLowerCase() === creds.username.toLowerCase();
    
    // Verifikasi hash Bcrypt
    let isPasswordMatch = false;
    if (isUserMatch) {
      try {
        isPasswordMatch = bcrypt.compareSync(cleanPassword, creds.passwordHash);
      } catch (err) {
        console.error('Bcrypt comparison error', err);
      }
    }

    // Login Berhasil
    if (isUserMatch && isPasswordMatch) {
      // Reset lockout counter
      saveLockoutState({ consecutiveFailures: 0, lockoutUntil: 0 });
      logAttempt(cleanUsername, 'SUCCESS');

      const userSession: AuthUser = {
        username: creds.username,
        fullName: creds.fullName,
        role: creds.role,
        lastLogin: new Date().toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short'
        })
      };

      try {
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(userSession));
      } catch (err) {
        console.error('Failed to persist session', err);
      }

      return { success: true, user: userSession };
    }

    // Login Gagal -> Implementasi Parameter Keamanan:
    // 1. Time-Delay Mitigation (Jeda waktu 1.4 detik untuk memperlambat serangan bot brute force)
    await sleep(FAILED_LOGIN_DELAY_MS);

    // 2. Increment failed counter
    const newFailures = lockout.consecutiveFailures + 1;
    let newLockoutUntil = 0;

    if (newFailures >= MAX_FAILED_ATTEMPTS) {
      newLockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      logAttempt(cleanUsername, 'LOCKED');
      saveLockoutState({ consecutiveFailures: newFailures, lockoutUntil: newLockoutUntil });
      return {
        success: false,
        error: `Batas percobaan tercapai (5 kali berturut-turut). Akun dikunci sementara selama 15 menit demi keamanan.`
      };
    }

    saveLockoutState({ consecutiveFailures: newFailures, lockoutUntil: 0 });
    logAttempt(cleanUsername, 'FAILED');

    // 3. Generic Error Response: Wajib pesan seragam agar tidak membocorkan apakah username ada atau tidak
    return {
      success: false,
      error: 'Username atau Password salah'
    };
  },

  /**
   * Mengubah username dan password
   */
  async updateCredentials(
    currentPasswordInput: string,
    newUsernameInput: string,
    newPasswordInput: string
  ): Promise<{ success: boolean; error?: string; updatedUser?: AuthUser }> {
    const creds = getOrInitCredentials();

    // Verifikasi password saat ini menggunakan Bcrypt
    const isCurrentValid = bcrypt.compareSync(currentPasswordInput, creds.passwordHash);
    if (!isCurrentValid) {
      await sleep(1000); // Time delay mitigation
      return {
        success: false,
        error: 'Password saat ini tidak valid.'
      };
    }

    const cleanNewUsername = newUsernameInput.trim();
    if (!cleanNewUsername || cleanNewUsername.length < 4) {
      return {
        success: false,
        error: 'Username baru minimal terdiri dari 4 karakter.'
      };
    }

    if (!newPasswordInput || newPasswordInput.length < 8) {
      return {
        success: false,
        error: 'Password baru minimal harus 8 karakter demi keamanan.'
      };
    }

    // Hash password baru dengan Bcrypt (10 salt rounds)
    const newSalt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPasswordInput, newSalt);

    const updatedCreds: StoredCredentials = {
      ...creds,
      username: cleanNewUsername,
      passwordHash: newHash,
      updatedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedCreds));
      
      // Update active session
      const currentSessionStr = localStorage.getItem(STORAGE_KEY_SESSION);
      let session: AuthUser = currentSessionStr ? JSON.parse(currentSessionStr) : {
        username: cleanNewUsername,
        fullName: creds.fullName,
        role: creds.role
      };
      session.username = cleanNewUsername;
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));

      return { success: true, updatedUser: session };
    } catch (err) {
      return { success: false, error: 'Gagal memperbarui kredensial di penyimpanan lokal.' };
    }
  },

  /**
   * Cek sesi yang sedang aktif
   */
  getCurrentUser(): AuthUser | null {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSION);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Failed to read session', err);
    }
    return null;
  },

  /**
   * Logout
   */
  logout(): void {
    try {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    } catch (err) {
      console.error('Failed to remove session', err);
    }
  },

  /**
   * Mengambil riwayat percobaan login (Audit Log)
   */
  getLoginAttempts(): LoginAttemptRecord[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ATTEMPTS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Failed to read login attempts', err);
    }
    return [];
  },

  /**
   * Reset percobaan / lockout (untuk admin testing)
   */
  resetLockout(): void {
    saveLockoutState({ consecutiveFailures: 0, lockoutUntil: 0 });
  }
};
