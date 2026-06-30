import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import trucksRouter from "./trucks";
import driversRouter from "./drivers";
import tripsRouter from "./trips";
import trackingRouter from "./tracking";
import alertsRouter from "./alerts";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(trucksRouter);
router.use(driversRouter);
router.use(tripsRouter);
router.use(trackingRouter);
router.use(alertsRouter);
router.use(dashboardRouter);

export default router;
