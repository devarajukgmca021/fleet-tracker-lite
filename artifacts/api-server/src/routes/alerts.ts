import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, alertsTable } from "@workspace/db";
import { ListAlertsQueryParams, MarkAlertReadParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/alerts", async (req, res): Promise<void> => {
  const query = ListAlertsQueryParams.safeParse(req.query);
  let alerts;
  if (query.success && query.data.unreadOnly) {
    alerts = await db.select().from(alertsTable).where(eq(alertsTable.isRead, false)).orderBy(alertsTable.createdAt);
  } else {
    alerts = await db.select().from(alertsTable).orderBy(alertsTable.createdAt);
  }
  res.json(alerts.map(a => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  })));
});

router.patch("/alerts/:id/read", async (req, res): Promise<void> => {
  const params = MarkAlertReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [alert] = await db.update(alertsTable)
    .set({ isRead: true })
    .where(eq(alertsTable.id, params.data.id))
    .returning();
  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json({ ...alert, createdAt: alert.createdAt.toISOString() });
});

export default router;
