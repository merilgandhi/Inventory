import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "@config/database";

interface VariationAttributes {
  id: number;
  name: string;
  status: boolean;
  createdBy: number;
  updatedBy: number;
  deletedAt?: Date;
}

interface VariationCreationAttributes
  extends Optional<VariationAttributes, "id" | "updatedBy"> {}

export class Variation
  extends Model<VariationAttributes, VariationCreationAttributes>
  implements VariationAttributes
{
  public id!: number;
  public name: string;
  public status!: boolean;
  public createdBy!: number;
  public updatedBy!: number;
  public deletedAt?: Date;
}

Variation.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
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
  },
  {
    sequelize,
    tableName: "variations",
    timestamps: true,
    paranoid: true,
  }
);

export default Variation;
