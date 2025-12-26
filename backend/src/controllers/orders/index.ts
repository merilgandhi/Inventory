import { Request, Response } from "express";
import {
  ProductVariation,
  Product,
  Variation,
  Orders,
  OrderItem,
  Seller,
} from "@models/index";
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
    } else if (pv.boxQrCode == barcode) {
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
      statusCode: 200,
      message: "Product found",
      data: responseData,
    });
  } catch (err: any) {
    console.error("CHECK BARCODE ERROR:", err);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Unable to fetch product for given barcode",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
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
        updatedBy: userId,
      },
      { transaction: t }
    );

    const newPV = await ProductVariation.create(
      {
        ...productVariation,
        productId: newProduct.id,
        variationId: newVariation.id,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "New product created successfully",
      product: newProduct,
      variation: newVariation,
      productVariation: newPV,
    });
  } catch (err: any) {
    console.error("CREATE FROM SCAN ERROR:", err);
    await t.rollback();
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Failed to create product from scan",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

export const createOrderFromScan = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const { sellerId, scannedItems } = req.body;

    if (
      !sellerId ||
      !Array.isArray(scannedItems) ||
      scannedItems.length === 0
    ) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "sellerId and scannedItems are required",
      });
    }

    //  Create order shell
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

    const mergedMap = new Map<number, number>();

    //  Normalize scans
    for (const item of scannedItems) {
      const { barcode, quantity = 1 } = item;

      const pv = await ProductVariation.findOne({
        where: {
          [Op.or]: [{ productQrCode: barcode }, { boxQrCode: barcode }],
        },
        include: [{ model: Product }, { model: Variation }],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!pv) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: `Barcode not found: ${barcode}`,
        });
      }

      let units = 0;

      if (pv.productQrCode === barcode) {
        units = quantity;
      } else {
        units = quantity * Number(pv.boxQuantity || 1);
      }

      mergedMap.set(pv.id, (mergedMap.get(pv.id) || 0) + units);
    }

    let subtotal = 0;
    let gstTotal = 0;

    // Create order items (MERGED)
    for (const [pvId, totalQty] of mergedMap.entries()) {
      const pv = await ProductVariation.findByPk(pvId, {
        include: [{ model: Product }, { model: Variation }],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!pv || pv.stockInHand < totalQty) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Insufficient stock",
          product: pv?.Product?.name,
          variation: pv?.Variation?.name,
          availableStock: pv?.stockInHand,
          requested: totalQty,
        });
      }

      // Deduct stock
      await pv.update(
        { stockInHand: pv.stockInHand - totalQty },
        { transaction: t }
      );

      const unitPrice = Number(pv.price);
      const gstPercent = Number(pv.Product?.gst || 0);

      const base = +(unitPrice * totalQty).toFixed(2);
      const gst = +((base * gstPercent) / 100).toFixed(2);
      const total = +(base + gst).toFixed(2);

      subtotal += base;
      gstTotal += gst;

      await OrderItem.create(
        {
          orderId: order.id,
          productId: pv.productId,
          productVariationId: pv.id,
          quantity: totalQty,
          unitPrice,
          gstPercent,
          gstAmount: gst,
          total,
        },
        { transaction: t }
      );
    }

    const grandTotal = +(subtotal + gstTotal).toFixed(2);

    await order.update({ subtotal, gstTotal, grandTotal }, { transaction: t });

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId: order.id,
        subtotal,
        gstTotal,
        grandTotal,
      },
    });
  } catch (err: any) {
    console.error("SCAN ORDER ERROR:", err);
    await t.rollback();
    return res.status(500).json({
      success: false,
      message: "Failed to create order",
    });
  }
};

