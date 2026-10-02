import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { LayoutDashboard, CalendarDays, Medal, Image as ImageIcon, Menu, X, Lock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
      <button onClick={() => window.location.reload()} className="mt-4 rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white">Recargar la página</button>
    </div>;
  }
}

// Pages outside the landing view load only when opened, so visitors don't download the referee panel.
const PanelArbitro = lazyPage(() => import('../pages/PanelArbitro'));
const Puntajes = lazyPage(() => import('../pages/Puntajes'));
const Galeria = lazyPage(() => import('../pages/Galeria'));

// Public sections of the menu, in order. «Fixture» and «Puntaje Oficial» are names, not to be translated.
const SECCIONES = [
  { id: 'fixture', titulo: 'Fixture', detalle: 'Agenda y resultados', Icono: CalendarDays, sinTraducir: true },
  { id: 'medallero', titulo: 'Puntaje Oficial', detalle: 'Tabla de las Houses', Icono: Medal, sinTraducir: true },
  { id: 'momentos', titulo: 'Momentos y Fotos', detalle: 'Galería del evento', Icono: ImageIcon, sinTraducir: false },
] as const;

// One menu entry: icon in a box, name and a short description. The current one has a solid icon and an accent bar.
function BotonMenu({ titulo, detalle, Icono, activo, onClick, sinTraducir = false, candado = false }:
  { id: string; titulo: string; detalle: string; Icono: LucideIcon; activo: boolean; onClick: () => void; sinTraducir?: boolean; candado?: boolean }) {
  return <button onClick={onClick} aria-current={activo ? 'page' : undefined}
    className={`group relative flex w-full items-center gap-3 rounded-2xl p-2 pr-3 text-left transition-all duration-300 active:scale-[0.98] ${
      activo ? 'bg-indigo-50/70' : 'hover:bg-slate-50'}`}>
    {activo && <span aria-hidden="true" className="absolute -left-4 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-indigo-500" />}
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
      activo ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-[0_8px_16px_-8px_rgb(79_70_229/0.8)]'
        : 'bg-slate-100 text-slate-500 group-hover:scale-105 group-hover:text-indigo-600'}`}>
      <Icono className="h-5 w-5 transition-transform duration-300 group-hover:-rotate-6" aria-hidden="true" />
    </span>
    <span className="min-w-0 flex-1">
      <span translate={sinTraducir ? 'no' : undefined} className={`block text-sm font-bold ${sinTraducir ? 'notranslate' : ''} ${activo ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>{titulo}</span>
      <span className="block truncate text-xs text-slate-400">{detalle}</span>
    </span>
    {candado && <Lock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-label="Acceso restringido" />}
  </button>;
}

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
    <div className="fondo-cristal flex h-screen overflow-hidden font-sans">
      
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
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200/80 flex flex-col flex-shrink-0 
        shadow-[4px_0_24px_rgba(0,0,0,0.02)] duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0 visible transition-transform' : '-translate-x-full invisible transition-[transform,visibility]'} md:translate-x-0 md:relative md:visible
      `}>
        
        {/* Logo */}
        <div className="flex h-24 items-center justify-between gap-2 border-b border-slate-100 px-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-[0_10px_20px_-12px_rgb(51_65_85/0.6)] ring-1 ring-slate-200/80">
              <img src="/logo-innova.png" alt="Logo Innova Schools" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="texto-3d whitespace-nowrap text-lg font-extrabold leading-tight">Olimpiadas 360°</h1>
              <p className="text-xs font-semibold text-slate-400">Innova Schools · SMP</p>
            </div>
          </div>

          {/* Botón para cerrar menú en móviles */}
          <button
            ref={botonCerrar}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Cerrar menú"
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-700 md:hidden"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Navegación: secciones públicas arriba y, aparte, el panel de acceso restringido. */}
        <nav aria-label="Secciones" className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
          <div className="space-y-1.5">
            <p className="px-2 pb-1 text-[11px] font-bold text-slate-400">Olimpiadas</p>
            {SECCIONES.map(s => <BotonMenu key={s.id} {...s} activo={activeTab === s.id} onClick={() => handleTabChange(s.id)} />)}
          </div>
          <div className="space-y-1.5">
            <p className="px-2 pb-1 text-[11px] font-bold text-slate-400">Equipo arbitral</p>
            <BotonMenu id="arbitraje" titulo="Panel de arbitraje" detalle="Acceso restringido" Icono={LayoutDashboard} candado
              activo={activeTab === 'arbitraje'} onClick={() => handleTabChange('arbitraje')} />
          </div>
        </nav>

        {/* Identificación del evento (texto fijo: no indica el estado de la conexión) */}
        <div className="border-t border-slate-100 p-4">
          <div className="vidrio relative overflow-hidden rounded-2xl p-4">
                        <p className="texto-3d relative text-sm font-extrabold">Olimpiadas 360° · 2026</p>
            <div className="relative mt-2 flex items-center gap-2">
              <span aria-hidden="true" className="flex -space-x-1">
                {['bg-blue-600', 'bg-white ring-slate-300', 'bg-green-600', 'bg-orange-500'].map(c => <span key={c} className={`esfera h-4 w-4 rounded-full ring-2 ring-white ${c}`} />)}
              </span>
              <span className="text-xs font-semibold text-slate-500">4 Houses compitiendo</span>
            </div>
          </div>
        </div>

      </aside>

      {/* Área Principal con Barra Superior Móvil */}
      {/* While the phone menu is open, the page behind it is inactive too. */}
      <div inert={isMobileMenuOpen} className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Cabecera superior solo visible en celulares */}
        <header className="md:hidden h-16 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between flex-shrink-0 z-10">
          <button 
            ref={botonAbrir}
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={isMobileMenuOpen}
            aria-controls="menu-principal"
            className="p-2 rounded-xl bg-white/80 text-slate-700 shadow-sm ring-1 ring-slate-200/80 hover:bg-white transition-colors"
          >
            <Menu className="w-6 h-6" aria-hidden="true" />
          </button>
          <span className="font-extrabold text-slate-900">Olimpiadas 360°</span>
          <div className="w-10"></div> {/* Espaciador simétrico */}
        </header>

        {/* Área de Contenido Principal */}
        <main className="flex-1 overflow-y-auto relative p-4 md:p-8">
          <BannerInnova />
          {/* The key resets the error when switching tabs, so one failed page doesn't block the rest. */}
          {/* Each section enters softly when chosen in the menu. */}
          <div key={activeTab} className="motion-safe:animate-[entrar_0.45s_ease-out_backwards]">
          <PageErrorBoundary key={activeTab}>
            <Suspense fallback={<p role="status" className="py-12 text-center text-slate-500">Cargando…</p>}>
              {renderContent()}
            </Suspense>
          </PageErrorBoundary>
          </div>
        </main>

      </div>
    </div>
  );
}