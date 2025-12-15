import User from "./User";
import Variation from "./Variation";
import Product from "./Product";
import ProductVariation from "./ProductVariation";
import Orders from "./Orders";
import Seller from "./Seller";



User.hasMany(Variation, { as: "variations", foreignKey: "createdBy" });
Variation.belongsTo(User, { as: "creator", foreignKey: "createdBy" });

Product.hasMany(ProductVariation, { as: "variants", foreignKey: "productId" });
ProductVariation.belongsTo(Product, { foreignKey: "productId" });


Variation.hasMany(ProductVariation, { foreignKey: "variationId" });
ProductVariation.belongsTo(Variation, { foreignKey: "variationId" });

User.hasMany(Product, { as: "products", foreignKey: "createdBy" });
Product.belongsTo(User, { as: "creator", foreignKey: "createdBy" });



Seller.hasMany(Orders, { foreignKey: "sellerId" });
Orders.belongsTo(Seller, { foreignKey: "sellerId" });


Product.hasMany(Orders, { foreignKey: "productId" });
Orders.belongsTo(Product, { foreignKey: "productId" });


ProductVariation.hasMany(Orders, { foreignKey: "productVariationId" });
Orders.belongsTo(ProductVariation, { foreignKey: "productVariationId" });

export { User, Variation, Product, ProductVariation, Seller, Orders };
