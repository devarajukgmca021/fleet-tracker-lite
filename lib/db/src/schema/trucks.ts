import { pgTable, serial, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trucksTable = pgTable("trucks", {
  id: serial("id").primaryKey(),
  registrationNumber: text("registration_number").notNull().unique(),
  model: text("model").notNull(),
  capacity: numeric("capacity", { precision: 10, scale: 2 }).notNull(),
  fuelType: text("fuel_type").notNull().default("diesel"),
  status: text("status").notNull().default("available"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTruckSchema = createInsertSchema(trucksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTruck = z.infer<typeof insertTruckSchema>;
export type Truck = typeof trucksTable.$inferSelect;
