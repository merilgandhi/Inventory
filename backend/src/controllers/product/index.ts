import { Request, Response } from "express";
import { Product, ProductVariation, Variation, User } from "@models/index";
import { Op, where } from "sequelize";
import { sequelize } from "@config/database";


export const listAll = async (req: Request, res: Response) => {
  try {
    const { page, limit, offset } = req.pagination!;

    const search = req.query.search ? String(req.query.search) : null;
    const status = req.query.status ? String(req.query.status) : null;
    const createdBy = req.query.createdBy;
    const from = req.query.from;
    const to = req.query.to;
    const deleted = req.query.deleted === "true";
    const sortBy = req.query.sortBy ? String(req.query.sortBy) : "id";
    const order = req.query.order === "asc" ? "ASC" : "DESC";

    const where: any = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { hsn: { [Op.like]: `%${search}%` } },
        { gst: { [Op.like]: `%${search}%` } }
      ];
    }
    if (status !== null) {
      where.isActive = status === "true";
    }
  
    if (createdBy) where.createdBy = Number(createdBy);

    if (from && to) where.createdAt = { [Op.between]: [new Date(from), new Date(to)] };
    else if (from) where.createdAt = { [Op.gte]: new Date(from) };
    else if (to) where.createdAt = { [Op.lte]: new Date(to) };

    const paranoid = deleted ? false : true;

    const { rows, count } = await Product.findAndCountAll({
      where,
      limit,
      offset,
      paranoid,
      include: [
        { model: User, as: "creator", attributes: ["id", "name", "email"] },
        {
          model: ProductVariation,
          as: "variants",
          include: [{ model: Variation }]
        }
      ],
      order: [[sortBy, order]]
    });

    return res.status(200).json({
      success: true,
      data: rows,
      total: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit)
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "failed to fetch Product" });
  }
};


// ===============================
// GET BY ID
// ===============================
export const getById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const product = await Product.findByPk(id, {
      include: [
        {
          model: ProductVariation,
          as: "variants",
          include: [{ model: Variation }]
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json({
      message: "Product fetched successfully",
      status: true,
      product,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "failed to fetch by Id" });
  }
};


export const create = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const userId = req.user.id;
    const { name, gst, hsn, isActive, variants } = req.body;

    const product = await Product.create(
      { name, gst, hsn, isActive, createdBy: userId, updatedBy: userId },
      { transaction: t }
    );

    if (Array.isArray(variants) && variants.length > 0) {
      const rows = variants.map((v) => ({
        productId: product.id,
        variationId: v.variationId,
        price: v.price,
        productQrCode: v.productQrCode,
        boxQuantity: v.boxQuantity,
        boxQrCode: v.boxQrCode,
        stockInHand: v.stockInHand,
      }));

      await ProductVariation.bulkCreate(rows, { transaction: t });
    }

    await t.commit();

    return res.status(201).json({
      message: "Product created successfully",
      status: true,
      product,
      variants,
    });

  } catch (err) {
    console.error(err);
    await t.rollback();
    return res.status(500).json({ error, message: "Failed To Create Product" });
  }
};



export const update = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();

  try {
    const productId = Number(req.params.id);
    const userId = req.user.id;

    const { name, gst, hsn, isActive, variants } = req.body;

    // 1. Check product
    const product = await Product.findByPk(productId, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ message: "Product not found" });
    }

    // 2. Update product fields
    await product.update(
      { name, gst, hsn, isActive, updatedBy: userId },
      { transaction: t }
    );

    // ============================
    // VARIATION UPDATE LOGIC
    // ============================

    // Fetch existing rows
    const existingRows = await ProductVariation.findAll({
      where: { productId },
      transaction: t
    });

    const existingIds = existingRows.map((row) => row.id);
    const sentIds = variants.filter((v) => v.id).map((v) => v.id);

    // DELETE removed variants
    const toDelete = existingIds.filter((id) => !sentIds.includes(id));
    if (toDelete.length > 0) {
      await ProductVariation.destroy({
        where: { id: toDelete },
        transaction: t
      });
    }

    // UPDATE existing ones
    for (const row of variants) {
      if (row.id) {
        await ProductVariation.update(
          {
            variationId: row.variationId,
            price: row.price,
            productQrCode: row.productQrCode,
            boxQuantity: row.boxQuantity,
            boxQrCode: row.boxQrCode,
            stockInHand: row.stockInHand,
          },
          {
            where: { id: row.id },
            transaction: t,
          }
        );
      }
    }

    // INSERT new ones
    const newRows = variants.filter((v) => !v.id);
    if (newRows.length > 0) {
      const formatted = newRows.map((v) => ({
        productId,
        variationId: v.variationId,
        price: v.price,
        productQrCode: v.productQrCode,
        boxQuantity: v.boxQuantity,
        boxQrCode: v.boxQrCode,
        stockInHand: v.stockInHand,
      }));

      await ProductVariation.bulkCreate(formatted, { transaction: t });
    }

    await t.commit();

    // Fetch updated data for response
    const updatedProduct = await Product.findByPk(productId, {
      include: [
        {
          model: ProductVariation,
          as: "variants",
          include: [{ model: Variation }],
        },
      ],
    });

    return res.status(200).json({
      message: "Product updated successfully",
      status: true,
      product: updatedProduct,
    });

  } catch (err) {
    console.error(err);
    await t.rollback();
    return res.status(500).json({ message: "Failed To Update" });
  }
};


// ===============================
// DELETE PRODUCT
// ===============================
export const remove = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await product.destroy();

    return res.status(200).json({
      message: "Product deleted successfully",
      status: true,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed To Remove" });
  }
};


// ===============================
// RESTORE PRODUCT
// ===============================
export const restore = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  const product = await Product.findByPk(id, { paranoid: false });
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  await product.restore();

  return res.status(200).json({
    message: "Product restored successfully",
    status: true,
  });
};
