import { useState } from 'react';
import { LayoutDashboard, CalendarDays, Medal, Image as ImageIcon} from 'lucide-react';
import PanelArbitro from '../pages/PanelArbitro';
import Puntajes from '../pages/Puntajes';
import Fixture from '../pages/Fixture';
import BannerInnova from '../components/BannerInnova'

export default function MainLayout() {
  // Detecta la pestaña inicial basándose en la URL actual del navegador
  const [activeTab, setActiveTab] = useState(() => {
    const path = window.location.pathname;
    if (path.includes('arbitraje')) return 'arbitraje';
    if (path.includes('puntajes') || path.includes('medallero')) return 'medallero';
    if (path.includes('galeria')) return 'galeria';
    return 'fixture';
  });

  // Función que maneja la navegación real hacia la ruta protegida
  const handleTabChange = (tab: string) => {
    if (tab === 'arbitraje') {
      // Esto obliga al navegador a cambiar la URL a /arbitraje, activando Cloudflare Access
      window.location.href = '/arbitraje';
    } else {
      setActiveTab(tab);
      window.history.pushState({}, '', '/');
    }
  };

  // Función que decide qué pantalla renderizar a la derecha
  const renderContent = () => {
    switch (activeTab) {
      case 'arbitraje':
        return <PanelArbitro />;
      case 'fixture':
        return <Fixture />;
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
        return <Fixture />;
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      {/* Barra Lateral (Sidebar) */}
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col flex-shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
        
        {/* Logo */}
        <div className="h-24 flex items-center px-6 border-b border-slate-50">
          <div className="w-11 h-11 flex items-center justify-center flex-shrink-0">
            <img 
              src="/logo-innova.png" 
              alt="Logo Innova Schools" 
              className="w-full h-full object-contain drop-shadow-sm" 
            />
          </div>
      <div className="ml-3">
       <h1 className="text-sm font-black text-slate-800 leading-tight">Olimpiadas 360°</h1>
        <p className="text-[10px] font-bold text-slate-400">SMP PERÚ</p>
        </div>
      </div>

        {/* Navegación */}
        <nav className="flex-1 px-4 py-8 space-y-2">
          <button
            onClick={() => handleTabChange('arbitraje')}
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
            onClick={() => handleTabChange('fixture')}
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
            onClick={() => handleTabChange('medallero')}
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
            onClick={() => handleTabChange('galeria')}
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

        {/* Widget de Estado de Plataforma */}
        <div className="p-4 border-t border-slate-50">
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl p-4 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-full blur-xl opacity-50 -mr-6 -mt-6 group-hover:opacity-80 transition-opacity"></div>
            
            <div className="flex items-center gap-2.5 mb-2.5 relative z-10">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </div>
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                Sistema Activo
              </span>
            </div>
            
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-3 relative z-10">
              Plataforma oficial de sincronización en tiempo real conectada a la base de datos central.
            </p>
            
            <div className="flex items-center justify-between border-t border-slate-200/60 pt-3 relative z-10">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Innova SMP © 2026
              </span>
              <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                v1.0.0
              </span>
            </div>
          </div>
        </div>
        
      </aside>

      {/* Área de Contenido Principal */}
      <main className="flex-1 overflow-y-auto relative p-4 md:p-8">
        <BannerInnova />
        {renderContent()}
      </main>
    </div>
  );
}