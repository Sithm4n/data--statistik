import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, User, Eye, EyeOff, AlertTriangle, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';
import { AuthUser, SecurityStatus } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>(authService.getSecurityStatus());
  const [countdown, setCountdown] = useState<number>(0);

  // Update security status periodically and manage lockout countdown
  useEffect(() => {
    const checkStatus = () => {
      const status = authService.getSecurityStatus();
      setSecurityStatus(status);
      setCountdown(status.lockoutRemainingSeconds);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (securityStatus.isLocked) {
      setErrorMsg('Akun sedang terkunci sementara. Silakan tunggu hingga masa tunggu berakhir.');
      return;
    }

    if (!username.trim() || !password) {
      setErrorMsg('Harap isi username dan password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.login(username, password);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMsg(result.error || 'Username atau Password salah');
        // Refresh security status
        setSecurityStatus(authService.getSecurityStatus());
      }
    } catch (err) {
      setErrorMsg('Terjadi kesalahan pada sistem otentikasi.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col justify-center items-center px-4 py-12 selection:bg-cyan-500/30 selection:text-cyan-200 bg-[#060911] relative overflow-hidden font-sans">
      {/* Background Radial & Grid Highlights */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 20%, rgba(56, 189, 248, 0.12) 0%, transparent 55%),
            radial-gradient(circle at 80% 70%, rgba(14, 165, 233, 0.08) 0%, transparent 40%),
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 48px 48px, 48px 48px'
        }}
      />

      <main className="w-full max-w-lg flex flex-col items-center relative z-10">
        
        {/* Glassmorphism Glow Card */}
        <div className="w-full backdrop-blur-2xl bg-slate-900/75 border border-slate-800/80 rounded-3xl p-8 sm:p-11 shadow-2xl shadow-black/80 flex flex-col items-center relative before:content-[''] before:absolute before:top-0 before:left-[10%] before:right-[10%] before:h-[1.5px] before:bg-gradient-to-r before:from-transparent before:via-sky-400 before:to-transparent before:rounded-full before:shadow-[0_0_16px_rgba(56,189,248,0.8)]">
          
          {/* Shield Icon Container */}
          <div className="relative mb-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-sky-600 rounded-2xl blur-md opacity-40"></div>
            <div className="relative w-14 h-14 rounded-2xl bg-slate-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
              <ShieldCheck className="w-7 h-7 stroke-[1.8]" />
            </div>
          </div>

          {/* Security Status Badge */}
          <div className="mb-5 inline-flex items-center px-3.5 py-1 rounded-full text-[11px] font-mono tracking-wider font-semibold uppercase bg-cyan-950/50 text-cyan-300 border border-cyan-500/30 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-2 animate-pulse"></span>
            Protected Authentication Gateway
          </div>

          {/* Header Typography */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              Sistem Informasi Statistik
            </h1>
            <p className="mt-2 text-sm text-slate-400 max-w-xs sm:max-w-sm mx-auto leading-relaxed">
              Masuk untuk mengakses dasbor statistik dan data daerah
            </p>
          </div>

          {/* Lockout Banner Alert */}
          {securityStatus.isLocked && (
            <div className="w-full mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-left">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex flex-col flex-1">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono">
                  Account Lockout Aktif
                </span>
                <p className="text-xs text-rose-300/90 mt-0.5">
                  Terdeteksi 5 kali percobaan gagal berturut-turut. Akses ditangguhkan selama 15 menit.
                </p>
                <div className="flex items-center gap-1.5 mt-2 font-mono text-sm font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg w-fit border border-rose-500/20">
                  <Clock className="w-4 h-4 animate-pulse" />
                  <span>Tunggu: {formatTime(countdown)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Failed Attempts Warnings (1 to 4) */}
          {!securityStatus.isLocked && securityStatus.consecutiveFailures > 0 && (
            <div className="w-full mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-400">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Percobaan gagal: <strong>{securityStatus.consecutiveFailures}</strong> / {securityStatus.maxAttempts}</span>
              </div>
              <span className="font-mono text-[10px] text-amber-400/80 uppercase">Anti-Brute Force</span>
            </div>
          )}

          {/* Generic Error Message Banner */}
          {errorMsg && !securityStatus.isLocked && (
            <div className="w-full mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-5">
            
            {/* Username Field */}
            <div className="space-y-1.5 text-left">
              <label className="block text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                Username
              </label>
              <div className="relative rounded-xl shadow-inner group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={securityStatus.isLocked || isLoading}
                  placeholder="Masukkan username"
                  autoComplete="username"
                  required
                  className="block w-full pl-11 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition duration-150 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                  Password
                </label>
              </div>
              <div className="relative rounded-xl shadow-inner group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={securityStatus.isLocked || isLoading}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  required
                  className="block w-full pl-11 pr-11 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition duration-150 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={securityStatus.isLocked || isLoading}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none transition-colors"
                  aria-label="Tampilkan atau sembunyikan password"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={securityStatus.isLocked || isLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm bg-gradient-to-r from-sky-400 via-sky-500 to-cyan-400 text-slate-950 hover:brightness-110 active:scale-[0.99] transition duration-150 cursor-pointer shadow-lg shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-mono text-xs">Memvalidasi Kredensial...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </form>

        </div>

        {/* Security Footer */}
        <footer className="mt-8 px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2 text-slate-500 text-xs font-mono">
            <Lock className="h-3.5 w-3.5 text-cyan-500/70" />
            <span>End-to-End Encrypted Session</span>
          </div>
          <p className="text-xs text-slate-500/80 leading-relaxed max-w-sm mx-auto">
            Dilengkapi sistem proteksi keamanan siber berlapis terhadap serangan brute-force, credential stuffing, dan injeksi data.
          </p>
        </footer>

      </main>
    </div>
  );
};
