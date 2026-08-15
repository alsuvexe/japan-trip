import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Resumen from './components/sections/Resumen';
import Itinerario from './components/sections/Itinerario';
import Hoteles from './components/sections/Hoteles';
import Restaurantes from './components/sections/Restaurantes';
import CalendarioReservas from './components/sections/CalendarioReservas';
import TodoList from './components/sections/TodoList';
import OtrosViajes from './components/sections/OtrosViajes';
import SugerenciasFamiliares from './components/sections/SugerenciasFamiliares';
import Dashboard from './components/Dashboard';
import GenericTripView from './components/GenericTripView';
import { TodoProvider } from './lib/TodoContext';
import { AdminProvider } from './lib/AdminContext';
import { TripProvider, useTrips } from './lib/TripContext';
import { ReadOnlyProvider, useReadOnly } from './lib/ReadOnlyContext';
import { BookOpen } from 'lucide-react';

function JapanTripView() {
  const { activeTrip, setActiveTrip } = useTrips();
  const [activeSection, setActiveSection] = useState('resumen');
  const [initialCity, setInitialCity] = useState<string | undefined>(undefined);
  const [initialDayDate, setInitialDayDate] = useState<string | undefined>(undefined);

  const handleSectionChange = (section: string, city?: string, dayDate?: string) => {
    setInitialCity(city);
    setInitialDayDate(dayDate);
    setActiveSection(section);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'resumen':
        return <Resumen onSectionChange={handleSectionChange} />;
      case 'itinerario':
        return <Itinerario initialCityId={initialCity} initialDayDate={initialDayDate} onNavigateHome={() => setActiveSection('resumen')} />;
      case 'calendario':
        return <CalendarioReservas />;
      case 'hoteles':
        return <Hoteles />;
      case 'restaurantes':
        return <Restaurantes onSectionChange={handleSectionChange} />;
      case 'todos':
        return <TodoList />;
      case 'otros-viajes':
        return <OtrosViajes />;
      case 'sugerencias':
        return <SugerenciasFamiliares />;
      default:
        return <Resumen onSectionChange={handleSectionChange} />;
    }
  };

  const theme = activeTrip?.theme;

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: theme?.bgColor || '#8ab4cc' }}>
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('${theme?.bgImage || '/image.png'}')`, opacity: theme?.bgOpacity ?? 0.9 }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(10,30,60,0.08) 0%, transparent 40%, rgba(10,30,60,0.12) 100%)' }}
      />

      <div className="relative flex">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onBackToDashboard={() => setActiveTrip(null)}
          tripTitle={activeTrip?.title}
          tripSubtitle={activeTrip?.destination}
          theme={theme}
        />
        <main className="flex-1 lg:ml-64 min-h-screen">
          <div className="container mx-auto px-4 pt-16 pb-24 lg:pt-10 lg:pb-10 lg:px-8 max-w-4xl">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}

function GenericTripDetailView() {
  const { activeTrip, setActiveTrip } = useTrips();
  const [activeSection, setActiveSection] = useState('resumen');
  const theme = activeTrip?.theme;

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: theme?.bgColor || '#e2e8f0' }}>
      {activeTrip?.coverImage && (
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${activeTrip.coverImage}')`, opacity: 0.15 }}
        />
      )}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(10,30,60,0.04) 0%, transparent 40%, rgba(10,30,60,0.06) 100%)' }}
      />

      <div className="relative flex">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onBackToDashboard={() => setActiveTrip(null)}
          tripTitle={activeTrip?.title}
          tripSubtitle={activeTrip?.destination}
          theme={theme}
        />
        <main className="flex-1 lg:ml-64 min-h-screen">
          <div className="container mx-auto px-4 pt-16 pb-24 lg:pt-10 lg:pb-10 lg:px-8 max-w-4xl">
            <GenericTripView activeSection={activeSection} onSectionChange={setActiveSection} />
          </div>
        </main>
      </div>
    </div>
  );
}

function ReadOnlyBanner() {
  const isReadOnly = useReadOnly();
  if (!isReadOnly) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium text-slate-700 bg-amber-50/95 border-b border-amber-200 backdrop-blur-sm">
      <BookOpen size={15} className="text-amber-600" />
      <span>Modo lectura - Guía de viaje</span>
    </div>
  );
}

function AppRouter() {
  const { activeTrip } = useTrips();

  if (!activeTrip) {
    return <Dashboard />;
  }

  if (activeTrip.id === 'japan-2026') {
    return <JapanTripView />;
  }

  return <GenericTripDetailView />;
}

function App() {
  return (
    <ReadOnlyProvider>
      <AdminProvider>
        <TripProvider>
          <TodoProvider>
            <ReadOnlyBanner />
            <AppRouter />
          </TodoProvider>
        </TripProvider>
      </AdminProvider>
    </ReadOnlyProvider>
  );
}

export default App;
