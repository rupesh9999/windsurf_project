import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ProductAttributes {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  sku: string;
  stock: number;
  imageUrl?: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'imageUrl' | 'images' | 'weight' | 'dimensions' | 'tags' | 'createdAt' | 'updatedAt'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: string;
  public name!: string;
  public description!: string;
  public price!: number;
  public categoryId!: string;
  public sku!: string;
  public stock!: number;
  public imageUrl?: string;
  public images?: string[];
  public rating!: number;
  public reviewCount!: number;
  public isActive!: boolean;
  public weight?: number;
  public dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  public tags?: string[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public isInStock(): boolean {
    return this.stock > 0;
  }

  public updateStock(quantity: number): void {
    this.stock = Math.max(0, this.stock + quantity);
  }

  public calculateDiscountPrice(discountPercent: number): number {
    return this.price * (1 - discountPercent / 100);
  }
}

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 255],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
      },
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5,
      },
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    weight: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    dimensions: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'products',
    modelName: 'Product',
    indexes: [
      {
        unique: true,
        fields: ['sku'],
      },
      {
        fields: ['categoryId'],
      },
      {
        fields: ['price'],
      },
      {
        fields: ['rating'],
      },
      {
        fields: ['isActive'],
      },
    ],
  }
);

export { Product, ProductAttributes, ProductCreationAttributes };
