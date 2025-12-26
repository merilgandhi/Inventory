import { Request, Response } from "express";
import { Op, fn, col, literal } from "sequelize";
import {
  Orders,
  OrderItem,
  Product,
  Variation,
  ProductVariation,
  Seller,
} from "@models/index";

export const dashboardOverview = async (req: Request, res: Response) => {
  try {
    const [totalOrders, totalRevenue, totalProducts, totalSellers] =
      await Promise.all([
        Orders.count(),
        Orders.sum("grandTotal"),
        Product.count(),
        Seller.count(),
      ]);

    const topProducts = await OrderItem.findAll({
      attributes: ["productId", [fn("SUM", col("quantity")), "soldQuantity"]],
      group: ["productId", "product.id"],
      order: [[literal("soldQuantity"), "DESC"]],
      limit: 5,
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["id", "name"],
        },
      ],
    });

    const lowStock = await ProductVariation.findAll({
      where: {
        stockInHand: { [Op.lte]: 10 },
      },
      limit: 10,
      include: [
        {
          model: Product,
          attributes: ["id", "name"],
        },
      ],
    });

    const sellerSales = await Orders.findAll({
      attributes: ["sellerId", [fn("SUM", col("grandTotal")), "totalSales"]],
      group: ["sellerId", "seller.id"],
      include: [
        {
          model: Seller,
          as: "seller", // ✅ MUST MATCH models/index.ts
          attributes: ["id", "name", "contactNumber"],
        },
      ],
    });

    const todaysOrders = await Orders.findAll({
      attributes: [
        [fn("DATE", col("createdAt")), "date"],
        [fn("SUM", col("grandTotal")), "totalSales"],
        [fn("COUNT", col("id")), "orderCount"],
      ],
      where: {
        createdAt: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)),
          [Op.lte]: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
      group: [fn("DATE", col("createdAt"))],
      order: [[fn("DATE", col("createdAt")), "ASC"]],
    });

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalOrders,
          totalRevenue: Number(totalRevenue || 0),
          totalProducts,
          totalSellers,
        },
        topProducts,
        lowStock,
        sellerSales,
        todaysOrders,
      },
    });
  } catch (err) {
    console.error("DASHBOARD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
};

export const todayReport = async (req: Request, res: Response) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const todaySummary = await Orders.findOne({
      attributes: [
        [fn("DATE", col("createdAt")), "date"],
        [fn("SUM", col("grandTotal")), "totalSales"],
        [fn("COUNT", col("id")), "orderCount"],
      ],
      where: {
        createdAt: {
          [Op.between]: [start, end],
        },
      },
      raw: true,
    });

    // const todaysOrders = await Orders.findAll({
    //   attributes: [
    //     [fn("DATE", col("createdAt")), "date"],
    //     [fn("SUM", col("grandTotal")), "totalSales"],
    //     [fn("COUNT", col("id")), "orderCount"]
    //   ],
    //   where: {
    //     createdAt: {
    //       [Op.gte]: start,
    //       [Op.lte]: end
    //     }
    //   },
    //   group: [fn("DATE", col("createdAt"))],
    //   order: [[fn("DATE", col("createdAt")), "ASC"]],
    //   raw: true
    // });

    
    return res.json({
      success: true,
      successCode: 200,
      data:{
      date: start.toISOString().slice(0, 10),
      todaysOrders: {
        date: todaySummary?.date ?? start.toISOString().slice(0, 10),
        totalSales: todaySummary?.totalSales ?? "0.00",
        orderCount: Number(todaySummary?.orderCount ?? 0),
      },
    }
    });
  } catch (error) {
    console.error("TODAY REPORT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch today report",
    });
  }
};

export const todaySellerReport = async (req: Request, res: Response) => {
 try {
   const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const rows = await OrderItem.findAll({
      include: [
        {
          model: Orders,
          as: "order",
          attributes: ["sellerId"],
          where: {
            createdAt: { [Op.between]: [start, end] },
          },
          include: [
            {
              model: Seller,
              as: "seller",
              attributes: ["id", "name", "contactNumber", "email"],
            },
          ],
        },
        {
          model: Product,
          as: "product",
          attributes: ["id", "name"],
        },
        {
          model: ProductVariation,
          as: "productVariation",
          attributes: ["id"],
          include: [
            {
              model: Variation,
              as: "Variation",
              attributes: ["name"],
            },
          ],
        },
      ],
      attributes: [
        "productId",
        "productVariationId",
        [fn("SUM", col("OrderItem.quantity")), "quantity"],
        [fn("SUM", col("OrderItem.total")), "revenue"],
      ],
      group: [
        "order.sellerId",
        "order.seller.id",
        "product.id",
        "productVariation.id",
        "productVariation->Variation.id",
      ],
    });

    // ---------- FORMAT RESPONSE ----------
    const sellerMap = new Map<number, any>();

    for (const r of rows as any[]) {
      const seller = r.order.seller;
      const sellerId = seller.id;

      if (!sellerMap.has(sellerId)) {
        sellerMap.set(sellerId, {
          sellerId,
          sellerName: seller.name,
          contactNumber: seller.contactNumber,
          email: seller.email,
          products: [],
        });
      }

      const sellerObj = sellerMap.get(sellerId);

      let product = sellerObj.products.find(
        (p: any) => p.productId === r.product.id
      );

      if (!product) {
        product = {
          productId: r.product.id,
          productName: r.product.name,
          variations: [],
        };
        sellerObj.products.push(product);
      }

      product.variations.push({
        productVariationId: r.productVariationId,
        variationName: r.productVariation.Variation?.name,
        quantity: Number(r.get("quantity")),
        revenue: Number(r.get("revenue")),
      });
    }
    return res.json({
      successMessage: "Today seller report fetched successfully",
      success: true,
      successCode: 200,
      data: Array.from(sellerMap.values()),
    }); 

 } catch (error) {
    return res.status(500).json({
      success: false,
      successCode: 500,
      message: "Failed to fetch today seller report",
    });
 }
}