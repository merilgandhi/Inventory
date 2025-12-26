import { Request, Response } from "express";
import { buildInvoicePdf } from "@utils/invoicePdf";

export const generateInvoice = async (req: Request, res: Response) => {
  try {
    const orderId = Number(req.params.orderId);

    if (!orderId || isNaN(orderId)) {
      return res.status(400).json({
        success: false,
        message: "orderId is invalid",
      });
    }

    await buildInvoicePdf(orderId, res);
  } catch (error: any) {
    console.error("INVOICE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate invoice",
    });
  }
};
