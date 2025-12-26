import User from "./User";
import Variation from "./Variation";
import Product from "./Product";
import ProductVariation from "./ProductVariation";
import Seller from "./Seller";
import Orders from "./Orders";
import OrderItem from "./OrderItem";


User.hasMany(Variation, {
  as: "variations",
  foreignKey: "createdBy",
});
Variation.belongsTo(User, {
  as: "creator",
  foreignKey: "createdBy",
});


User.hasMany(Product, {
  as: "products",
  foreignKey: "createdBy",
});
Product.belongsTo(User, {
  as: "creator",
  foreignKey: "createdBy",
});

Product.hasMany(ProductVariation, {
  as: "variants",
  foreignKey: "productId",
});
ProductVariation.belongsTo(Product, {
  foreignKey: "productId",
});


Variation.hasMany(ProductVariation, {
  foreignKey: "variationId",
});
ProductVariation.belongsTo(Variation, {
  foreignKey: "variationId",
});


Seller.hasMany(Orders, {
  as: "orders",
  foreignKey: "sellerId",
});
Orders.belongsTo(Seller, {
  as: "seller",
  foreignKey: "sellerId",
});

Orders.hasMany(OrderItem, {
  as: "items",
  foreignKey: "orderId",
});
OrderItem.belongsTo(Orders, {
  as: "order",
  foreignKey: "orderId",
});


Product.hasMany(OrderItem, {
  as: "orderItems",
  foreignKey: "productId",
});
OrderItem.belongsTo(Product, {
  as: "product",
  foreignKey: "productId",
});

ProductVariation.hasMany(OrderItem, {
  as: "orderItems",
  foreignKey: "productVariationId",
});
OrderItem.belongsTo(ProductVariation, {
  as: "productVariation",
  foreignKey: "productVariationId",
});

export {
  User,
  Variation,
  Product,
  ProductVariation,
  Seller,
  Orders,
  OrderItem,
};