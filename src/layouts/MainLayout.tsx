import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { LayoutDashboard, CalendarDays, Medal, Image as ImageIcon, Menu, X } from 'lucide-react';
import Fixture from '../pages/Fixture';
import BannerInnova from '../components/BannerInnova';

// After a deploy, an open page may request files from the previous version that no longer exist.
// Reload once to fetch the new version; the flag prevents a reload loop if the error persists.
const RELOAD_FLAG = 'recarga-por-version';
const lazyPage = (load: () => Promise<{ default: ComponentType }>) => lazy(async () => {
  try {
    const page = await load();
    try { sessionStorage.removeItem(RELOAD_FLAG); } catch { /* Storage may be unavailable. */ }
    return page;
  } catch (error) {
    let reloaded = true;
    try { reloaded = sessionStorage.getItem(RELOAD_FLAG) === '1'; sessionStorage.setItem(RELOAD_FLAG, '1'); } catch { /* Storage may be unavailable. */ }
    if (!reloaded) window.location.reload();
    throw error;
  }
});

// Keeps the menu usable when a page cannot load, instead of leaving the whole site blank.
class PageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <div role="alert" className="mx-auto max-w-lg rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center text-amber-900">
      <p className="font-semibold">No se pudo cargar esta sección. Revisa tu conexión.</p>
      <button onClick={() => window.location.reload()} className="mt-4 rounded-full bg-violet-500 px-5 py-2 font-bold text-white">Recargar la página</button>
    </div>;
  }
}

// Pages outside the landing view load only when opened, so visitors don't download the referee panel.
const PanelArbitro = lazyPage(() => import('../pages/PanelArbitro'));
const Puntajes = lazyPage(() => import('../pages/Puntajes'));
const Galeria = lazyPage(() => import('../pages/Galeria'));

const tabFromPath = (path: string) => {
  if (path.includes('arbitraje')) return 'arbitraje';
  if (path.includes('puntajes') || path.includes('medallero')) return 'medallero';
  if (path.includes('momentos')) return 'momentos';
  return 'fixture';
};

