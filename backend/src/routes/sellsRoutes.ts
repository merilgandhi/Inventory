import { Router } from "express";
import { createOrder } from "@controllers/orders/index";
import { createOrderSchema } from "@controllers/orders/validator";
import { auth } from "@middleware/auth";
import { validate } from "@middleware/validate";

const router = Router();


router.post("/sell", auth, validate(createOrderSchema), createOrder);

export default router;
