import { Router, type IRouter } from "express";
import { eq, count, sql } from "drizzle-orm";
import { db, trucksTable, driversTable, tripsTable, alertsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const [totalTrucksResult] = await db.select({ count: count() }).from(trucksTable);
  const [availableTrucksResult] = await db.select({ count: count() }).from(trucksTable).where(eq(trucksTable.status, "available"));
  const [runningTripsResult] = await db.select({ count: count() }).from(tripsTable).where(eq(tripsTable.status, "running"));
  const [completedTripsResult] = await db.select({ count: count() }).from(tripsTable).where(eq(tripsTable.status, "completed"));
  const [activeDriversResult] = await db.select({ count: count() }).from(driversTable).where(eq(driversTable.isAvailable, false));
  const [unreadAlertsResult] = await db.select({ count: count() }).from(alertsTable).where(eq(alertsTable.isRead, false));

  const monthlyTripsRaw = await db.execute(
    sql`SELECT TO_CHAR(created_at, 'Mon YYYY') as month, COUNT(*) as count FROM trips WHERE created_at >= NOW() - INTERVAL '12 months' GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at) ORDER BY DATE_TRUNC('month', created_at)`
  );

  const truckUtilizationRaw = await db.select({ status: trucksTable.status, count: count() }).from(trucksTable).groupBy(trucksTable.status);

  res.json({
    totalTrucks: totalTrucksResult.count,
    availableTrucks: availableTrucksResult.count,
    runningTrips: runningTripsResult.count,
    completedTrips: completedTripsResult.count,
    activeDrivers: activeDriversResult.count,
    delayedTrips: 0,
    unreadAlerts: unreadAlertsResult.count,
    monthlyTrips: (monthlyTripsRaw.rows as Array<{ month: string; count: string }>).map(r => ({
      month: r.month,
      count: Number(r.count),
    })),
    truckUtilization: truckUtilizationRaw.map(r => ({
      status: r.status,
      count: r.count,
    })),
  });
});

export default router;
