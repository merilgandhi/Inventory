import { Request, Response } from "express";
import { ProductVariation, Product, Variation } from "@models/index";
import { Op } from "sequelize";

export const listProductVariations = async (req: Request, res: Response) => {
  try {
    const { page, limit, offset } = req.pagination!;

    const search = req.query.search ? String(req.query.search) : null;
    const deleted = req.query.deleted === "true";

    const where: any = {};

    if (search) {
      where[Op.or] = [
        { "$Product.name$": { [Op.like]: `%${search}%` } },
        { "$Variation.name$": { [Op.like]: `%${search}%` } },
        { productQrCode: { [Op.like]: `%${search}%` } },
        { boxQrCode: { [Op.like]: `%${search}%` } },
      ];
    }

    const { rows, count } = await ProductVariation.findAndCountAll({
      where,
      limit,
      offset,
      paranoid: !deleted,
      include: [
        {
          model: Product,
          attributes: ["id", "name", "gst"],
        },
        {
          model: Variation,
          attributes: ["id", "name"],
        },
      ],
      order: [["id", "DESC"]],
    });

    const data = rows.map((pv) => ({
      id: pv.id,
      productId: pv.productId,
      productName: pv.Product?.name,
      variationId: pv.variationId,
      variationName: pv.Variation?.name,
      price: pv.price,
      boxQuantity: pv.boxQuantity,
      stockInHand: pv.stockInHand,
      productQrCode: pv.productQrCode,
      boxQrCode: pv.boxQrCode,
      gst: pv.Product?.gst,
      isActive: pv.isActive,
    }));

    return res.status(200).json({
      success: true,
      data,
      total: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err: any) {
    console.error("LIST PRODUCT VARIATIONS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product variations",
    });
  }
};
