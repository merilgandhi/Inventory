import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "@config/database";

interface OrderItemAttributes {
  id: number;
  orderId: number;
  productId: number;
  productVariationId: number;
  quantity: number;
  unitPrice: number;
  gstPercent: number;
  gstAmount: number;
  total: number;
}

interface OrderItemCreationAttributes
  extends Optional<OrderItemAttributes, "id"> {}

export class OrderItem
  extends Model<OrderItemAttributes, OrderItemCreationAttributes>
  implements OrderItemAttributes {

  public id!: number;
  public orderId!: number;
  public productId!: number;
  public productVariationId!: number;
  public quantity!: number;
  public unitPrice!: number;
  public gstPercent!: number;
  public gstAmount!: number;
  public total!: number;
}

OrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    productVariationId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    gstPercent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
    },
    gstAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "order_items",
    timestamps: true,
  }
);

export default OrderItem;
