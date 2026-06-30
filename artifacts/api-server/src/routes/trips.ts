import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, tripsTable, trucksTable, driversTable, alertsTable } from "@workspace/db";
import {
  ListTripsQueryParams,
  CreateTripBody,
  GetTripParams,
  UpdateTripParams,
  UpdateTripBody,
  DeleteTripParams,
  StartTripParams,
  CompleteTripParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeTrip(trip: Record<string, unknown>, truckReg?: string | null, driverName?: string | null) {
  return {
    ...trip,
    pickupLat: trip.pickupLat != null ? Number(trip.pickupLat) : null,
    pickupLng: trip.pickupLng != null ? Number(trip.pickupLng) : null,
    destLat: trip.destLat != null ? Number(trip.destLat) : null,
    destLng: trip.destLng != null ? Number(trip.destLng) : null,
    distanceCovered: trip.distanceCovered != null ? Number(trip.distanceCovered) : null,
    truckRegistration: truckReg ?? null,
    driverName: driverName ?? null,
    createdAt: trip.createdAt instanceof Date ? trip.createdAt.toISOString() : trip.createdAt,
    startedAt: trip.startedAt instanceof Date ? trip.startedAt.toISOString() : (trip.startedAt ?? null),
    completedAt: trip.completedAt instanceof Date ? trip.completedAt.toISOString() : (trip.completedAt ?? null),
  };
}

async function enrichTrip(trip: typeof tripsTable.$inferSelect) {
  let truckReg: string | null = null;
  let driverName: string | null = null;
  if (trip.truckId) {
    const [truck] = await db.select({ reg: trucksTable.registrationNumber }).from(trucksTable).where(eq(trucksTable.id, trip.truckId));
    truckReg = truck?.reg ?? null;
  }
  if (trip.driverId) {
    const [driver] = await db.select({ name: driversTable.name }).from(driversTable).where(eq(driversTable.id, trip.driverId));
    driverName = driver?.name ?? null;
  }
  return serializeTrip(trip as unknown as Record<string, unknown>, truckReg, driverName);
}

router.get("/trips", async (req, res): Promise<void> => {
  const query = ListTripsQueryParams.safeParse(req.query);
  const conditions = [];
  if (query.success) {
    if (query.data.status) conditions.push(eq(tripsTable.status, query.data.status));
    if (query.data.driverId) conditions.push(eq(tripsTable.driverId, query.data.driverId));
    if (query.data.truckId) conditions.push(eq(tripsTable.truckId, query.data.truckId));
  }
  const trips = conditions.length > 0
    ? await db.select().from(tripsTable).where(and(...conditions)).orderBy(tripsTable.createdAt)
    : await db.select().from(tripsTable).orderBy(tripsTable.createdAt);

  const enriched = await Promise.all(trips.map(enrichTrip));
  res.json(enriched);
});

router.post("/trips", async (req, res): Promise<void> => {
  const parsed = CreateTripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const insertData: Record<string, unknown> = { ...parsed.data, status: "pending" };
  if (parsed.data.pickupLat !== undefined) insertData.pickupLat = String(parsed.data.pickupLat);
  if (parsed.data.pickupLng !== undefined) insertData.pickupLng = String(parsed.data.pickupLng);
  if (parsed.data.destLat !== undefined) insertData.destLat = String(parsed.data.destLat);
  if (parsed.data.destLng !== undefined) insertData.destLng = String(parsed.data.destLng);

  const [trip] = await db.insert(tripsTable).values(insertData as Parameters<typeof db.insert>[0] extends { values: (v: infer V) => unknown } ? V : never).returning();
  res.status(201).json(await enrichTrip(trip));
});

router.get("/trips/:id", async (req, res): Promise<void> => {
  const params = GetTripParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [trip] = await db.select().from(tripsTable).where(eq(tripsTable.id, params.data.id));
  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  res.json(await enrichTrip(trip));
});

router.put("/trips/:id", async (req, res): Promise<void> => {
  const params = UpdateTripParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTripBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.pickupLat !== undefined) updateData.pickupLat = String(parsed.data.pickupLat);
  if (parsed.data.pickupLng !== undefined) updateData.pickupLng = String(parsed.data.pickupLng);
  if (parsed.data.destLat !== undefined) updateData.destLat = String(parsed.data.destLat);
  if (parsed.data.destLng !== undefined) updateData.destLng = String(parsed.data.destLng);

  const [trip] = await db.update(tripsTable).set(updateData).where(eq(tripsTable.id, params.data.id)).returning();
  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  res.json(await enrichTrip(trip));
});

router.delete("/trips/:id", async (req, res): Promise<void> => {
  const params = DeleteTripParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [trip] = await db.delete(tripsTable).where(eq(tripsTable.id, params.data.id)).returning();
  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  res.sendStatus(204);
});

router.post("/trips/:id/start", async (req, res): Promise<void> => {
  const params = StartTripParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [trip] = await db.update(tripsTable)
    .set({ status: "running", startedAt: new Date() })
    .where(eq(tripsTable.id, params.data.id))
    .returning();
  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  if (trip.truckId) {
    await db.update(trucksTable).set({ status: "running" }).where(eq(trucksTable.id, trip.truckId));
  }
  if (trip.driverId) {
    await db.update(driversTable).set({ isAvailable: false }).where(eq(driversTable.id, trip.driverId));
  }
  await db.insert(alertsTable).values({
    type: "trip_started",
    message: `Trip #${trip.id} from ${trip.pickupLocation} to ${trip.destination} has started`,
    tripId: trip.id,
    truckId: trip.truckId ?? undefined,
    isRead: false,
  });
  res.json(await enrichTrip(trip));
});

router.post("/trips/:id/complete", async (req, res): Promise<void> => {
  const params = CompleteTripParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [trip] = await db.update(tripsTable)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(tripsTable.id, params.data.id))
    .returning();
  if (!trip) {
    res.status(404).json({ error: "Trip not found" });
    return;
  }
  if (trip.truckId) {
    await db.update(trucksTable).set({ status: "available" }).where(eq(trucksTable.id, trip.truckId));
  }
  if (trip.driverId) {
    await db.update(driversTable).set({ isAvailable: true }).where(eq(driversTable.id, trip.driverId));
  }
  await db.insert(alertsTable).values({
    type: "trip_completed",
    message: `Trip #${trip.id} from ${trip.pickupLocation} to ${trip.destination} has been completed`,
    tripId: trip.id,
    truckId: trip.truckId ?? undefined,
    isRead: false,
  });
  res.json(await enrichTrip(trip));
});

export default router;
