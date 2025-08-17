import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface CategoryAttributes {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parentId?: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id' | 'description' | 'parentId' | 'imageUrl' | 'createdAt' | 'updatedAt'> {}

class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: string;
  public name!: string;
  public description?: string;
  public slug!: string;
  public parentId?: string;
  public imageUrl?: string;
  public isActive!: boolean;
  public sortOrder!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Category.init(
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
        len: [2, 100],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-z0-9-]+$/,
      },
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id',
      },
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'categories',
    modelName: 'Category',
    indexes: [
      {
        unique: true,
        fields: ['slug'],
      },
      {
        fields: ['parentId'],
      },
      {
        fields: ['isActive'],
      },
      {
        fields: ['sortOrder'],
      },
    ],
  }
);

// Self-referencing association for parent-child relationships
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parentId' });
Category.hasMany(Category, { as: 'children', foreignKey: 'parentId' });

export { Category, CategoryAttributes, CategoryCreationAttributes };
