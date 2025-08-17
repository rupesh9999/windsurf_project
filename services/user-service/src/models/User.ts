import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface UserAttributes {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'customer' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'phone' | 'lastLogin' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public phone?: string;
  public role!: 'customer' | 'admin';
  public isActive!: boolean;
  public emailVerified!: boolean;
  public lastLogin?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public toJSON(): object {
    const values = { ...this.get() };
    delete values.password;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 255],
      },
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 50],
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 50],
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^[\+]?[1-9][\d]{0,15}$/,
      },
    },
    role: {
      type: DataTypes.ENUM('customer', 'admin'),
      defaultValue: 'customer',
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    modelName: 'User',
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
    ],
  }
);

export { User, UserAttributes, UserCreationAttributes };
