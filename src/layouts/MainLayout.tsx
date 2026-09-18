import { useState } from 'react';
import { LayoutDashboard, CalendarDays, Medal, Image as ImageIcon, LogOut } from 'lucide-react';
import PanelArbitro from '../pages/PanelArbitro';
import Puntajes from '../pages/Puntajes';
import Fixture from '../pages/Fixture';

export default function MainLayout() {
  const [activeTab, setActiveTab] = useState('arbitraje');

  // Función que decide qué pantalla renderizar a la derecha
  const renderContent = () => {
    switch (activeTab) {
      case 'arbitraje':
        return <PanelArbitro />;
      case 'fixture':
        return (
          <div className="flex-1 flex flex-col items-center justify-center min-h-screen">
            <CalendarDays className="w-24 h-24 text-indigo-200 mb-6 animate-bounce" />
            <h2 className="text-3xl font-black text-slate-800 mb-2">Fixture y Puntajes</h2>
            <p className="text-slate-500 font-medium">Módulo en construcción...</p>
          </div>
        );
      case 'medallero':
        return <Puntajes />;
      case 'galeria':
        return (
          <div className="flex-1 flex flex-col items-center justify-center min-h-screen">
            <ImageIcon className="w-24 h-24 text-indigo-200 mb-6" />
            <h2 className="text-3xl font-black text-slate-800 mb-2">Momentos y Fotos</h2>
            <p className="text-slate-500 font-medium">Módulo en construcción...</p>
          </div>
        );
      default:
        return <PanelArbitro />;
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      {/* Barra Lateral (Sidebar) */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col flex-shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
        
        {/* Logo */}
        <div className="h-24 flex items-center px-8 border-b border-slate-50">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-white font-bold text-xl">O</span>
          </div>
          <div className="ml-3">
            <h1 className="text-sm font-black text-slate-800 leading-tight">Olimpiadas</h1>
            <p className="text-[10px] font-bold text-slate-400">INNOVA SMP 2026</p>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-4 py-8 space-y-2">
          <button
            onClick={() => setActiveTab('arbitraje')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 ${
              activeTab === 'arbitraje'
                ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Panel de Arbitraje
            {activeTab === 'arbitraje' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
          </button>

          <button
            onClick={() => setActiveTab('fixture')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 ${
              activeTab === 'fixture'
                ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
            Fixture y Puntajes
            {activeTab === 'fixture' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
          </button>

          <button
            onClick={() => setActiveTab('medallero')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 ${
              activeTab === 'medallero'
                ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <Medal className="w-5 h-5" />
            Puntaje Oficial
            {activeTab === 'medallero' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
          </button>

          <button
            onClick={() => setActiveTab('galeria')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-300 ${
              activeTab === 'galeria'
                ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            Momentos y Fotos
            {activeTab === 'galeria' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600"></div>}
          </button>
        </nav>

        {/* Perfil de Usuario (Corregido para que no se rompa por el traductor) */}
        <div className="p-4 border-t border-slate-50">
          <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
            <div translate="no" className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold">
              P
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate">Prof. Ramirez</p>
              <p className="text-[10px] text-slate-500 truncate">Comité Deportivo</p>
            </div>
            <button className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        
      </aside>

      {/* Área de Contenido Principal (Lo que está a la derecha) */}
      <main className="flex-1 overflow-y-auto relative">
        {renderContent()}
      </main>
    </div>
  );
}