import { Router } from "express";
import { dashboardOverview, todayReport, todaySellerReport } from "@controllers/dashborad/index";
import { auth } from "@middleware/auth";


const router = Router();
router.get("/overview", auth, dashboardOverview);
router.get("/today-report", auth, todayReport);
router.get("/today-seller-report", auth, todaySellerReport);

export default router;