import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../../utils/database";

interface DomainAttrs {
  id: number;
  tenant_id: number;
  host: string; // full domain مثل acme.yourdomain.com أو customer.com
  type: "managed_subdomain" | "custom_domain";
  verified: boolean;
}

interface DomainCreationAttrs
  extends Optional<DomainAttrs, "id" | "verified"> {}

class Domain
  extends Model<DomainAttrs, DomainCreationAttrs>
  implements DomainAttrs
{
  declare id: number;
  declare tenant_id: number;
  declare host: string;
  declare type: "managed_subdomain" | "custom_domain";
  declare verified: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Domain.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tenant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    host: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM("managed_subdomain", "custom_domain"),
      allowNull: false,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: "domains",
    timestamps: true,
  }
);

export default Domain;
