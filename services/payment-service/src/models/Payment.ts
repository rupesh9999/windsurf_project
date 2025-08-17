import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay'
}

interface PaymentAttributes {
  id: number;
  orderId: number;
  userId: number;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentMethodDetails?: {
    card?: {
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    };
    bankTransfer?: {
      accountLast4: string;
      routingNumber: string;
    };
  };
  refundedAmount: number;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: number;
  public orderId!: number;
  public userId!: number;
  public stripePaymentIntentId?: string;
  public stripeChargeId?: string;
  public amount!: number;
  public currency!: string;
  public status!: PaymentStatus;
  public paymentMethod!: PaymentMethod;
  public paymentMethodDetails?: {
    card?: {
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    };
    bankTransfer?: {
      accountLast4: string;
      routingNumber: string;
    };
  };
  public refundedAmount!: number;
  public failureReason?: string;
  public metadata?: Record<string, any>;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Check if payment can be refunded
  public canBeRefunded(): boolean {
    return this.status === PaymentStatus.SUCCEEDED && this.refundedAmount < this.amount;
  }

  // Get remaining refundable amount
  public getRemainingRefundableAmount(): number {
    return this.amount - this.refundedAmount;
  }

  // Update payment status
  public async updateStatus(newStatus: PaymentStatus, failureReason?: string): Promise<void> {
    this.status = newStatus;
    if (failureReason) {
      this.failureReason = failureReason;
    }
    await this.save();
  }

  // Add refund amount
  public async addRefund(refundAmount: number): Promise<void> {
    this.refundedAmount += refundAmount;
    
    if (this.refundedAmount >= this.amount) {
      this.status = PaymentStatus.REFUNDED;
    } else {
      this.status = PaymentStatus.PARTIALLY_REFUNDED;
    }
    
    await this.save();
  }

  public toJSON(): object {
    const values = { ...this.get() };
    return values;
  }
}

Payment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    stripePaymentIntentId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    stripeChargeId: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD',
      validate: {
        isIn: [['USD', 'EUR', 'GBP', 'CAD', 'AUD']],
      },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(PaymentStatus)),
      allowNull: false,
      defaultValue: PaymentStatus.PENDING,
    },
    paymentMethod: {
      type: DataTypes.ENUM(...Object.values(PaymentMethod)),
      allowNull: false,
    },
    paymentMethodDetails: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    refundedAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
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
    tableName: 'payments',
    timestamps: true,
    indexes: [
      {
        fields: ['orderId'],
      },
      {
        fields: ['userId'],
      },
      {
        fields: ['stripePaymentIntentId'],
        unique: true,
        where: {
          stripePaymentIntentId: {
            [DataTypes.Op.ne]: null,
          },
        },
      },
      {
        fields: ['status'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

export default Payment;
