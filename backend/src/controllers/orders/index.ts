import { Request, Response } from "express";
import { ProductVariation, Product, Variation, Orders, OrderItem } from "@models/index";
import { Op } from "sequelize";
import { sequelize } from "@config/database";


export const checkBarcode = async (req: Request, res: Response) => {
  try {
    const { barcode } = req.params;

    const pv = await ProductVariation.findOne({
      where: {
        [Op.or]: [{ productQrCode: barcode }, { boxQrCode: barcode }],
      },
      include: [{ model: Product }, { model: Variation }],
    });

    if (!pv) {
      return res.status(404).json({
        exists: false,
        message: "No product found with this barcode. Create a new one.",
      });
    }

    let responseData = null;

    if (pv.productQrCode == barcode) {
      responseData = {
        type: "PRODUCT_QR",
        productId: pv.productId,
        variationId: pv.variationId,
        product: pv.Product,
        variation: pv.Variation,
        pricePerUnit: pv.price,
        stockInHand: pv.stockInHand,
        scannedQr: "productQrCode",
      };
    }
     else if (pv.boxQrCode == barcode) {
      responseData = {
        type: "BOX_QR",
        productId: pv.productId,
        variationId: pv.variationId,
        product: pv.Product,
        variation: pv.Variation,
        boxQuantity: pv.boxQuantity,
        boxQrCode: pv.boxQrCode,
        stockInHand: pv.stockInHand,
        scannedQr: "boxQrCode",
      };
    }
    return res.status(200).json({
      status: true,
      statusCode:200,
      message: "Product found",
      data: responseData,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ 
      status:false,
      statusCode:500,
      message: "Unable To Fetch QrCode",
      
     });
  }
};

export const createProductFromScan = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const { product, variation, productVariation } = req.body;

    
    const newProduct = await Product.create(
      {
        ...product,
        createdBy: userId,
        updatedBy: userId,
      },
      { transaction: t }
    );

    
    const newVariation = await Variation.create(
      {
        ...variation,
        createdBy: userId,
        updatedBy: userId
      },
      { transaction: t }
    );

 
    const newPV = await ProductVariation.create(
      {
        ...productVariation,
        productId: newProduct.id,
        variationId: newVariation.id
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "New product created successfully",
      product: newProduct,
      variation: newVariation,
      productVariation: newPV
    });

  } catch (err) {
    console.error(err);
    await t.rollback();
    return res.status(500).json({ message: "Server Error" });
  }
};



export const createOrder = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const sellerId = req.body.sellerId;
    const items = req.body.items; 

    if (!sellerId || !Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid order payload",
      });
    }

    let subtotal = 0;
    let gstTotal = 0;

 
    const order = await Orders.create(
      {
        sellerId,
        subtotal: 0,
        gstTotal: 0,
        grandTotal: 0,
        status: "COMPLETED",
      },
      { transaction: t }
    );


    for (const item of items) {
      const { productVariationId, quantity } = item;

      if (!productVariationId || quantity <= 0) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Invalid productVariationId or quantity",
        });
      }

      const [affected] = await ProductVariation.update(
        {
          stockInHand: sequelize.literal(
            `stockInHand - ${sequelize.escape(quantity)}`
          ),
        },
        {
          where: {
            id: productVariationId,
            stockInHand: { [Op.gte]: quantity },
          },
          transaction: t,
        }
      );

      if (affected === 0) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Insufficient stock",
        });
      }

      const pv = await ProductVariation.findByPk(productVariationId, {
        transaction: t,
      });

      if (!pv) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: "Product variation not found",
        });
      }

      const unitPrice = Number(pv.price);
      const gstPercent = Number(pv.gst || 0);

      const lineBase = unitPrice * quantity;
      const lineGst = (lineBase * gstPercent) / 100;
      const lineTotal = lineBase + lineGst;

      subtotal += lineBase;
      gstTotal += lineGst;

      await OrderItem.create(
        {
          orderId: order.id,
          productId: pv.productId,
          productVariationId,
          quantity,
          unitPrice,
          gstPercent,
          gstAmount: lineGst,
          total: lineTotal,
        },
        { transaction: t }
      );
    }

    const grandTotal = subtotal + gstTotal;


    await order.update(
      {
        subtotal,
        gstTotal,
        grandTotal,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data:
      {orderId: order.id,
      subtotal,
      gstTotal,
      grandTotal,}
    });
  } catch (err) {
    console.error("createOrder error:", err);
    await t.rollback();
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
};