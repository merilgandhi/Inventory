import express from "express";
import { checkBarcode, createProductFromScan, createOrderFromScan, scanBarcode } from "@controllers/orders/index";
import { createNewProductSchema, createOrderFromScanSchema } from "@controllers/orders/validator";
import { auth } from "@middleware/auth";
import { validate } from "@middleware/validate";


const router = express.Router();



router.get("/:barcode", checkBarcode);
router.post("/add-new", auth, validate(createNewProductSchema), createProductFromScan);
//router.post("/create-order", auth, validate(createOrderFromScanSchema), createOrderFromScan);
router.post("/", auth, scanBarcode);



export default router;

