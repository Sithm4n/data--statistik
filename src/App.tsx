/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { UploadLogs } from './components/UploadLogs';
import { AllData, UploadRecord } from './types';
import { BarChart3, Clock, LayoutDashboard, Plus, FileSpreadsheet } from 'lucide-react';

export default function App() {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'logs' | 'upload'>('upload');

  const handleDataLoaded = (newData: AllData, filename: string, year: string) => {
    const timestamp = new Date().toLocaleString('id-ID', {
      dateStyle: 'long',
      timeStyle: 'medium'
    });
    
    const processIncomingRows = (rows: any[]) => rows.map(r => ({ ...r, _rowId: Math.random().toString(36).substring(2, 9) }));

    const newUpload: UploadRecord = {
      id: Math.random().toString(36).substring(2, 9),
      filename,
      timestamp,
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

  const handleDeleteUpload = (id: string) => {
    setUploads(prev => {
      const newUploads = prev.filter(u => u.id !== id);
      if (newUploads.length === 0) {
        setCurrentView('upload');
      }
      return newUploads;
    });
  };

  const aggregatedData = useMemo(() => {
    if (uploads.length === 0) return null;
    
    const result: AllData = { eWalidata: [], sektoral: [], spasial: [] };
    
    uploads.forEach(upload => {
      const processRows = (rows: any[], type: keyof AllData) => 
        rows.map((r, idx) => ({
          ...r,
          Tahun: upload.year,
          _uploadTime: upload.timestamp,
          _uploadId: upload.id,
          _originalIndex: idx
        }));
      
      result.eWalidata.push(...processRows(upload.data.eWalidata, 'eWalidata'));
      result.sektoral.push(...processRows(upload.data.sektoral, 'sektoral'));
      result.spasial.push(...processRows(upload.data.spasial, 'spasial'));
    });
    
    return result;
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            Sistem Informasi <span className="text-slate-400 font-normal">Statistik</span>
          </h1>
        </div>
        
        {uploads.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-1 rounded-lg flex items-center mr-4">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                  currentView === 'dashboard' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('logs')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                  currentView === 'logs' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-4 h-4" />
                Riwayat Unggah
              </button>
            </div>

            <button
              onClick={() => setCurrentView('upload')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 font-medium transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Tambah Data
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col overflow-auto">
        {currentView === 'upload' && (
          <div className="max-w-4xl mx-auto py-16 px-4 w-full animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Visualisasi Data Statistik Daerah
              </h2>
              <p className="mt-4 text-sm text-slate-500 max-w-xl mx-auto">
                Unggah file Excel yang telah memiliki sheet e-Walidata, Sektoral, dan Spasial untuk melihat visualisasi dan rekapitulasi data secara otomatis. Data dapat digabungkan antar tahun.
              </p>
            </div>
            
            <FileUpload onDataLoaded={handleDataLoaded} />
            
            {uploads.length > 0 && (
              <div className="mt-12 text-center">
                <button 
                  onClick={() => setCurrentView('dashboard')}
                  className="text-blue-600 font-medium hover:underline flex items-center gap-2 justify-center mx-auto"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Kembali ke Dashboard
                </button>
              </div>
            )}
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
      </main>
    </div>
  );
}
