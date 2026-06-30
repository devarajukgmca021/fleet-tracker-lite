import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tripsTable = pgTable("trips", {
  id: serial("id").primaryKey(),
  pickupLocation: text("pickup_location").notNull(),
  pickupLat: numeric("pickup_lat", { precision: 10, scale: 6 }),
  pickupLng: numeric("pickup_lng", { precision: 10, scale: 6 }),
  destination: text("destination").notNull(),
  destLat: numeric("dest_lat", { precision: 10, scale: 6 }),
  destLng: numeric("dest_lng", { precision: 10, scale: 6 }),
  truckId: integer("truck_id"),
  driverId: integer("driver_id"),
  status: text("status").notNull().default("pending"),
  distanceCovered: numeric("distance_covered", { precision: 10, scale: 2 }),
  notes: text("notes"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tripLocationsTable = pgTable("trip_locations", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull(),
  lat: numeric("lat", { precision: 10, scale: 6 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 6 }).notNull(),
  speed: numeric("speed", { precision: 6, scale: 2 }),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTripSchema = createInsertSchema(tripsTable).omit({ id: true, createdAt: true, startedAt: true, completedAt: true });
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof tripsTable.$inferSelect;
export type TripLocation = typeof tripLocationsTable.$inferSelect;
