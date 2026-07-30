import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

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

export interface TripActivity {
  id: string;
  tripId: string;
  date: string;
  time: string;
  location: string;
  note: string;
}

export interface TripReservation {
  id: string;
  tripId: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  notes: string;
}

const DEFAULT_THEME: TripTheme = {
  accentColor: '#0e7490',
  accentGradient: 'linear-gradient(135deg, #0e7490 0%, #0284c7 100%)',
  bgColor: '#e2e8f0',
  bgImage: '',
  bgOpacity: 0,
  sidebarActive: '#0e7490',
  sidebarActiveBg: 'rgba(14,116,144,0.07)',
  cardGlow: 'rgba(14, 116, 144, 0.08)',
};

const JAPAN_TRIP: Trip = {
  id: 'japan-2026',
  title: 'Japan Trip',
  destination: 'Japón',
  startDate: '2026-12-04',
  endDate: '2026-12-14',
  cities: ['Osaka', 'Kioto', 'Tokio'],
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
};

const LS_KEY = 'trips_store';
const LS_ACTIVITIES = 'trip_activities';
const LS_RESERVATIONS = 'trip_reservations';

function loadTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const stored: Trip[] = JSON.parse(raw);
      const hasJapan = stored.some((t) => t.id === 'japan-2026');
      if (!hasJapan) return [JAPAN_TRIP, ...stored];
      return stored;
    }
  } catch { /* ignore */ }
  return [JAPAN_TRIP];
}

function persistTrips(trips: Trip[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(trips));
}

function loadActivities(): TripActivity[] {
  try {
    const raw = localStorage.getItem(LS_ACTIVITIES);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persistActivities(items: TripActivity[]) {
  localStorage.setItem(LS_ACTIVITIES, JSON.stringify(items));
}

function loadReservations(): TripReservation[] {
  try {
    const raw = localStorage.getItem(LS_RESERVATIONS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persistReservations(items: TripReservation[]) {
  localStorage.setItem(LS_RESERVATIONS, JSON.stringify(items));
}

export { DEFAULT_THEME };

interface TripContextValue {
  trips: Trip[];
  activeTrip: Trip | null;
  setActiveTrip: (trip: Trip | null) => void;
  addTrip: (trip: Omit<Trip, 'id' | 'theme'>) => void;
  updateTrip: (id: string, data: Partial<Trip>) => void;
  activities: TripActivity[];
  addActivity: (activity: Omit<TripActivity, 'id'>) => void;
  deleteActivity: (id: string) => void;
  reservations: TripReservation[];
  addReservation: (reservation: Omit<TripReservation, 'id'>) => void;
  deleteReservation: (id: string) => void;
}

const TripContext = createContext<TripContextValue>({
  trips: [],
  activeTrip: null,
  setActiveTrip: () => {},
  addTrip: () => {},
  updateTrip: () => {},
  activities: [],
  addActivity: () => {},
  deleteActivity: () => {},
  reservations: [],
  addReservation: () => {},
  deleteReservation: () => {},
});

export function TripProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>(loadTrips);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [activities, setActivities] = useState<TripActivity[]>(loadActivities);
  const [reservations, setReservations] = useState<TripReservation[]>(loadReservations);

  const addTrip = useCallback((data: Omit<Trip, 'id' | 'theme'>) => {
    const newTrip: Trip = {
      ...data,
      id: `trip-${Date.now()}`,
      theme: DEFAULT_THEME,
    };
    setTrips((prev) => {
      const updated = [...prev, newTrip];
      persistTrips(updated);
      return updated;
    });
  }, []);

  const updateTrip = useCallback((id: string, data: Partial<Trip>) => {
    setTrips((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...data } : t));
      persistTrips(updated);
      return updated;
    });
    setActiveTrip((prev) => (prev && prev.id === id ? { ...prev, ...data } : prev));
  }, []);

  const addActivity = useCallback((activity: Omit<TripActivity, 'id'>) => {
    const item: TripActivity = { ...activity, id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    setActivities((prev) => {
      const updated = [...prev, item];
      persistActivities(updated);
      return updated;
    });
  }, []);

  const deleteActivity = useCallback((id: string) => {
    setActivities((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      persistActivities(updated);
      return updated;
    });
  }, []);

  const addReservation = useCallback((reservation: Omit<TripReservation, 'id'>) => {
    const item: TripReservation = { ...reservation, id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    setReservations((prev) => {
      const updated = [...prev, item];
      persistReservations(updated);
      return updated;
    });
  }, []);

  const deleteReservation = useCallback((id: string) => {
    setReservations((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      persistReservations(updated);
      return updated;
    });
  }, []);

  return (
    <TripContext.Provider value={{ trips, activeTrip, setActiveTrip, addTrip, updateTrip, activities, addActivity, deleteActivity, reservations, addReservation, deleteReservation }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrips() {
  return useContext(TripContext);
}
