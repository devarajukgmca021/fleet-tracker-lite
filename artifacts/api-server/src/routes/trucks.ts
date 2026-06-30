import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, trucksTable } from "@workspace/db";
import {
  ListTrucksQueryParams,
  CreateTruckBody,
  GetTruckParams,
  UpdateTruckParams,
  UpdateTruckBody,
  DeleteTruckParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/trucks", async (req, res): Promise<void> => {
  const query = ListTrucksQueryParams.safeParse(req.query);
  let trucks;
  if (query.success && query.data.status) {
    trucks = await db.select().from(trucksTable).where(eq(trucksTable.status, query.data.status));
  } else {
    trucks = await db.select().from(trucksTable).orderBy(trucksTable.createdAt);
  }
  res.json(trucks.map(t => ({
    ...t,
    capacity: Number(t.capacity),
    updatedAt: t.updatedAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
  })));
});

router.post("/trucks", async (req, res): Promise<void> => {
  const parsed = CreateTruckBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [truck] = await db.insert(trucksTable).values({
    ...parsed.data,
    capacity: String(parsed.data.capacity),
    status: "available",
  }).returning();
  res.status(201).json({
    ...truck,
    capacity: Number(truck.capacity),
    updatedAt: truck.updatedAt?.toISOString() ?? null,
    createdAt: truck.createdAt.toISOString(),
  });
});

router.get("/trucks/:id", async (req, res): Promise<void> => {
  const params = GetTruckParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [truck] = await db.select().from(trucksTable).where(eq(trucksTable.id, params.data.id));
  if (!truck) {
    res.status(404).json({ error: "Truck not found" });
    return;
  }
  res.json({
    ...truck,
    capacity: Number(truck.capacity),
    updatedAt: truck.updatedAt?.toISOString() ?? null,
    createdAt: truck.createdAt.toISOString(),
  });
});

router.put("/trucks/:id", async (req, res): Promise<void> => {
  const params = UpdateTruckParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTruckBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.capacity !== undefined) {
    updateData.capacity = String(parsed.data.capacity);
  }
  const [truck] = await db.update(trucksTable).set(updateData).where(eq(trucksTable.id, params.data.id)).returning();
  if (!truck) {
    res.status(404).json({ error: "Truck not found" });
    return;
  }
  res.json({
    ...truck,
    capacity: Number(truck.capacity),
    updatedAt: truck.updatedAt?.toISOString() ?? null,
    createdAt: truck.createdAt.toISOString(),
  });
});

router.delete("/trucks/:id", async (req, res): Promise<void> => {
  const params = DeleteTruckParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [truck] = await db.delete(trucksTable).where(eq(trucksTable.id, params.data.id)).returning();
  if (!truck) {
    res.status(404).json({ error: "Truck not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
