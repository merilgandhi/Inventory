import { Router } from "express";
import { pagination } from "@middleware/pagination";
import { auth } from "@middleware/auth";
import { listProductVariations } from "@controllers/productVariation";

const router = Router();

router.get("/", auth, pagination, listProductVariations);

export default router;
