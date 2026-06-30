import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, tripLocationsTable, tripsTable, trucksTable, driversTable } from "@workspace/db";
import {
  GetTripLocationsParams,
  AddTripLocationParams,
  AddTripLocationBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/trips/:id/locations", async (req, res): Promise<void> => {
  const params = GetTripLocationsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const locations = await db.select()
    .from(tripLocationsTable)
    .where(eq(tripLocationsTable.tripId, params.data.id))
    .orderBy(tripLocationsTable.recordedAt);

  res.json(locations.map(l => ({
    ...l,
    lat: Number(l.lat),
    lng: Number(l.lng),
    speed: l.speed != null ? Number(l.speed) : null,
    recordedAt: l.recordedAt.toISOString(),
  })));
});

router.post("/trips/:id/locations", async (req, res): Promise<void> => {
  const params = AddTripLocationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AddTripLocationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [loc] = await db.insert(tripLocationsTable).values({
    tripId: params.data.id,
    lat: String(parsed.data.lat),
    lng: String(parsed.data.lng),
    speed: parsed.data.speed != null ? String(parsed.data.speed) : null,
  }).returning();
  res.status(201).json({
    ...loc,
    lat: Number(loc.lat),
    lng: Number(loc.lng),
    speed: loc.speed != null ? Number(loc.speed) : null,
    recordedAt: loc.recordedAt.toISOString(),
  });
});

router.get("/tracking/live", async (_req, res): Promise<void> => {
  const activeTrips = await db.select().from(tripsTable).where(eq(tripsTable.status, "running"));

  const liveData = await Promise.all(activeTrips.map(async (trip) => {
    const [latestLoc] = await db.select()
      .from(tripLocationsTable)
      .where(eq(tripLocationsTable.tripId, trip.id))
      .orderBy(desc(tripLocationsTable.recordedAt))
      .limit(1);

    if (!latestLoc) return null;

    let truckReg = "Unknown";
    let driverName = "Unknown";
    if (trip.truckId) {
      const [truck] = await db.select({ reg: trucksTable.registrationNumber }).from(trucksTable).where(eq(trucksTable.id, trip.truckId));
      truckReg = truck?.reg ?? "Unknown";
    }
    if (trip.driverId) {
      const [driver] = await db.select({ name: driversTable.name }).from(driversTable).where(eq(driversTable.id, trip.driverId));
      driverName = driver?.name ?? "Unknown";
    }

    return {
      tripId: trip.id,
      truckId: trip.truckId,
      truckRegistration: truckReg,
      driverName,
      lat: Number(latestLoc.lat),
      lng: Number(latestLoc.lng),
      speed: latestLoc.speed != null ? Number(latestLoc.speed) : null,
      status: trip.status,
      recordedAt: latestLoc.recordedAt.toISOString(),
    };
  }));

  res.json(liveData.filter(Boolean));
});

export default router;