export default function MainLayout() {
  const [activeTab, setActiveTab] = useState(() => tabFromPath(window.location.pathname));

  // Estado para controlar la apertura del menú en celulares
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const botonAbrir = useRef<HTMLButtonElement>(null);
  const botonCerrar = useRef<HTMLButtonElement>(null);
  const menuAbiertoAntes = useRef(false);

  // Opening the menu moves focus into it; closing returns it to the menu button. Escape closes it.
  useEffect(() => {
    if (isMobileMenuOpen) botonCerrar.current?.focus();
    else if (menuAbiertoAntes.current) botonAbrir.current?.focus();
    menuAbiertoAntes.current = isMobileMenuOpen;
    if (!isMobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMobileMenuOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMobileMenuOpen]);

  // The phone menu makes no sense on a wide screen: close it if the window grows past `md`.
  useEffect(() => {
    const escritorio = window.matchMedia('(min-width: 768px)');
    const cerrar = () => { if (escritorio.matches) setIsMobileMenuOpen(false); };
    escritorio.addEventListener('change', cerrar);
    return () => escritorio.removeEventListener('change', cerrar);
  }, []);

  // Los botones atrás/adelante del navegador cambian la URL; la vista debe seguirla.
  useEffect(() => {
    const onPopState = () => {
      setActiveTab(tabFromPath(window.location.pathname));
      setIsMobileMenuOpen(false);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleTabChange = (tab: string) => {
    if (tab === 'arbitraje') {
      window.location.href = '/arbitraje';
    } else {
      setActiveTab(tab);
      const newPath = tab === 'fixture' ? '/' : `/${tab}`;
      if (window.location.pathname !== newPath) window.history.pushState({}, '', newPath);
      setIsMobileMenuOpen(false); // Cierra el menú en móvil al hacer clic
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'arbitraje':
        return <PanelArbitro />;
      case 'fixture':
        return <Fixture />;
      case 'medallero':
        return <Puntajes />;
      case 'momentos':
        return <Galeria />;
      default:
        return <Fixture />;
    }
  };

  return (
    <div className="fondo-confeti flex h-screen overflow-hidden font-sans">
      
      {/* Fondo oscuro translúcido para móviles cuando el menú está abierto */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* Barra Lateral (Sidebar Responsivo) */}
      {/* On phones the closed menu is `invisible` (not just off screen), so keyboard and screen readers skip it.
          `md:visible` keeps it always available on wide screens without depending on JavaScript.
          Visibility changes at once when opening (so focus can move in) and after the slide when closing. */}
      <aside id="menu-principal" className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-100 flex flex-col flex-shrink-0 
        shadow-[4px_0_24px_rgba(0,0,0,0.02)] duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0 visible transition-transform' : '-translate-x-full invisible transition-[transform,visibility]'} md:translate-x-0 md:relative md:visible
      `}>
        
        {/* Logo */}
        <div className="h-24 flex items-center justify-between px-6 border-b border-slate-50">
          <div className="flex items-center">
            <div className="w-11 h-11 flex items-center justify-center flex-shrink-0">
              <img 
                src="/logo-innova.png" 
                alt="Logo Innova Schools" 
                className="w-full h-full object-contain drop-shadow-sm" 
              />
            </div>
            <div className="ml-3">
              <h1 className="text-base font-extrabold text-slate-800 leading-tight">Olimpiadas 360°</h1>
              <p className="text-[10px] font-bold text-slate-400">SMP PERÚ</p>
            </div>
          </div>
          
          {/* Botón para cerrar menú en móviles */}
          <button 
            ref={botonCerrar}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Cerrar menú"
            className="md:hidden text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Navegación */}
        <nav aria-label="Secciones" className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          <button
            onClick={() => handleTabChange('arbitraje')}
            aria-current={activeTab === 'arbitraje' ? 'page' : undefined}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-full font-bold text-sm transition-all duration-300 ${
              activeTab === 'arbitraje'
                ? 'bg-violet-100 text-violet-700 shadow-sm'
                : 'text-slate-500 hover:bg-violet-50 hover:text-violet-700'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Panel de Arbitraje
            {activeTab === 'arbitraje' && <span aria-hidden="true" className="ml-auto text-sm">⭐</span>}
          </button>

          <button
            onClick={() => handleTabChange('fixture')}
            aria-current={activeTab === 'fixture' ? 'page' : undefined}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-full font-bold text-sm transition-all duration-300 ${
              activeTab === 'fixture'
                ? 'bg-violet-100 text-violet-700 shadow-sm'
                : 'text-slate-500 hover:bg-violet-50 hover:text-violet-700'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
            <span translate="no" className="notranslate">Fixture</span>
            {activeTab === 'fixture' && <span aria-hidden="true" className="ml-auto text-sm">⭐</span>}
          </button>

          <button
            onClick={() => handleTabChange('medallero')}
            aria-current={activeTab === 'medallero' ? 'page' : undefined}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-full font-bold text-sm transition-all duration-300 ${
              activeTab === 'medallero'
                ? 'bg-violet-100 text-violet-700 shadow-sm'
                : 'text-slate-500 hover:bg-violet-50 hover:text-violet-700'
            }`}
          >
            <Medal className="w-5 h-5" />
            <span translate="no" className="notranslate">Puntaje Oficial</span>
            {activeTab === 'medallero' && <span aria-hidden="true" className="ml-auto text-sm">⭐</span>}
          </button>

          <button
            onClick={() => handleTabChange('momentos')}
            aria-current={activeTab === 'momentos' ? 'page' : undefined}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-full font-bold text-sm transition-all duration-300 ${
              activeTab === 'momentos'
                ? 'bg-violet-100 text-violet-700 shadow-sm'
                : 'text-slate-500 hover:bg-violet-50 hover:text-violet-700'
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            Momentos y Fotos
            {activeTab === 'momentos' && <span aria-hidden="true" className="ml-auto text-sm">⭐</span>}
          </button>
        </nav>

        {/* Identificación del evento (texto fijo: no indica el estado de la conexión) */}
        <div className="p-4 border-t border-slate-50">
          <div className="bg-gradient-to-br from-violet-100 via-pink-50 to-amber-50 rounded-3xl p-4 border-2 border-white shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100 rounded-full blur-xl opacity-50 -mr-6 -mt-6 group-hover:opacity-80 transition-opacity"></div>
            
            <p className="text-sm font-extrabold text-violet-700 relative z-10">
              🏆 Olimpiadas 360° · 2026
            </p>
            <p className="text-xs font-bold text-slate-500 mt-1 relative z-10">
              Innova Schools SMP
            </p>
          </div>
        </div>
        
      </aside>

      {/* Área Principal con Barra Superior Móvil */}
      {/* While the phone menu is open, the page behind it is inactive too. */}
      <div inert={isMobileMenuOpen} className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Cabecera superior solo visible en celulares */}
        <header className="md:hidden h-16 bg-white border-b border-slate-100 px-4 flex items-center justify-between flex-shrink-0 z-10">
          <button 
            ref={botonAbrir}
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={isMobileMenuOpen}
            aria-controls="menu-principal"
            className="p-2 rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
          >
            <Menu className="w-6 h-6" aria-hidden="true" />
          </button>
          <span className="font-extrabold text-slate-800">Olimpiadas 360° 🎉</span>
          <div className="w-10"></div> {/* Espaciador simétrico */}
        </header>

        {/* Área de Contenido Principal */}
        <main className="flex-1 overflow-y-auto relative p-4 md:p-8">
          <BannerInnova />
          {/* The key resets the error when switching tabs, so one failed page doesn't block the rest. */}
          <PageErrorBoundary key={activeTab}>
            <Suspense fallback={<p role="status" className="py-12 text-center text-slate-500">Cargando…</p>}>
              {renderContent()}
            </Suspense>
          </PageErrorBoundary>
        </main>

      </div>
    </div>
  );
}