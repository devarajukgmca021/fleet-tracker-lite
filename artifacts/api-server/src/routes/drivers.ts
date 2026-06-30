import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, driversTable } from "@workspace/db";
import {
  ListDriversQueryParams,
  CreateDriverBody,
  GetDriverParams,
  UpdateDriverParams,
  UpdateDriverBody,
  DeleteDriverParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/drivers", async (req, res): Promise<void> => {
  const query = ListDriversQueryParams.safeParse(req.query);
  let drivers;
  if (query.success && query.data.available !== undefined) {
    drivers = await db.select().from(driversTable).where(eq(driversTable.isAvailable, query.data.available));
  } else {
    drivers = await db.select().from(driversTable).orderBy(driversTable.createdAt);
  }
  res.json(drivers.map(d => ({
    ...d,
    updatedAt: d.updatedAt?.toISOString() ?? null,
    createdAt: d.createdAt.toISOString(),
  })));
});

router.post("/drivers", async (req, res): Promise<void> => {
  const parsed = CreateDriverBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [driver] = await db.insert(driversTable).values({
    ...parsed.data,
    isAvailable: true,
  }).returning();
  res.status(201).json({
    ...driver,
    updatedAt: driver.updatedAt?.toISOString() ?? null,
    createdAt: driver.createdAt.toISOString(),
  });
});

router.get("/drivers/:id", async (req, res): Promise<void> => {
  const params = GetDriverParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [driver] = await db.select().from(driversTable).where(eq(driversTable.id, params.data.id));
  if (!driver) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }
  res.json({
    ...driver,
    updatedAt: driver.updatedAt?.toISOString() ?? null,
    createdAt: driver.createdAt.toISOString(),
  });
});

router.put("/drivers/:id", async (req, res): Promise<void> => {
  const params = UpdateDriverParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDriverBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [driver] = await db.update(driversTable).set(parsed.data).where(eq(driversTable.id, params.data.id)).returning();
  if (!driver) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }
  res.json({
    ...driver,
    updatedAt: driver.updatedAt?.toISOString() ?? null,
    createdAt: driver.createdAt.toISOString(),
  });
});

router.delete("/drivers/:id", async (req, res): Promise<void> => {
  const params = DeleteDriverParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [driver] = await db.delete(driversTable).where(eq(driversTable.id, params.data.id)).returning();
  if (!driver) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
