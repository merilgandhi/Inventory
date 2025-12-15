import User from "./User";
import Variation from "./Variation";
import Product from "./Product";
import ProductVariation from "./ProductVariation";
import Orders from "./Orders";
import Seller from "./Seller";
import OrderItem from "./OrderItem";

/* USER */
User.hasMany(Variation, { as: "variations", foreignKey: "createdBy" });
Variation.belongsTo(User, { as: "creator", foreignKey: "createdBy" });

User.hasMany(Product, { as: "products", foreignKey: "createdBy" });
Product.belongsTo(User, { as: "creator", foreignKey: "createdBy" });

/* PRODUCT */
Product.hasMany(ProductVariation, { as: "variants", foreignKey: "productId" });
ProductVariation.belongsTo(Product, { foreignKey: "productId" });

Variation.hasMany(ProductVariation, { foreignKey: "variationId" });
ProductVariation.belongsTo(Variation, { foreignKey: "variationId" });

/* SELLER & ORDERS */
Seller.hasMany(Orders, { foreignKey: "sellerId", as: "orders" });
Orders.belongsTo(Seller, { foreignKey: "sellerId", as: "seller" });

/* ORDERS & ITEMS */
Orders.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
OrderItem.belongsTo(Orders, { foreignKey: "orderId", as: "order" });

/* ORDER ITEMS */
Product.hasMany(OrderItem, { foreignKey: "productId" });
OrderItem.belongsTo(Product, { foreignKey: "productId" });

ProductVariation.hasMany(OrderItem, { foreignKey: "productVariationId" });
OrderItem.belongsTo(ProductVariation, { foreignKey: "productVariationId" });

export {
  User,
  Variation,
  Product,
  ProductVariation,
  Seller,
  Orders,
  OrderItem,
};
