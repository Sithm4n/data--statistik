/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { Dashboard } from './components/Dashboard';
import { AllData } from './types';
import { BarChart3, RefreshCw } from 'lucide-react';

export default function App() {
  const [data, setData] = useState<AllData | null>(null);

  const handleReset = () => {
    setData(null);
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
        
        {data && (
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> 
              Data Aktif
            </span>
            <button
              onClick={handleReset}
              className="bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700 flex items-center transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Unggah Data Baru
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col overflow-auto">
        {!data ? (
          <div className="max-w-4xl mx-auto py-16 px-4 w-full">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Visualisasi Data Statistik Daerah
              </h2>
              <p className="mt-4 text-sm text-slate-500 max-w-xl mx-auto">
                Unggah file Excel yang telah memiliki sheet e-Walidata, Sektoral, dan Spasial untuk melihat visualisasi dan rekapitulasi data secara otomatis.
              </p>
            </div>
            
            <FileUpload onDataLoaded={setData} />
          </div>
        ) : (
          <Dashboard data={data} />
        )}
      </main>
    </div>
  );
}