export const scanBarcode = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  const getTodayRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  try {
    const { sellerId, barcode } = req.body;

    if (!sellerId || !barcode) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "sellerId and barcode are required",
      });
    }

    const seller = await Seller.findByPk(sellerId);
    if (!seller) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    //  Find product variation
    const pv = await ProductVariation.findOne({
      where: {
        [Op.or]: [{ productQrCode: barcode }, { boxQrCode: barcode }],
      },
      include: [
        { model: Product, attributes: ["id", "name", "gst"] },
        { model: Variation, attributes: ["id", "name"] },
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!pv) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Product not found for scanned barcode",
      });
    }

    // quantity logic
    const quantityToAdd =
      pv.productQrCode === barcode ? 1 : Number(pv.boxQuantity || 1);

    if (pv.stockInHand < quantityToAdd) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
        product: pv.Product.name,
        availableStock: pv.stockInHand,
      });
    }

    //  Find or create OPEN order for today
    const { start, end } = getTodayRange();

    let order = await Orders.findOne({
      where: {
        sellerId,
        status: "COMPLETED",
        createdAt: { [Op.between]: [start, end] },
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!order) {
      order = await Orders.create(
        {
          sellerId,
          status: "COMPLETED",
          subtotal: 0,
          gstTotal: 0,
          grandTotal: 0,
        },
        { transaction: t }
      );
    }

    //  Check if item already exists
    let orderItem = await OrderItem.findOne({
      where: {
        orderId: order.id,
        productVariationId: pv.id,
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    const unitPrice = Number(pv.price);
    const gstPercent = Number(pv.Product.gst || 0);

    if (orderItem) {
      // increment quantity
      orderItem.quantity += quantityToAdd;
    } else {
      orderItem = OrderItem.build({
        orderId: order.id,
        productId: pv.productId,
        productVariationId: pv.id,
        quantity: quantityToAdd,
        unitPrice,
        gstPercent,
      });
    }

    const base = +(orderItem.quantity * unitPrice).toFixed(2);
    const gst = +((base * gstPercent) / 100).toFixed(2);
    const total = +(base + gst).toFixed(2);

    orderItem.gstAmount = gst;
    orderItem.total = total;

    await orderItem.save({ transaction: t });

    //  Deduct stock
    await pv.update(
      { stockInHand: pv.stockInHand - quantityToAdd },
      { transaction: t }
    );

    //  Recalculate order totals
    const items = await OrderItem.findAll({
      where: { orderId: order.id },
      transaction: t,
    });

    const subtotal = Number(
      items.reduce((sum, item) => {
        return sum + Number(item.quantity) * Number(item.unitPrice);
      }, 0)
    ).toFixed(2);

    const gstTotal = Number(
      items.reduce((sum, item) => {
        return sum + Number(item.gstAmount);
      }, 0)
    ).toFixed(2);

    const grandTotal = (Number(subtotal) + Number(gstTotal)).toFixed(2);

    await order.update(
      {
        subtotal: Number(subtotal),
        gstTotal: Number(gstTotal),
        grandTotal: Number(grandTotal),
      },
      { transaction: t }
    );

    await t.commit();

    return res.json({
      success: true,
      message: "Barcode scanned successfully",
      data: {
        orderId: order.id,
        seller: seller.name,
        product: pv.Product.name,
        variation: pv.Variation.name,
        quantity: orderItem.quantity,
        subtotal,
        gstTotal,
        grandTotal,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("SCAN BARCODE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to scan barcode",
    });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const { sellerId, items } = req.body;

    if (!sellerId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "sellerId is required",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "items must be a non-empty array",
      });
    }

    // 1️ Create order first
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

    let subtotal = 0;
    let gstTotal = 0;

    // 2️ Loop items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      const qty = Number(item.quantity);
      if (!item.productVariationId || !Number.isInteger(qty) || qty <= 0) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Invalid quantity at item index ${i}`,
        });
      }

      // 3️ Try finding ProductVariation by PK
      let pv = await ProductVariation.findByPk(item.productVariationId, {
        include: [{ model: Product }, { model: Variation }],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      // 4️ Fallback: variation.id + productId
      if (!pv) {
        const where: any = { variationId: item.productVariationId };

        if (item.productId) {
          where.productId = item.productId;
        }

        pv = await ProductVariation.findOne({
          where,
          include: [{ model: Product }, { model: Variation }],
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
      }

      //  Still not found
      if (!pv) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: "Product variation not found",
          details: {
            productId: item.productId ?? null,
            productVariationId: item.productVariationId,
          },
        });
      }

      // 5️ Stock check
      if (pv.stockInHand < qty) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Insufficient stock",
          product: pv.Product?.name,
          variation: pv.Variation?.name,
          availableStock: pv.stockInHand,
          requested: qty,
        });
      }

      // 6️ Deduct stock
      await pv.update(
        {
          stockInHand: pv.stockInHand - qty,
        },
        { transaction: t }
      );

      // 7️ Price & GST calc
      const unitPrice = Number(pv.price);
      const gstPercent = Number(pv.Product?.gst || 0);

      const lineBase = +(unitPrice * qty).toFixed(2);
      const lineGst = +((lineBase * gstPercent) / 100).toFixed(2);
      const lineTotal = +(lineBase + lineGst).toFixed(2);

      subtotal += lineBase;
      gstTotal += lineGst;

      // 8️ Create order item
      await OrderItem.create(
        {
          orderId: order.id,
          productId: pv.productId,
          productVariationId: pv.id,
          quantity: qty,
          unitPrice,
          gstPercent,
          gstAmount: lineGst,
          total: lineTotal,
        },
        { transaction: t }
      );
    }

    const grandTotal = +(subtotal + gstTotal).toFixed(2);

    // 9️ Update order totals
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
      data: {
        orderId: order.id,
        product: 
        subtotal,
        gstTotal,
        grandTotal,
      },
    });
  } catch (err: any) {
    console.error("CREATE ORDER ERROR:", err);
    await t.rollback();

    return res.status(500).json({
      success: false,
      message: "Failed to create order",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

export const listOrders = async (req: Request, res: Response) => {
  try {
    const { page, limit, offset } = req.pagination!;

    const sellerId = req.query.sellerId;
    const status = req.query.status;
    const from = req.query.from;
    const to = req.query.to;
    const deleted = req.query.deleted === "true";

    const where: any = {};

    if (sellerId) where.sellerId = Number(sellerId);
    if (status) where.status = status;

    if (from && to) {
      where.createdAt = { [Op.between]: [new Date(from), new Date(to)] };
    } else if (from) {
      where.createdAt = { [Op.gte]: new Date(from) };
    } else if (to) {
      where.createdAt = { [Op.lte]: new Date(to) };
    }

    const paranoid = deleted ? false : true;

    const { rows, count } = await Orders.findAndCountAll({
      where,
      limit,
      offset,
      paranoid,
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Seller,
          as: "seller",
          attributes: ["id", "name", "contactNumber"],
        },
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name", "gst"],
            },
            {
              model: ProductVariation,
              as: "productVariation",
              include: [
                {
                  model: Variation,
                  attributes: ["id", "name"],
                },
              ],
            },
          ],
        },
      ],
    });

    const mapped = rows.map((o: any) => ({
      id: o.id,
      seller: o.seller,
      subtotal: Number(o.subtotal),
      gstTotal: Number(o.gstTotal),
      grandTotal: Number(o.grandTotal),
      status: o.status,
      createdAt: o.createdAt,
      items: (o.items || []).map((it: any) => ({
        id: it.id,
        product: it.product
          ? { id: it.product.id, name: it.product.name, gst: it.product.gst }
          : null,
        productVariation: it.productVariation
          ? {
              id: it.productVariation.id,
              variation: it.productVariation.Variation
                ? {
                    id: it.productVariation.Variation.id,
                    name: it.productVariation.Variation.name,
                  }
                : null,
            }
          : null,
        quantity: it.quantity,
        unitPrice: Number(it.unitPrice),
        total: Number(it.total),
      })),
    }));

    return res.status(200).json({
      success: true,
      data: mapped,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error("LIST ORDERS ERROR:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Failed to fetch orders",
    });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const order = await Orders.findByPk(id, {
      include: [
        {
          model: Seller,
          as: "seller",
          attributes: ["id", "name", "contactNumber"],
        },
        {
          model: OrderItem,
          as: "items",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "name"],
            },
            {
              model: ProductVariation,
              as: "productVariation",
              include: [
                {
                  model: Variation,
                  attributes: ["id", "name"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const o = order as any;

    const mapped = {
      id: o.id,
      seller: o.seller,
      subtotal: Number(o.subtotal),
      gstTotal: Number(o.gstTotal),
      grandTotal: Number(o.grandTotal),
      status: o.status,
      createdAt: o.createdAt,
      items: (o.items || []).map((it: any) => ({
        id: it.id,
        product: it.product
          ? { id: it.product.id, name: it.product.name, gst: it.product.gst }
          : null,
        productVariation: it.productVariation
          ? {
              id: it.productVariation.id,
              variation: it.productVariation.Variation
                ? {
                    id: it.productVariation.Variation.id,
                    name: it.productVariation.Variation.name,
                  }
                : null,
            }
          : null,
        quantity: it.quantity,
        unitPrice: Number(it.unitPrice),
        total: Number(it.total),
      })),
    };

    return res.status(200).json({
      success: true,
      data: mapped,
    });
  } catch (error) {
    console.error("GET ORDER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
};

export const deleteOrder = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const order = await Orders.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    await order.destroy();

    return res.status(200).json({
      statusCode: 200,
      status: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("DELETE ORDER ERROR:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Failed to delete order",
    });
  }
};

export const updateOrder = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const orderId = Number(req.params.id);
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Items array is required",
      });
    }

    const order = await Orders.findByPk(orderId, {
      include: [{ model: OrderItem, as: "items" }],
      transaction: t,
    });

    if (!order) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Map existing items
    const existingItemsMap = new Map<number, OrderItem>();
    for (const item of order.items) {
      existingItemsMap.set(item.productVariationId, item);
    }

    let subtotal = 0;
    let gstTotal = 0;

    //  Handle UPDATE + ADD
    for (const item of items) {
      const {
        productVariationId,
        quantity,
        unitPrice: itemUnitPrice,
        gstPercent: itemGstPercent,
      } = item;

      if (!productVariationId || quantity <= 0) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Invalid productVariationId or quantity",
        });
      }

      const pv = await ProductVariation.findByPk(productVariationId, {
        include: [{ model: Product }],
        transaction: t,
      });

      if (!pv) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: `Product variation not found (ID ${productVariationId})`,
        });
      }

      const existingItem = existingItemsMap.get(productVariationId);
      const oldQty = existingItem ? existingItem.quantity : 0;
      const diffQty = quantity - oldQty;

      // STOCK ADJUSTMENT
      if (diffQty > 0) {
        const [affected] = await ProductVariation.update(
          {
            stockInHand: sequelize.literal(`stockInHand - ${diffQty}`),
          },
          {
            where: {
              id: productVariationId,
              stockInHand: { [Op.gte]: diffQty },
            },
            transaction: t,
          }
        );

        if (affected === 0) {
          await t.rollback();
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${pv.Product?.name}`,
          });
        }
      } else if (diffQty < 0) {
        // returning stock back to inventory
        await ProductVariation.update(
          {
            stockInHand: sequelize.literal(
              `stockInHand + ${Math.abs(diffQty)}`
            ),
          },
          {
            where: { id: productVariationId },
            transaction: t,
          }
        );
      }

      const unitPrice =
        itemUnitPrice !== undefined ? Number(itemUnitPrice) : Number(pv.price);
      const gstPercent =
        itemGstPercent !== undefined
          ? Number(itemGstPercent)
          : Number(pv.Product?.gst || 0);
      const base = +(unitPrice * quantity).toFixed(2);
      const gst = +((base * gstPercent) / 100).toFixed(2);
      const total = +(base + gst).toFixed(2);

      subtotal += base;
      gstTotal += gst;

      if (existingItem) {
        await existingItem.update(
          {
            quantity,
            unitPrice,
            gstPercent,
            gstAmount: gst,
            total,
          },
          { transaction: t }
        );
        existingItemsMap.delete(productVariationId);
      } else {
        await OrderItem.create(
          {
            orderId: order.id,
            productId: pv.productId,
            productVariationId,
            quantity,
            unitPrice,
            gstPercent,
            gstAmount: gst,
            total,
          },
          { transaction: t }
        );
      }
    }

    //  Handle REMOVED ITEMS (restore stock)
    for (const removedItem of existingItemsMap.values()) {
      await ProductVariation.update(
        {
          stockInHand: sequelize.literal(
            `stockInHand + ${removedItem.quantity}`
          ),
        },
        {
          where: { id: removedItem.productVariationId },
          transaction: t,
        }
      );

      await removedItem.destroy({ transaction: t });
    }

    const grandTotal = +(subtotal + gstTotal).toFixed(2);

    await order.update({ subtotal, gstTotal, grandTotal }, { transaction: t });

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: {
        orderId: order.id,
        subtotal,
        gstTotal,
        grandTotal,
      },
    });
  } catch (err: any) {
    console.error("UPDATE ORDER ERROR:", err);
    await t.rollback();
    return res.status(500).json({
      success: false,
      message: "Failed to update order",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
