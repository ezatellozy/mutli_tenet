import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../../utils/database";

import bcrypt from "bcrypt";

interface TenentAttrs {
  id: number;
  name: string;
  dbName: string;
  subdomain: string;
  password: string;
  phone: string;
  email: string;
  image?: string;
  isActive: boolean;
}

interface TenentCreationAttrs extends Optional<TenentAttrs, "id" | "email"> {}

class Tenant
  extends Model<TenentAttrs, TenentCreationAttrs>
  implements TenentAttrs
{
  declare id: number;
  declare name: string;
  declare password: string;
  declare email: string;
  declare dbName: string;
  declare subdomain: string;
  declare phone: string;
  declare image?: string;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date;
}

Tenant.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: DataTypes.STRING,
    password: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    dbName: DataTypes.STRING,
    subdomain: DataTypes.STRING,
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Tenant",

    timestamps: true,
    underscored: true,
    paranoid: true,
    defaultScope: {
      attributes: { exclude: ["password"] },
    },
    scopes: {
      withPassword: { attributes: { include: ["password"] } },
    },
  }
);

Tenant.addHook("beforeCreate", async (tenant: Tenant) => {
  if (tenant.password) {
    tenant.password = await bcrypt.hash(tenant.password, 10);
  }
});

export default Tenant;
