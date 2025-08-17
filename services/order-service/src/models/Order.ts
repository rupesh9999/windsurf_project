import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

interface OrderAttributes {
  id: number;
  userId: number;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  billingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  paymentMethod: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: number;
  public userId!: number;
  public orderNumber!: string;
  public status!: OrderStatus;
  public paymentStatus!: PaymentStatus;
  public totalAmount!: number;
  public subtotal!: number;
  public taxAmount!: number;
  public shippingAmount!: number;
  public discountAmount!: number;
  public shippingAddress!: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  public billingAddress!: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  public paymentMethod!: string;
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Generate unique order number
  public static generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp.slice(-8)}-${random}`;
  }

  // Calculate total amount
  public calculateTotal(): number {
    return this.subtotal + this.taxAmount + this.shippingAmount - this.discountAmount;
  }

  // Update order status
  public async updateStatus(newStatus: OrderStatus): Promise<void> {
    this.status = newStatus;
    await this.save();
  }

  // Update payment status
  public async updatePaymentStatus(newStatus: PaymentStatus): Promise<void> {
    this.paymentStatus = newStatus;
    await this.save();
  }

  // Check if order can be cancelled
  public canBeCancelled(): boolean {
    return [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(this.status);
  }

  // Check if order can be refunded
  public canBeRefunded(): boolean {
    return [OrderStatus.DELIVERED].includes(this.status) && this.paymentStatus === PaymentStatus.PAID;
  }

  public toJSON(): object {
    const values = { ...this.get() };
    return values;
  }
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    orderNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(OrderStatus)),
      allowNull: false,
      defaultValue: OrderStatus.PENDING,
    },
    paymentStatus: {
      type: DataTypes.ENUM(...Object.values(PaymentStatus)),
      allowNull: false,
      defaultValue: PaymentStatus.PENDING,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    shippingAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    shippingAddress: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    billingAddress: {
      type: DataTypes.JSON,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: 'orders',
    timestamps: true,
    indexes: [
      {
        fields: ['userId'],
      },
      {
        fields: ['orderNumber'],
        unique: true,
      },
      {
        fields: ['status'],
      },
      {
        fields: ['paymentStatus'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

export default Order;
