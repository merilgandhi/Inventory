import { ProductVariation, Product, Variation } from "@models/index";
import { Op } from "sequelize";



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


export const createProductfromScan = async (req: Request, res: Response) => {
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
