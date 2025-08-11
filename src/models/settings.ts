import { DataTypes, Optional, Model } from "sequelize";
import sequelize from "../../utils/database";


interface SettingsAttrs {
    id: number;
    key: string;
    value: string;
}

interface SettingsCreationAttrs extends Optional<SettingsAttrs, 'id' | 'key'> { }

class Settings extends Model<SettingsAttrs, SettingsCreationAttrs> {
    declare id: number
    declare key: string
    declare value: string
}

Settings.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        key: DataTypes.STRING,
        value: DataTypes.TEXT,
    },
    {
        sequelize,
        tableName: 'settings',
        timestamps: false,
        underscored: true
    }
)

export default Settings