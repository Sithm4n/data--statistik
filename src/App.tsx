import React, { useState, useMemo } from 'react';
import { LayoutDashboard, Clock, Plus, Database, Search, Bell, BarChart2, User } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { UploadLogs } from './components/UploadLogs';
import { AllData, UploadRecord } from './types';

export default function App() {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [currentView, setCurrentView] = useState<'upload' | 'dashboard' | 'logs'>('upload');

  const handleDataLoaded = (newData: AllData, filename: string, year: string) => {
    const processIncomingRows = (rows: any[]) => rows.map(r => ({ ...r, _rowId: Math.random().toString(36).substring(2, 9) }));

    const newUpload: UploadRecord = {
      id: Math.random().toString(36).substring(2, 9),
      filename,
      uploadTime: new Date().toLocaleString('id-ID', {
        dateStyle: 'long',
        timeStyle: 'medium'
      }),
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
  };

  const aggregatedData = useMemo(() => {
    if (uploads.length === 0) return null;
    
    const combined: AllData = {
      eWalidata: [],
      sektoral: [],
      spasial: []
    };

    uploads.forEach(upload => {
      combined.eWalidata.push(...upload.data.eWalidata.map((r, i) => ({ ...r, Tahun: upload.year, _uploadId: upload.id, _originalIndex: i })));
      combined.sektoral.push(...upload.data.sektoral.map((r, i) => ({ ...r, Tahun: upload.year, _uploadId: upload.id, _originalIndex: i })));
      combined.spasial.push(...upload.data.spasial.map((r, i) => ({ ...r, Tahun: upload.year, _uploadId: upload.id, _originalIndex: i })));
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
  };

  const handleDeleteUpload = (id: string) => {
    setUploads(prev => prev.filter(up => up.id !== id));
    if (uploads.length === 1) {
      setCurrentView('upload');
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-on-surface font-sans antialiased">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low/40 backdrop-blur-2xl z-50 flex flex-col border-r border-primary/20 shadow-[20px_0_40px_rgba(0,0,0,0.2)]">
        <div className="p-8 mb-4">
          <div className="flex items-center gap-3 bg-gradient-to-br from-primary to-tertiary bg-clip-text text-transparent">
            <BarChart2 className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold tracking-tight">STATISTIK</span>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 group ${
              currentView === 'dashboard' 
                ? 'bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(2,132,199,0.3)]' 
                : 'text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-base font-medium">Dashboard</span>
          </button>
          
          <button
            onClick={() => setCurrentView('logs')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 group ${
              currentView === 'logs'
                ? 'bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(2,132,199,0.3)]'
                : 'text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface'
            }`}
          >
            <Clock className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-base font-medium">Upload History</span>
          </button>

          <button
            onClick={() => setCurrentView('upload')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 group ${
              currentView === 'upload'
                ? 'bg-primary-container text-on-primary-container shadow-[0_0_15px_rgba(2,132,199,0.3)]'
                : 'text-on-surface-variant hover:bg-surface-variant/30 hover:text-on-surface'
            }`}
          >
            <Database className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-base font-medium">Data Management</span>
          </button>
        </nav>
        <div className="p-6 mt-auto border-t border-outline-variant/10">
          <div className="flex items-center gap-4 p-3 rounded-2xl bg-surface-variant/20 backdrop-blur-md">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <User className="w-5 h-5 text-on-primary" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-medium text-on-surface">Lead Analyst</span>
              <span className="text-xs font-mono text-on-surface-variant">v1.0.4-stable</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="pl-72 flex-1 flex flex-col w-full min-h-screen">
        {/* Header */}
        <header className="fixed top-0 left-72 right-0 h-20 bg-surface-dim/60 backdrop-blur-md z-40 flex items-center justify-between px-8 border-b border-primary/20 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-xl font-medium text-on-surface tracking-wide">Sistem Informasi Statistik</span>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setCurrentView('upload')}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary-container text-on-primary-container font-medium hover:brightness-110 transition-all shadow-[0_0_20px_rgba(2,132,199,0.2)] active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Add Data
            </button>
            <div className="flex items-center gap-4 text-on-surface-variant">
              <Search className="w-5 h-5 hover:text-primary cursor-pointer transition-colors" />
              <Bell className="w-5 h-5 hover:text-primary cursor-pointer transition-colors" />
            </div>
          </div>
        </header>

        {/* View Rendering */}
        <main className="relative pt-20 flex-1 w-full overflow-x-hidden">
          {currentView === 'upload' && (
            <div className="p-8 relative min-h-[calc(100vh-5rem)]">
              {/* Ambient Glows */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-tertiary-container/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
              
              <div className="max-w-3xl mx-auto mt-12 relative z-10">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-br from-on-surface to-on-surface-variant bg-clip-text text-transparent">
                    Tambahkan Data Baru
                  </h2>
                  <p className="mt-4 text-on-surface-variant max-w-xl mx-auto">
                    Unggah file Excel yang berisi sheet e-Walidata, Sektoral, dan Spasial untuk divisualisasikan dalam dashboard.
                  </p>
                </div>
                
                <FileUpload onDataLoaded={handleDataLoaded} />
                
                {uploads.length > 0 && (
                  <div className="mt-12 text-center">
                    <button 
                      onClick={() => setCurrentView('dashboard')}
                      className="text-primary font-medium hover:text-primary-container transition-colors flex items-center gap-2 justify-center mx-auto"
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

          {currentView === 'dashboard' && !aggregatedData && (
            <div className="flex flex-col items-center justify-center h-full pt-32 text-on-surface-variant relative">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -z-10 mix-blend-screen pointer-events-none"></div>
              <Database className="w-16 h-16 opacity-30 mb-4" />
              <p className="text-lg">Belum ada data yang diunggah.</p>
              <button 
                onClick={() => setCurrentView('upload')}
                className="mt-4 px-6 py-2.5 rounded-full bg-primary-container text-on-primary-container font-medium hover:brightness-110 transition-all shadow-[0_0_20px_rgba(2,132,199,0.2)]"
              >
                Mulai Unggah Data
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
