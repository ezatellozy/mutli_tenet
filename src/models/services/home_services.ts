import { Optional, Model, DataTypes, HasManyGetAssociationsMixin } from "sequelize";
import { Service } from "./services"
import sequelize from "../../../utils/database";

interface HomeServiceAttrs {
    id: number;
    icon: string;
    color: string;
    service_id: number;
    HomeServiceTranslations?: HomeServiceTranslation[]
}

interface ServiceTranslationAttributes {
    id: number;
    service_id: number;
    locale: string;
    title: string;
    desc: string;
}

interface ServiceCreationAttributes extends Optional<HomeServiceAttrs, 'id'> { }
interface ServiceTransCreationAttributes extends Optional<ServiceTranslationAttributes, 'id'> { }

class HomeService extends Model<HomeServiceAttrs, ServiceCreationAttributes> implements HomeServiceAttrs {
    declare id: number;
    declare service_id: number;
    declare icon: string;
    declare color: string;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
    // Define associations here
    declare getHomeServiceTranslations: HasManyGetAssociationsMixin<HomeServiceTranslation>;
    declare HomeServiceTranslations: HomeServiceTranslation[];

}
HomeService.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        icon: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        service_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        color: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    },
    {
        sequelize,
        tableName: 'home_services',
        underscored: true


    })


class HomeServiceTranslation extends Model<ServiceTranslationAttributes, ServiceTransCreationAttributes> implements HomeServiceTranslation {
    declare id: number;
    declare locale: string;
    declare title: string;
    declare desc: string;
    declare service_id: number;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
    // Define associations here

}

HomeServiceTranslation.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        service_id: {
            type: DataTypes.INTEGER,
            references: {
                model: HomeService,
                key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        locale: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        desc: {
            type: DataTypes.TEXT,
            allowNull: false,
        }

    },
    {
        sequelize,
        tableName: 'home_services_translations',
        underscored: true

    }
)

export const applyHomeServiceAssociations = () => {
    HomeServiceTranslation.belongsTo(HomeService, { foreignKey: 'service_id' });
    HomeService.hasMany(HomeServiceTranslation, { foreignKey: 'service_id', onDelete: 'CASCADE' });
    HomeService.belongsTo(Service, { foreignKey: 'service_id', onDelete: 'CASCADE' })
    Service.hasOne(HomeService, { foreignKey: 'service_id', onDelete: 'CASCADE' });
}


export { HomeService, HomeServiceTranslation } 