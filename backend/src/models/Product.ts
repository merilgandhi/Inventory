import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "@config/database";

interface ProductAttributes {
  id: number;
  name: string;
  gst: number;
  hsn?: number;
  createdBy: number;
  updatedBy: number;
  deletedAt?: Date;
  isActive: boolean;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, "id"> {}

export class Product
  extends Model<ProductAttributes, ProductCreationAttributes>
  implements ProductAttributes
{
  public id!: number;
  public name!: string;
  public gst!: number;
  public hsn?: number;
  public createdBy!: number;
  public updatedBy!: number;
  public deletedAt?: Date;    
  public isActive!: boolean;
}

Product.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  gst: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  hsn: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false, 
  },
  updatedBy: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false, 
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: "products",
  sequelize,
  timestamps: true,
  paranoid: true,
});

export default Product;
