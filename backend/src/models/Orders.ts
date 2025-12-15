import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "@config/database";

interface OrderAttributes {
  id: number;
  sellerId: number;
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
  status: "DRAFT" | "COMPLETED" | "CANCELLED";
  deletedAt?: Date;
}

interface OrderCreationAttributes
  extends Optional<OrderAttributes, "id" | "subtotal" | "gstTotal" | "grandTotal" | "status"> {}

export class Order
  extends Model<OrderAttributes, OrderCreationAttributes>
  implements OrderAttributes {

  public id!: number;
  public sellerId!: number;
  public subtotal!: number;
  public gstTotal!: number;
  public grandTotal!: number;
  public status!: "DRAFT" | "COMPLETED" | "CANCELLED";
  public deletedAt?: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    sellerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    gstTotal: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    grandTotal: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM("DRAFT", "COMPLETED", "CANCELLED"),
      defaultValue: "COMPLETED",
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "orders",
    timestamps: true,
    paranoid: true,
  }
);

export default Order;