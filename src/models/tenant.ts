import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../../utils/database";

import bcrypt from "bcrypt";
import Domain from "./domain";

interface TenantAttrs {
  id: number;
  name: string;
  dbName: string;
  subdomain: string;
  company_name: string;
  tenant_key: string;
  password: string;
  phone: string;
  email: string;
  image?: string;
  db_url?: string;
  preferred_subdomain?: string;
  isActive?: boolean;
}

interface TenantCreationAttrs extends Optional<TenantAttrs, "id" | "email"> {}

class Tenant
  extends Model<TenantAttrs, TenantCreationAttrs>
  implements TenantAttrs
{
  declare id: number;
  declare name: string;
  declare password: string;
  declare email: string;
  declare dbName: string;
  declare db_url?: string;
  declare subdomain: string;
  declare company_name: string;
  declare tenant_key: string;
  declare phone: string;
  declare image?: string;
  declare preferred_subdomain?: string;
  declare isActive?: boolean;
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
    company_name: DataTypes.STRING,

    preferred_subdomain: DataTypes.STRING,
    db_url: DataTypes.STRING,

    tenant_key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    dbName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    subdomain: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },

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

  // if (!tenant.tenant_key) {
  //   // Prefer provided preferred_subdomain, else company_name
  //   const base = tenant.preferred_subdomain || slugifyCompanyName(tenant.company_name);
  //   tenant.tenant_key = safeTenantKey(base);
  // }
  // if (!tenant.dbName) {
  //   tenant.dbName = dbNameFromTenantKey(tenant.tenant_key);
  // }
  // if (!tenant.subdomain) {
  //   tenant.subdomain = `${tenant.tenant_key}.yourdomain.com`;
  // }
});

export const tenantAssociations = () => {
  Domain.belongsTo(Tenant, { foreignKey: "tenant_id", as: "tenant" });
  Tenant.hasMany(Domain, { foreignKey: "tenant_id", as: "domains" });
};

export default Tenant;
