import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, KeyRound, User, Lock, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldAlert, History, RefreshCw } from 'lucide-react';
import { authService } from '../services/authService';
import { AuthUser, LoginAttemptRecord } from '../types';

interface AccountSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  onUserUpdated: (user: AuthUser) => void;
}

export const AccountSecurityModal: React.FC<AccountSecurityModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'credentials' | 'audit'>('credentials');
  
  // Form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState(currentUser.username);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Audit attempts
  const [attempts, setAttempts] = useState<LoginAttemptRecord[]>([]);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewUsername(currentUser.username);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg(null);
      setSuccessMsg(null);
      setAttempts(authService.getLoginAttempts());
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  // Calculate password strength
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Kosong', color: 'bg-outline-variant/30' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 1, label: 'Lemah', color: 'bg-error' };
    if (score === 2) return { score: 2, label: 'Sedang', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: 'Kuat', color: 'bg-primary' };
    return { score: 4, label: 'Sangat Kuat', color: 'bg-emerald-400' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!currentPassword) {
      setErrorMsg('Masukkan password saat ini untuk memverifikasi identitas Anda.');
      return;
    }

    if (!newUsername.trim()) {
      setErrorMsg('Username baru tidak boleh kosong.');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        setErrorMsg('Password baru minimal 8 karakter demi standar keamanan.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('Konfirmasi password baru tidak cocok.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const result = await authService.updateCredentials(
        currentPassword,
        newUsername,
        newPassword || currentPassword
      );

      if (result.success && result.updatedUser) {
        setSuccessMsg('Kredensial akun berhasil diperbarui dan di-hash ulang menggunakan Bcrypt.');
        onUserUpdated(result.updatedUser);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMsg(result.error || 'Gagal memperbarui kredensial.');
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan pada sistem keamanan.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAudit = () => {
    setAttempts(authService.getLoginAttempts());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-surface-container-low/95 backdrop-blur-2xl border border-primary/25 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.7)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-outline-variant/15 flex items-center justify-between bg-surface-container-low/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">Pusat Keamanan & Kredensial</h2>
              <p className="text-xs text-on-surface-variant">Kelola akun, ubah kata sandi, dan pantau log audit login</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-outline-variant/10">
          <button
            onClick={() => setActiveTab('credentials')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'credentials'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Ubah Kredensial</span>
          </button>
          <button
            onClick={() => { setActiveTab('audit'); refreshAudit(); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'audit'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Log Percobaan Login</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: CREDENTIALS */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleUpdate} className="space-y-5">
              
              {/* Security info card */}
              <div className="p-4 rounded-2xl bg-surface-container/40 border border-outline-variant/20 flex items-start gap-3 text-xs text-on-surface-variant">
                <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <strong className="text-on-surface block mb-0.5">Enkripsi Kata Sandi Bcrypt dengan Garam Acak (Salt)</strong>
                  Semua password di-hash secara satu arah (*one-way salted hash*) menggunakan algoritma Bcrypt 10 putaran, melindungi kredensial dari kebocoran maupun serangan tabel pelangi (*rainbow tables*).
                </div>
              </div>

              {/* Status messages */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-error-container/20 border border-error/30 flex items-center gap-2 text-xs text-error">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Current Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono font-medium text-on-surface-variant uppercase tracking-wider">
                  Password Saat Ini (Wajib untuk Verifikasi) <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan kata sandi aktif Anda saat ini"
                    required
                    className="w-full pl-4 pr-11 py-2.5 bg-surface-container-highest/30 border border-outline-variant/30 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="border-t border-outline-variant/10 pt-4 space-y-4">
                {/* Username Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-medium text-on-surface-variant uppercase tracking-wider">
                    Username Baru
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Username baru"
                      required
                      className="w-full pl-4 pr-4 py-2.5 bg-surface-container-highest/30 border border-outline-variant/30 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                    />
                  </div>
                  <span className="text-[11px] text-on-surface-variant/70">Minimal 4 karakter alfanumerik.</span>
                </div>

                {/* New Password Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono font-medium text-on-surface-variant uppercase tracking-wider">
                    Password Baru (Kosongkan jika tidak ingin diubah)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      className="w-full pl-4 pr-11 py-2.5 bg-surface-container-highest/30 border border-outline-variant/30 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password strength meter */}
                  {newPassword && (
                    <div className="pt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-on-surface-variant">Kekuatan Kata Sandi:</span>
                        <span className="font-bold text-on-surface">{strength.label}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-surface-container-highest/40 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${strength.score >= 1 ? strength.color : 'opacity-0'}`}></div>
                        <div className={`h-full rounded-full transition-all ${strength.score >= 2 ? strength.color : 'opacity-0'}`}></div>
                        <div className={`h-full rounded-full transition-all ${strength.score >= 3 ? strength.color : 'opacity-0'}`}></div>
                        <div className={`h-full rounded-full transition-all ${strength.score >= 4 ? strength.color : 'opacity-0'}`}></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                {newPassword && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-mono font-medium text-on-surface-variant uppercase tracking-wider">
                      Konfirmasi Password Baru
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang kata sandi baru"
                      className="w-full pl-4 pr-4 py-2.5 bg-surface-container-highest/30 border border-outline-variant/30 rounded-xl text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Submit Action */}
              <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 transition-colors text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)] disabled:opacity-50"
                >
                  {isLoading ? 'Menyimpan & Meng-hash...' : 'Simpan Perubahan'}
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Riwayat Percobaan Login (Anti-Brute Force Audit)</h3>
                  <p className="text-xs text-on-surface-variant">Mencatat percobaan login untuk mendeteksi anomali dan serangan otomatis</p>
                </div>
                <button
                  onClick={refreshAudit}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container/50 border border-outline-variant/20 text-xs text-on-surface hover:bg-surface-variant transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="border border-outline-variant/20 rounded-2xl overflow-hidden bg-surface-container-lowest/50">
                {attempts.length === 0 ? (
                  <div className="p-8 text-center text-on-surface-variant text-xs font-mono">
                    Belum ada riwayat percobaan login yang tercatat.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-surface-container/60 border-b border-outline-variant/15 text-on-surface-variant font-mono">
                          <th className="p-3">Waktu</th>
                          <th className="p-3">Username Dicoba</th>
                          <th className="p-3">Alamat IP</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                        {attempts.map((attempt) => (
                          <tr key={attempt.id} className="hover:bg-surface-variant/20 transition-colors">
                            <td className="p-3 font-mono text-[11px] text-on-surface-variant whitespace-nowrap">
                              {attempt.dateFormatted}
                            </td>
                            <td className="p-3 font-medium">
                              {attempt.usernameAttempted}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-on-surface-variant">
                              {attempt.ipAddress}
                            </td>
                            <td className="p-3 text-center">
                              {attempt.status === 'SUCCESS' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px] font-bold">
                                  BERHASIL
                                </span>
                              )}
                              {attempt.status === 'FAILED' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[10px] font-bold">
                                  GAGAL
                                </span>
                              )}
                              {attempt.status === 'LOCKED' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error/10 text-error border border-error/20 font-mono text-[10px] font-bold">
                                  TERKUNCI
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {resetFeedback && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
                  <span>{resetFeedback}</span>
                  <button onClick={() => setResetFeedback(null)} className="text-emerald-400 hover:text-emerald-300 font-bold">×</button>
                </div>
              )}

              <div className="p-3 bg-surface-container/30 border border-outline-variant/15 rounded-xl text-[11px] text-on-surface-variant flex items-center justify-between">
                <span>Aturan Rate Limiting: <strong>Maks 5x percobaan gagal</strong> beruntun memicu kunci akun selama <strong>15 menit</strong>.</span>
                <button
                  type="button"
                  onClick={() => {
                    authService.resetLockout();
                    setResetFeedback('Counter gagal & status lockout berhasil di-reset.');
                    setTimeout(() => setResetFeedback(null), 4000);
                  }}
                  className="text-primary hover:underline font-mono text-[10px] cursor-pointer"
                >
                  Reset Lockout Counter (Testing)
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
