import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, MapPin, Hotel, UtensilsCrossed,
  Calendar, ClipboardList, Globe, Lightbulb, MoreHorizontal,
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: 'resumen',       label: 'Resumen',       icon: LayoutDashboard },
  { id: 'itinerario',    label: 'Itinerario',     icon: MapPin },
  { id: 'hoteles',       label: 'Hoteles',        icon: Hotel },
  { id: 'restaurantes',  label: 'Restaurantes',   icon: UtensilsCrossed },
  { id: 'todos',         label: 'Tareas',         icon: ClipboardList },
  { id: 'calendario',    label: 'Calendario',     icon: Calendar },
  { id: 'sugerencias',   label: 'Sugerencias',    icon: Lightbulb },
  { id: 'otros-viajes',  label: 'Otros Viajes',   icon: Globe },
];

const bottomNavPrimary = [
  { id: 'resumen',      label: 'Resumen',      icon: LayoutDashboard },
  { id: 'itinerario',   label: 'Itinerario',   icon: MapPin },
  { id: 'hoteles',      label: 'Hoteles',      icon: Hotel },
  { id: 'restaurantes', label: 'Restaurantes', icon: UtensilsCrossed },
];

const bottomSheetItems = [
  { id: 'todos',        label: 'Tareas',        icon: ClipboardList },
  { id: 'calendario',   label: 'Calendario',    icon: Calendar },
  { id: 'sugerencias',  label: 'Sugerencias',   icon: Lightbulb },
  { id: 'otros-viajes', label: 'Otros Viajes',  icon: Globe },
];

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const navigate = (id: string) => {
    onSectionChange(id);
    setSheetOpen(false);
  };

  const isMoreActive = bottomSheetItems.some((i) => i.id === activeSection);

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className="hidden lg:flex fixed top-0 left-0 h-full w-64 flex-col seigaiha-pattern"
        style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderRight: '1px solid rgba(255,255,255,0.45)',
          boxShadow: '2px 0 24px rgba(0,0,0,0.10)',
        }}
      >
        <div className="p-5 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #0e7490 0%, #be185d 100%)' }}
            >
              <span className="text-white font-black text-sm" style={{ fontFamily: 'Noto Sans JP, sans-serif' }}>JP</span>
            </div>
            <div>
              <h1
                className="text-base font-bold leading-tight"
                style={{
                  background: 'linear-gradient(90deg, #0e7490 0%, #be185d 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Japan Trip
              </h1>
              <p className="text-xs" style={{ color: '#a0aec0' }}>Diciembre 2026</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-thin">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all min-h-[44px]"
                style={
                  isActive
                    ? { background: 'rgba(190,24,93,0.07)', border: '1px solid rgba(190,24,93,0.18)', color: '#c94060' }
                    : { background: 'transparent', border: '1px solid transparent', color: '#718096' }
                }
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.color = '#1e2a3a';
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.color = '#718096';
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }
                }}
              >
                <Icon size={18} style={{ color: isActive ? '#c94060' : undefined, strokeWidth: 1.75 }} />
                <span className="text-sm font-medium">{item.label}</span>
                {isActive && (
                  <div
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: '#c94060', boxShadow: '0 0 6px rgba(190,24,93,0.4)' }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
          <div
            className="p-3 rounded-xl border"
            style={{
              background: 'linear-gradient(135deg, rgba(14,116,144,0.06) 0%, rgba(190,24,93,0.06) 100%)',
              borderColor: 'rgba(0,0,0,0.07)',
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: '#a0aec0' }}>Viaje</p>
            <p
              className="text-xs font-bold"
              style={{
                background: 'linear-gradient(90deg, #0e7490 0%, #be185d 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Japón · Dic 2026
            </p>
          </div>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderTop: '1px solid rgba(255,255,255,0.60)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.10)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-stretch">
          {bottomNavPrimary.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] transition-all duration-150 relative"
                style={{ color: isActive ? '#be185d' : '#94a3b8' }}
              >
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg,#0e7490,#be185d)' }}
                  />
                )}
                <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} style={{ color: isActive ? '#be185d' : '#94a3b8' }} />
                <span className="text-[10px] font-semibold leading-none" style={{ color: isActive ? '#be185d' : '#94a3b8' }}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* "Más" button */}
          <button
            onClick={() => setSheetOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] transition-all duration-150 relative"
            style={{ color: isMoreActive || sheetOpen ? '#be185d' : '#94a3b8' }}
          >
            {isMoreActive && !sheetOpen && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                style={{ background: 'linear-gradient(90deg,#0e7490,#be185d)' }}
              />
            )}
            <MoreHorizontal
              size={22}
              strokeWidth={isMoreActive || sheetOpen ? 2.25 : 1.75}
              style={{ color: isMoreActive || sheetOpen ? '#be185d' : '#94a3b8' }}
            />
            <span
              className="text-[10px] font-semibold leading-none"
              style={{ color: isMoreActive || sheetOpen ? '#be185d' : '#94a3b8' }}
            >
              Más
            </span>
          </button>
        </div>
      </nav>

      {/* ── BOTTOM SHEET ── */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="lg:hidden fixed inset-0 z-[60]"
              style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setSheetOpen(false)}
            />

            {/* Sheet panel */}
            <motion.div
              key="sheet"
              className="lg:hidden fixed left-0 right-0 z-[61] rounded-t-3xl"
              style={{
                bottom: 0,
                background: 'rgba(255,255,255,0.94)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                borderTop: '1px solid rgba(255,255,255,0.70)',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)',
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(0,0,0,0.15)' }} />
              </div>

              {/* Section title */}
              <p className="text-[11px] font-bold uppercase tracking-widest px-6 pt-3 pb-1" style={{ color: '#94a3b8' }}>
                Más secciones
              </p>

              {/* Menu items */}
              <div className="px-3">
                {bottomSheetItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => navigate(item.id)}
                      className="w-full flex items-center gap-4 px-4 rounded-2xl transition-colors"
                      style={{
                        paddingTop: 14,
                        paddingBottom: 14,
                        color: isActive ? '#be185d' : '#1e293b',
                        background: isActive ? 'rgba(190,24,93,0.06)' : 'transparent',
                        borderBottom: idx < bottomSheetItems.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                      }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          background: isActive
                            ? 'rgba(190,24,93,0.10)'
                            : 'rgba(0,0,0,0.05)',
                        }}
                      >
                        <Icon size={20} strokeWidth={1.75} style={{ color: isActive ? '#be185d' : '#475569' }} />
                      </div>
                      <span className="text-base font-semibold">{item.label}</span>
                      {isActive && (
                        <div
                          className="ml-auto w-2 h-2 rounded-full"
                          style={{ background: '#be185d', boxShadow: '0 0 6px rgba(190,24,93,0.5)' }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
