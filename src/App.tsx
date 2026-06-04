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
import { TodoProvider } from './lib/TodoContext';
import { AdminProvider } from './lib/AdminContext';

function App() {
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
        return <Itinerario initialCityId={initialCity} initialDayDate={initialDayDate} />;
      case 'calendario':
        return <CalendarioReservas />;
      case 'hoteles':
        return <Hoteles />;
      case 'restaurantes':
        return <Restaurantes />;
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

  return (
    <AdminProvider>
      <TodoProvider>
      <div className="min-h-screen relative" style={{ backgroundColor: '#8ab4cc' }}>
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/image.png')`, opacity: 0.90 }}
        />
        <div
          className="fixed inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(10,30,60,0.08) 0%, transparent 40%, rgba(10,30,60,0.12) 100%)' }}
        />

        <div className="relative flex">
          <Sidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
          <main className="flex-1 lg:ml-64 min-h-screen">
            <div className="container mx-auto px-4 py-6 pb-24 lg:pb-10 lg:px-8 lg:py-10 max-w-4xl">
              {renderSection()}
            </div>
          </main>
        </div>
      </div>
      </TodoProvider>
    </AdminProvider>
  );
}

export default App;
