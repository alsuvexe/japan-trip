/*
# Enable realtime for generic trip tables

Adds the three generic trip tables to the Supabase realtime publication
so that changes are pushed to all connected clients instantly.
*/

ALTER PUBLICATION supabase_realtime ADD TABLE generic_trips;
ALTER PUBLICATION supabase_realtime ADD TABLE generic_trip_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE generic_trip_reservations;
