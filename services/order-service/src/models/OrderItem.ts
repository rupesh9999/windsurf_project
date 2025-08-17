import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Order from './Order';

interface OrderItemAttributes {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productSku: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderItemCreationAttributes extends Optional<OrderItemAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> implements OrderItemAttributes {
  public id!: number;
  public orderId!: number;
  public productId!: number;
  public productName!: string;
  public productSku!: string;
  public productImage?: string;
  public quantity!: number;
  public unitPrice!: number;
  public totalPrice!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Calculate total price
  public calculateTotalPrice(): number {
    return this.quantity * this.unitPrice;
  }

  public toJSON(): object {
    const values = { ...this.get() };
    return values;
  }
}

OrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Order,
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    productName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    productSku: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    productImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    totalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'order_items',
    timestamps: true,
    indexes: [
      {
        fields: ['orderId'],
      },
      {
        fields: ['productId'],
      },
    ],
  }
);

// Define associations
Order.hasMany(OrderItem, {
  foreignKey: 'orderId',
  as: 'items',
});

OrderItem.belongsTo(Order, {
  foreignKey: 'orderId',
  as: 'order',
});

export default OrderItem;
