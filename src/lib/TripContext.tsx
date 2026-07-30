import { createContext, useContext, useState, type ReactNode } from 'react';

export interface TripTheme {
  accentColor: string;
  accentGradient: string;
  bgColor: string;
  bgImage: string;
  bgOpacity: number;
  sidebarActive: string;
  sidebarActiveBg: string;
  cardGlow: string;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  cities: string[];
  status: 'upcoming' | 'in_progress' | 'completed';
  coverImage: string;
  theme: TripTheme;
}

export const TRIPS: Trip[] = [
  {
    id: 'japan-2026',
    title: 'Japan Trip',
    destination: 'Japón',
    startDate: '2026-12-19',
    endDate: '2027-01-03',
    cities: ['Tokyo', 'Osaka', 'Kyoto', 'Hiroshima', 'Hakone'],
    status: 'upcoming',
    coverImage: '/image.png',
    theme: {
      accentColor: '#be185d',
      accentGradient: 'linear-gradient(135deg, #0e7490 0%, #be185d 100%)',
      bgColor: '#8ab4cc',
      bgImage: '/image.png',
      bgOpacity: 0.9,
      sidebarActive: '#c94060',
      sidebarActiveBg: 'rgba(190,24,93,0.07)',
      cardGlow: 'rgba(14, 116, 144, 0.08)',
    },
  },
];

interface TripContextValue {
  trips: Trip[];
  activeTrip: Trip | null;
  setActiveTrip: (trip: Trip | null) => void;
}

const TripContext = createContext<TripContextValue>({
  trips: TRIPS,
  activeTrip: null,
  setActiveTrip: () => {},
});

export function TripProvider({ children }: { children: ReactNode }) {
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);

  return (
    <TripContext.Provider value={{ trips: TRIPS, activeTrip, setActiveTrip }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrips() {
  return useContext(TripContext);
}
