import express from "express";
import { checkBarcode, createProductFromScan} from "@controllers/orders/index";
import { createNewProductSchema } from "@controllers/orders/validator";
import { auth } from "@middleware/auth";
import { validate } from "@middleware/validate";


const router = express.Router();

router.get("/:barcode", checkBarcode);
router.post("/add-new", auth, validate(createNewProductSchema), createProductFromScan);

export default router;
