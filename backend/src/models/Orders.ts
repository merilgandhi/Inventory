import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "@config/database";


interface OrdersAttributes {
  id: number;
  sellerId: number;
  productId:number;
  productVariationId:number;
  quantity:number;
  deletedAt?: Date;
}


interface OrdersCreationAttributes extends Optional<OrdersAttributes, "id"> {}



export class Orders
  extends Model<OrdersAttributes, OrdersCreationAttributes>
  implements ProductAttributes
  {
    public id!: number;
    public sellerId!: number;
    public productId!: number;
    public productVariationId!: number;
    public quantity!: number;
    public deletedAt?: Date;
  }

Orders.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  sellerId:{
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },
  productId:{
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull:false
  },
  productVariationId:{
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull:false
  },
  quantity:{
    type:DataTypes.INTEGER.UNSIGNED,
    allowNull:false
  },
  deletedAt:{
    type:DataTypes.DATE,
    allowNull:true
  }

},{
    sequelize,
    tableName: "orders",
    timestamps: true,
    paranoid: true,
    
});

export default Orders;