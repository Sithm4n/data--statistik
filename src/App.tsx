import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, 
  Clock, 
  Plus, 
  Database, 
  Search, 
  Bell, 
  BarChart2, 
  User, 
  Printer, 
  Menu, 
  X, 
  Shield, 
  LogOut, 
  KeyRound, 
  Cloud, 
  RefreshCw, 
  Sun, 
  Moon, 
  Layers 
} from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { UploadLogs } from './components/UploadLogs';
import { PrintDocument } from './components/PrintDocument';
import { BatchPrintPage } from './components/BatchPrintPage';
import { LoginPage } from './components/LoginPage';
import { AccountSecurityModal } from './components/AccountSecurityModal';
import { authService } from './services/authService';
import { supabaseDataService } from './services/supabaseDataService';
import { testSupabaseConnection, supabase } from './services/supabaseClient';
import { AllData, UploadRecord, AuthUser } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [currentView, setCurrentView] = useState<'upload' | 'dashboard' | 'logs' | 'print' | 'batch-print'>('upload');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const isSyncingRef = useRef(false);

  // Theme support (Dark Mode & Light Mode)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Fungsi untuk memuat ulang data dari Supabase (sinkronisasi multi-device di background)
  const refreshDataFromCloud = useCallback(async (silent = false) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (!silent) setIsSyncing(true);

    try {
      const remoteUploads = await supabaseDataService.loadAllUploads();
      if (remoteUploads && remoteUploads.length > 0) {
        setUploads(remoteUploads);
      }
      setIsCloudConnected(true);
    } catch (err) {
      console.warn('Gagal sinkronisasi data dari Supabase:', err);
    } finally {
      isSyncingRef.current = false;
      if (!silent) setIsSyncing(false);
    }
  }, []);

  // Load initial data on mount and connect to Supabase
  useEffect(() => {
    testSupabaseConnection().then(res => {
      setIsCloudConnected(res.ok);
    });

    setIsSyncing(true);
    supabaseDataService.loadAllUploads()
      .then(remoteUploads => {
        if (remoteUploads && remoteUploads.length > 0) {
          setUploads(remoteUploads);
          setCurrentView('dashboard');
        }
        setIsCloudConnected(true);
      })
      .catch(err => {
        console.warn('Gagal load data awal dari Supabase:', err);
      })
      .finally(() => {
        setIsSyncing(false);
      });
  }, []);

  // Real-time synchronization subscription across all devices
  useEffect(() => {
    // 1. Supabase Realtime Channel: Mendengar perubahan tabel database (INSERT, UPDATE, DELETE)
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'uploads' },
        (payload) => {
          console.log('[Realtime] Perubahan uploads terdeteksi:', payload.eventType);
          refreshDataFromCloud(true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'data_ewalidata' },
        (payload) => {
          console.log('[Realtime] Perubahan data_ewalidata terdeteksi:', payload.eventType);
          refreshDataFromCloud(true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'data_sektoral' },
        (payload) => {
          console.log('[Realtime] Perubahan data_sektoral terdeteksi:', payload.eventType);
          refreshDataFromCloud(true);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'data_spasial' },
        (payload) => {
          console.log('[Realtime] Perubahan data_spasial terdeteksi:', payload.eventType);
          refreshDataFromCloud(true);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime Supabase tersambung: Sinkronisasi antar device aktif');
          setIsCloudConnected(true);
        }
      });

    // 2. Window Focus & Polling Fallback (setiap 10 detik & saat tab dibuka di HP/Laptop)
    // Memastikan jika browser mobile masuk background dan kembali, data langsung sinkron
    const handleFocus = () => {
      refreshDataFromCloud(true);
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);

    const intervalId = setInterval(() => {
      refreshDataFromCloud(true);
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
      clearInterval(intervalId);
    };
  }, [refreshDataFromCloud]);

  const handleRequestLogout = () => {
    setIsLogoutModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleConfirmLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsLogoutModalOpen(false);
  };

  const handleDataLoaded = (newData: AllData, filename: string, year: string) => {
    const processIncomingRows = (rows: any[]) =>
      rows.map(r => ({
        ...r,
        _rowId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9)
      }));

    const newUploadId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-4000-8000-' + Math.random().toString(16).substring(2, 14).padEnd(12, '0');

    const newUpload: UploadRecord = {
      id: newUploadId,
      filename,
      uploadTime: new Date().toISOString(),
      year,
      data: {
        eWalidata: processIncomingRows(newData.eWalidata),
        sektoral: processIncomingRows(newData.sektoral),
        spasial: processIncomingRows(newData.spasial)
      },
      totalRows: newData.eWalidata.length + newData.sektoral.length + newData.spasial.length
    };

    setUploads(prev => [...prev, newUpload]);
    setCurrentView('dashboard');

    // Simpan ke Supabase Cloud (mendukung 10k+ data secara batch)
    setIsSyncing(true);
    supabaseDataService.saveUploadRecord(newUpload)
      .then(res => {
        if (res.success) {
          setIsCloudConnected(true);
        } else {
          console.error('Peringatan penyimpanan cloud:', res.error);
        }
      })
      .finally(() => {
        setIsSyncing(false);
      });
  };

  const aggregatedData = useMemo(() => {
    if (uploads.length === 0) return null;
    
    const combined: AllData = {
      eWalidata: [],
      sektoral: [],
      spasial: []
    };

    uploads.forEach(upload => {
      combined.eWalidata.push(...upload.data.eWalidata.map((r, i) => ({ ...r, Tahun: upload.year, _uploadId: upload.id, _uploadTime: upload.uploadTime, _originalIndex: i })));
      combined.sektoral.push(...upload.data.sektoral.map((r, i) => ({ ...r, Tahun: upload.year, _uploadId: upload.id, _uploadTime: upload.uploadTime, _originalIndex: i })));
      combined.spasial.push(...upload.data.spasial.map((r, i) => ({ ...r, Tahun: upload.year, _uploadId: upload.id, _uploadTime: upload.uploadTime, _originalIndex: i })));
    });

    return combined;
  }, [uploads]);

  const handleEditRow = (tabType: keyof AllData, rowIndex: number, newRowData: any) => {
    const uploadId = newRowData._uploadId;
    const rowId = newRowData._rowId;
    
    if (!uploadId || !rowId) return;

    setUploads(prev => prev.map(up => {
      if (up.id !== uploadId) return up;
      
      const updatedTab = up.data[tabType].map(r => {
        if ((r as any)._rowId === rowId) {
          const cleanData = { ...newRowData };
          delete cleanData._uploadTime;
          delete cleanData.Tahun;
          delete cleanData._uploadId;
          delete cleanData._originalIndex;
          
          return {
            ...cleanData,
            _lastModified: new Date().toLocaleString('id-ID', {
              dateStyle: 'short',
              timeStyle: 'medium'
            })
          };
        }
        return r;
      });
      
      return {
        ...up,
        data: {
          ...up.data,
          [tabType]: updatedTab
        }
      };
    }));

    // Update langsung ke Supabase Cloud agar instan ter-sinkronisasi ke semua device
    supabaseDataService.updateSingleRow(tabType, rowId, newRowData);
  };

  const handleDeleteRow = (tabType: keyof AllData, row: any) => {
    const uploadId = row._uploadId;
    const rowId = row._rowId;
    
    if (!uploadId || !rowId) return;

    setUploads(prev => prev.map(up => {
      if (up.id !== uploadId) return up;
      
      const updatedTab = up.data[tabType].filter((r: any) => r._rowId !== rowId);
      
      return {
        ...up,
        data: {
          ...up.data,
          [tabType]: updatedTab
        },
        totalRows: up.data.eWalidata.length + up.data.sektoral.length + up.data.spasial.length - 1
      };
    }));

    // Hapus di Supabase jika ada ID
    supabaseDataService.deleteSingleRow(tabType, rowId);
  };

  const handleBulkDelete = (tabType: keyof AllData, filterKey: string, filterValue: string) => {
    setUploads(prev => prev.map(up => {
      const isYearFilter = filterKey === 'Tahun';
      
      if (isYearFilter) {
         if (up.year === filterValue) {
           return {
             ...up,
             data: {
               ...up.data,
               [tabType]: []
             },
             totalRows: up.totalRows - up.data[tabType].length
           };
         }
         return up;
      }
      
      const updatedTab = up.data[tabType].filter((r: any) => String(r[filterKey]) !== String(filterValue));
      
      return {
        ...up,
        data: {
          ...up.data,
          [tabType]: updatedTab
        },
        totalRows: up.data.eWalidata.length + up.data.sektoral.length + up.data.spasial.length - (up.data[tabType].length - updatedTab.length)
      };
    }));

    // Hapus massal di Supabase
    supabaseDataService.bulkDeleteRows(tabType, filterKey, filterValue);
  };

  const handleDeleteUpload = (id: string) => {
    setUploads(prev => prev.filter(up => up.id !== id));
    supabaseDataService.deleteUploadRecord(id);
    if (uploads.length === 1) {
      setCurrentView('upload');
    }
  };

  // Jika belum login, tampilkan halaman Login dengan proteksi keamanan berlapis
  if (!currentUser) {
    return <LoginPage onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="flex min-h-screen bg-background text-on-surface font-sans antialiased overflow-x-hidden print:bg-white print:text-black print:overflow-visible print:block print:min-h-0 print:h-auto print:p-0 print:m-0">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Desktop Persistent, Mobile Collapsible Drawer) */}
      <aside 
        className={`fixed left-0 top-0 h-full w-72 bg-surface-container-low/95 lg:bg-surface-container-low/40 backdrop-blur-2xl z-50 flex flex-col border-r border-primary/20 shadow-[20px_0_40px_rgba(0,0,0,0.3)] print:hidden transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 lg:p-8 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3 bg-gradient-to-br from-primary to-tertiary bg-clip-text text-transparent">
            <BarChart2 className="w-8 h-8 text-primary shrink-0" />
            <span className="text-2xl font-bold tracking-tight">STATISTIK</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 transition-colors"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => {
              setCurrentView('dashboard');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-4 px-6 py-3.5 sm:py-4 rounded-xl transition-all duration-300 group ${
              currentView === 'dashboard' 
                ? 'bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(2,132,199,0.3)] font-semibold' 
                : 'text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-base font-medium">Dashboard</span>
          </button>
          
          <button
            onClick={() => {
              setCurrentView('logs');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-4 px-6 py-3.5 sm:py-4 rounded-xl transition-all duration-300 group ${
              currentView === 'logs'
                ? 'bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(2,132,199,0.3)] font-semibold'
                : 'text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface'
            }`}
          >
            <Clock className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-base font-medium">Upload History</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('batch-print');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-4 px-6 py-3.5 sm:py-4 rounded-xl transition-all duration-300 group ${
              currentView === 'batch-print'
                ? 'bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(2,132,199,0.3)] font-semibold'
                : 'text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface'
            }`}
          >
            <Layers className="w-5 h-5 group-hover:scale-110 transition-transform text-primary" />
            <span className="text-base font-medium">Cetak Massal Produsen</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('print');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-4 px-6 py-3.5 sm:py-4 rounded-xl transition-all duration-300 group ${
              currentView === 'print'
                ? 'bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(2,132,199,0.3)] font-semibold'
                : 'text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface'
            }`}
          >
            <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-base font-medium">Cetak Dokumen</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('upload');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-4 px-6 py-3.5 sm:py-4 rounded-xl transition-all duration-300 group ${
              currentView === 'upload'
                ? 'bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(2,132,199,0.3)] font-semibold'
                : 'text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface'
            }`}
          >
            <Database className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-base font-medium">Data Management</span>
          </button>
        </nav>
        <div className="p-4 sm:p-6 mt-auto border-t border-outline-variant/10 flex flex-col gap-3">
          
          {/* Quick Theme Switcher in Sidebar */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface-container/60 hover:bg-surface-variant/40 border border-outline-variant/20 text-on-surface transition-all text-xs font-medium"
            title="Ganti Mode Gelap / Terang"
          >
            <span className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>{theme === 'dark' ? 'Mode Gelap (Aktif)' : 'Mode Terang (Aktif)'}</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-surface-variant text-on-surface-variant uppercase">
              Ubah
            </span>
          </button>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface-variant/20 backdrop-blur-md">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary shadow-lg shadow-primary/10 shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-surface"></div>
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-sm font-semibold text-on-surface truncate" title={currentUser.username}>
                {currentUser.username}
              </span>
              <span className="text-[11px] font-mono text-primary truncate">
                {currentUser.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setIsSecurityModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-surface-container/60 border border-outline-variant/20 text-on-surface hover:border-primary/40 hover:text-primary transition-all text-xs font-medium"
              title="Kelola Keamanan & Ubah Password"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Keamanan</span>
            </button>
            <button
              onClick={handleRequestLogout}
              className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl bg-error-container/10 border border-error/20 text-error hover:bg-error-container/20 transition-all text-xs font-medium"
              title="Keluar dari sesi"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="pl-0 lg:pl-72 flex-1 flex flex-col w-full min-h-screen print:pl-0 print:p-0 print:m-0 print:block print:w-full print:min-h-0 print:h-auto print:bg-white pb-16 lg:pb-0">
        {/* Header matching Google Stitch TopNavigationBar */}
        <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 lg:h-18 bg-surface-container-low/80 border-b border-outline-variant/20 backdrop-blur-xl z-40 flex items-center justify-between px-4 sm:px-8 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-on-surface-variant hover:bg-surface-variant/30 transition-colors"
              aria-label="Buka Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-400 p-0.5 shadow-[0_0_25px_-5px_rgba(56,189,248,0.35)] shrink-0 hidden sm:block">
                <div className="w-full h-full bg-surface-container rounded-[10px] flex items-center justify-center">
                  <BarChart2 className="w-5 h-5 text-primary" />
                </div>
              </div>
              <h1 className="text-base sm:text-lg font-semibold tracking-tight text-on-surface flex items-center gap-2 truncate">
                Sistem Informasi Statistik
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Light / Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/40 transition-all cursor-pointer"
              title={theme === 'dark' ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
              aria-label="Ubah Tema"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-700" />
              )}
            </button>

            {/* Supabase Cloud Status Indicator & Realtime Sync Button */}
            <button 
              onClick={() => refreshDataFromCloud(false)}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-variant border border-outline-variant/30 hover:border-primary/50 text-[11px] font-medium shadow-inner transition-all cursor-pointer disabled:opacity-75"
              title={isCloudConnected ? "Realtime Cloud Aktif (Klik untuk sinkronkan ulang langsung)" : "Menghubungkan ke Supabase..."}
            >
              <div className={`w-2 h-2 rounded-full ${isCloudConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : isCloudConnected === false ? 'bg-rose-400' : 'bg-amber-400 animate-ping'}`} />
              <span className="text-on-surface-variant flex items-center gap-1.5">
                <Cloud className="w-3 h-3 text-primary" />
                <span className="font-mono text-[10px] text-on-surface-variant hidden sm:inline">Supabase</span>
                <RefreshCw className={`w-3 h-3 text-primary ${isSyncing ? 'animate-spin' : 'opacity-70 hover:opacity-100'}`} />
              </span>
            </button>

            {/* + Add Data Button */}
            <button
              onClick={() => {
                setCurrentView('upload');
                setIsMobileMenuOpen(false);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs font-semibold bg-primary hover:bg-primary-container text-on-primary shadow-[0_0_20px_-3px_rgba(14,165,233,0.45)] transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Add Data</span>
              <span className="sm:hidden">Add</span>
            </button>

            {/* User Chip */}
            <button
              onClick={() => setIsSecurityModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/30 text-xs font-medium text-on-surface-variant hover:border-primary/40 hover:text-on-surface transition-all cursor-pointer"
              title="Pusat Keamanan & Kredensial Akun"
            >
              <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-mono">@{currentUser.username}</span>
            </button>

            {/* Logout Action Button */}
            <button
              onClick={handleRequestLogout}
              className="p-2 rounded-full text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors duration-200 cursor-pointer"
              title="Keluar"
              aria-label="Keluar"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </header>

        {/* View Rendering */}
        <main className="relative pt-16 lg:pt-20 flex-1 w-full overflow-x-hidden print:pt-0 print:p-0 print:m-0 print:overflow-visible print:block print:w-full print:min-h-0 print:h-auto print:bg-white">
          {currentView === 'upload' && (
            <div className="p-4 sm:p-8 relative min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-5rem)]">
              {/* Ambient Glows */}
              <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[100px] sm:blur-[120px] -z-10 mix-blend-screen pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-tertiary-container/10 rounded-full blur-[80px] sm:blur-[100px] -z-10 pointer-events-none"></div>
              
              <div className="max-w-3xl mx-auto mt-4 sm:mt-12 relative z-10">
                <div className="text-center mb-6 sm:mb-12">
                  <h2 className="text-2xl sm:text-4xl font-bold tracking-tight bg-gradient-to-br from-on-surface to-on-surface-variant bg-clip-text text-transparent">
                    Tambahkan Data Baru
                  </h2>
                  <p className="mt-2 sm:mt-4 text-xs sm:text-base text-on-surface-variant max-w-xl mx-auto">
                    Unggah file Excel yang berisi sheet e-Walidata, Sektoral, dan Spasial untuk divisualisasikan dalam dashboard.
                  </p>
                </div>
                
                <FileUpload onDataLoaded={handleDataLoaded} />
                
                {uploads.length > 0 && (
                  <div className="mt-8 sm:mt-12 text-center">
                    <button 
                      onClick={() => setCurrentView('dashboard')}
                      className="text-primary font-medium hover:text-primary-container transition-colors flex items-center gap-2 justify-center mx-auto text-sm"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Kembali ke Dashboard
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentView === 'dashboard' && aggregatedData && (
            <Dashboard 
              data={aggregatedData} 
              onEditRow={handleEditRow} 
              onDeleteRow={handleDeleteRow}
              onBulkDelete={handleBulkDelete}
            />
          )}

          {currentView === 'logs' && (
            <UploadLogs uploads={uploads} onDeleteUpload={handleDeleteUpload} />
          )}

          {currentView === 'batch-print' && (
            <div className="p-4 sm:p-8">
              <BatchPrintPage data={aggregatedData} uploads={uploads} />
            </div>
          )}

          {currentView === 'print' && (
            <PrintDocument data={aggregatedData} uploads={uploads} />
          )}

          {currentView === 'dashboard' && !aggregatedData && (
            <div className="flex flex-col items-center justify-center h-full pt-16 sm:pt-32 text-on-surface-variant relative print:hidden px-4 text-center">
              <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/10 rounded-full blur-[100px] -z-10 mix-blend-screen pointer-events-none"></div>
              <Database className="w-12 h-12 sm:w-16 sm:h-16 opacity-30 mb-4" />
              <p className="text-base sm:text-lg">Belum ada data yang diunggah.</p>
              <button 
                onClick={() => setCurrentView('upload')}
                className="mt-4 px-6 py-2.5 rounded-full bg-primary-container text-on-primary-container font-medium hover:brightness-110 transition-all shadow-[0_0_20px_rgba(2,132,199,0.2)] text-sm sm:text-base"
              >
                Mulai Unggah Data
              </button>
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-primary/20 z-30 flex items-center justify-around px-2 print:hidden shadow-lg">
          <button
            onClick={() => { setCurrentView('dashboard'); setIsMobileMenuOpen(false); }}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-colors ${
              currentView === 'dashboard' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px]">Dashboard</span>
          </button>
          <button
            onClick={() => { setCurrentView('batch-print'); setIsMobileMenuOpen(false); }}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-colors ${
              currentView === 'batch-print' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px]">Massal</span>
          </button>
          <button
            onClick={() => { setCurrentView('print'); setIsMobileMenuOpen(false); }}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-colors ${
              currentView === 'print' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Printer className="w-5 h-5" />
            <span className="text-[10px]">Cetak</span>
          </button>
          <button
            onClick={() => { setCurrentView('logs'); setIsMobileMenuOpen(false); }}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-colors ${
              currentView === 'logs' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[10px]">Riwayat</span>
          </button>
          <button
            onClick={() => { setCurrentView('upload'); setIsMobileMenuOpen(false); }}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-colors ${
              currentView === 'upload' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Database className="w-5 h-5" />
            <span className="text-[10px]">Upload</span>
          </button>
        </div>
      </div>

      {/* Account & Security Modal */}
      <AccountSecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        currentUser={currentUser}
        onUserUpdated={(updated) => setCurrentUser(updated)}
      />

      {/* Logout Confirmation Modal - Google Stitch Design 2 */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="relative z-50 w-full max-w-[440px] px-2"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
          >
            <div className="backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),inset_0_1px_1px_0_rgba(255,255,255,0.12)] p-8 sm:p-9 text-center bg-[radial-gradient(120%_120%_at_50%_0%,rgba(30,41,59,0.85)_0%,rgba(15,23,42,0.95)_100%)] transition-all duration-300">
              {/* Top Decorative Icon Squircle */}
              <div className="flex justify-center mb-6">
                <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center border border-rose-400/20 shadow-inner bg-[linear-gradient(135deg,rgba(244,63,94,0.15)_0%,rgba(246,168,158,0.08)_100%)] group">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-rose-500/10 to-cyan-400/10 opacity-75 pointer-events-none"></div>
                  <LogOut className="w-7 h-7 text-[#F6A89E] relative z-10 transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
              </div>

              {/* Modal Title */}
              <h2 id="modal-title" className="text-xl sm:text-2xl font-semibold text-white tracking-tight mb-3">
                Konfirmasi Keluar
              </h2>

              {/* Description Context with Username Badge */}
              <p id="modal-description" className="text-slate-300/90 text-sm leading-relaxed px-1 mb-8">
                Apakah Anda yakin ingin mengakhiri sesi aktif dan keluar dari akun{' '}
                <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-md text-xs font-medium bg-slate-800/80 text-cyan-300 border border-cyan-500/20 shadow-sm font-mono tracking-wide">
                  @{currentUser.username}
                </span>?
              </p>

              {/* Dual Action Interactive Buttons */}
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="w-full inline-flex justify-center items-center py-3 px-4 rounded-xl text-sm font-medium text-slate-300 bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] border border-white/10 hover:border-white/20 transition-all duration-150 focus:outline-none cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="w-full inline-flex justify-center items-center py-3 px-4 rounded-xl text-sm font-semibold text-slate-950 bg-[#F6A89E] hover:bg-[#f49488] active:opacity-95 shadow-[0_0_25px_-4px_rgba(246,168,158,0.4)] transition-all duration-150 focus:outline-none cursor-pointer"
                >
                  Ya, Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
