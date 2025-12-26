import { Router } from "express";
import { generateInvoice } from "@controllers/invoice/generateInvoice";
import { auth } from "@middleware/auth";

const router = Router();

router.get("/:orderId", auth, generateInvoice);
export default router;
