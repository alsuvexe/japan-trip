import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { supabase } from './supabase';

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

export { DEFAULT_THEME };

function tripToRow(trip: Trip) {
  return {
    id: trip.id,
    title: trip.title,
    destination: trip.destination,
    start_date: trip.startDate,
    end_date: trip.endDate,
    cities: trip.cities,
    status: trip.status,
    cover_image: trip.coverImage,
    theme: trip.theme,
  };
}

function rowToTrip(row: any): Trip {
  return {
    id: row.id,
    title: row.title,
    destination: row.destination,
    startDate: row.start_date,
    endDate: row.end_date,
    cities: Array.isArray(row.cities) ? row.cities : [],
    status: row.status || 'upcoming',
    coverImage: row.cover_image || '',
    theme: row.theme && typeof row.theme === 'object' && row.theme.accentColor ? row.theme : DEFAULT_THEME,
  };
}

function activityToRow(a: TripActivity) {
  return { id: a.id, trip_id: a.tripId, date: a.date, time: a.time, location: a.location, note: a.note };
}

function rowToActivity(row: any): TripActivity {
  return { id: row.id, tripId: row.trip_id, date: row.date, time: row.time || '', location: row.location || '', note: row.note || '' };
}

function reservationToRow(r: TripReservation) {
  return { id: r.id, trip_id: r.tripId, hotel_name: r.hotelName, check_in: r.checkIn, check_out: r.checkOut, notes: r.notes };
}

function rowToReservation(row: any): TripReservation {
  return { id: row.id, tripId: row.trip_id, hotelName: row.hotel_name, checkIn: row.check_in || '', checkOut: row.check_out || '', notes: row.notes || '' };
}

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
  loading: boolean;
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
  loading: true,
});

export function TripProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>([JAPAN_TRIP]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [activities, setActivities] = useState<TripActivity[]>([]);
  const [reservations, setReservations] = useState<TripReservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    async function load() {
      const [tripsRes, activitiesRes, reservationsRes] = await Promise.all([
        supabase.from('generic_trips').select('*').order('created_at', { ascending: true }),
        supabase.from('generic_trip_activities').select('*').order('created_at', { ascending: true }),
        supabase.from('generic_trip_reservations').select('*').order('created_at', { ascending: true }),
      ]);

      const dbTrips = (tripsRes.data || []).map(rowToTrip);
      const hasJapan = dbTrips.some((t) => t.id === 'japan-2026');
      setTrips(hasJapan ? dbTrips : [JAPAN_TRIP, ...dbTrips]);
      setActivities((activitiesRes.data || []).map(rowToActivity));
      setReservations((reservationsRes.data || []).map(rowToReservation));
      setLoading(false);
    }
    load();
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('generic-trips-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'generic_trips' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newTrip = rowToTrip(payload.new);
          setTrips((prev) => {
            if (prev.some((t) => t.id === newTrip.id)) return prev;
            return [...prev, newTrip];
          });
        } else if (payload.eventType === 'UPDATE') {
          const updated = rowToTrip(payload.new);
          setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          setActiveTrip((prev) => (prev && prev.id === updated.id ? updated : prev));
        } else if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as any).id;
          setTrips((prev) => prev.filter((t) => t.id !== deletedId));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'generic_trip_activities' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const item = rowToActivity(payload.new);
          setActivities((prev) => {
            if (prev.some((a) => a.id === item.id)) return prev;
            return [...prev, item];
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as any).id;
          setActivities((prev) => prev.filter((a) => a.id !== deletedId));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'generic_trip_reservations' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const item = rowToReservation(payload.new);
          setReservations((prev) => {
            if (prev.some((r) => r.id === item.id)) return prev;
            return [...prev, item];
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedId = (payload.old as any).id;
          setReservations((prev) => prev.filter((r) => r.id !== deletedId));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const addTrip = useCallback((data: Omit<Trip, 'id' | 'theme'>) => {
    const newTrip: Trip = {
      ...data,
      id: `trip-${Date.now()}`,
      theme: DEFAULT_THEME,
    };
    setTrips((prev) => [...prev, newTrip]);
    supabase.from('generic_trips').insert(tripToRow(newTrip)).then();
  }, []);

  const updateTrip = useCallback((id: string, data: Partial<Trip>) => {
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    setActiveTrip((prev) => (prev && prev.id === id ? { ...prev, ...data } : prev));

    const row: Record<string, any> = {};
    if (data.title !== undefined) row.title = data.title;
    if (data.destination !== undefined) row.destination = data.destination;
    if (data.startDate !== undefined) row.start_date = data.startDate;
    if (data.endDate !== undefined) row.end_date = data.endDate;
    if (data.cities !== undefined) row.cities = data.cities;
    if (data.status !== undefined) row.status = data.status;
    if (data.coverImage !== undefined) row.cover_image = data.coverImage;
    if (data.theme !== undefined) row.theme = data.theme;

    if (Object.keys(row).length > 0) {
      supabase.from('generic_trips').update(row).eq('id', id).then();
    }
  }, []);

  const addActivity = useCallback((activity: Omit<TripActivity, 'id'>) => {
    const item: TripActivity = { ...activity, id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    setActivities((prev) => [...prev, item]);
    supabase.from('generic_trip_activities').insert(activityToRow(item)).then();
  }, []);

  const deleteActivity = useCallback((id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
    supabase.from('generic_trip_activities').delete().eq('id', id).then();
  }, []);

  const addReservation = useCallback((reservation: Omit<TripReservation, 'id'>) => {
    const item: TripReservation = { ...reservation, id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    setReservations((prev) => [...prev, item]);
    supabase.from('generic_trip_reservations').insert(reservationToRow(item)).then();
  }, []);

  const deleteReservation = useCallback((id: string) => {
    setReservations((prev) => prev.filter((r) => r.id !== id));
    supabase.from('generic_trip_reservations').delete().eq('id', id).then();
  }, []);

  return (
    <TripContext.Provider value={{ trips, activeTrip, setActiveTrip, addTrip, updateTrip, activities, addActivity, deleteActivity, reservations, addReservation, deleteReservation, loading }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrips() {
  return useContext(TripContext);
}
