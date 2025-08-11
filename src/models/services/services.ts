import { Model, Optional, DataTypes, HasManyGetAssociationsMixin } from "sequelize";
import sequelize from "../../../utils/database";
import { MetaData } from "../meta_data/pages"

interface ServiceAttributes {
    id: number;
    icon: string;
    image: string;
    video: string;
    background: string;
    type: string;
    meta_id: number | null;
}

interface ServiceTranslationAttributes {
    id: number;
    service_id: number;
    locale: string;
    title: string;
    name: string;
    desc?: string;
    sub_title?: string;
    sub_desc?: string;
    slug: string;
}

interface ServiceCreationAttributes extends Optional<ServiceAttributes, "id"> { }

class Service extends Model<ServiceAttributes, ServiceCreationAttributes> implements ServiceAttributes {
    declare id: number;
    declare meta_id: number;
    declare icon: string;
    declare image: string;
    declare video: string;
    declare background: string;
    declare type: string;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;

    // @HasManyAddAssociationMixin(() => ServiceTranslate)
    declare service_translations: ServiceTranslate[];
    declare get_service_translates: HasManyGetAssociationsMixin<ServiceTranslate>;

}

Service.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        meta_id: {
            type: DataTypes.INTEGER,

            references: {
                model: MetaData,
                key: 'id',
            },
            allowNull: true,
        },
        type: {

            type: DataTypes.STRING,
            allowNull: false,
        },
        icon: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        background: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        video: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: "service",
        underscored: true,
    }
)

interface TranslationCreationAttributes extends Optional<ServiceTranslationAttributes, 'id' | 'slug'> { }

class ServiceTranslate extends Model<ServiceTranslationAttributes, TranslationCreationAttributes> implements ServiceTranslationAttributes {
    declare id: number;
    declare slug: string;
    declare service_id: number;
    declare locale: string;
    declare name: string;
    declare title: string;
    declare sub_title: string;
    declare desc: string;
    declare sub_desc: string;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;

}

ServiceTranslate.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        service_id: {
            type: DataTypes.INTEGER,
            references: {
                model: Service,
                key: 'id',
            },
            onDelete: 'CASCADE',
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        locale: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        sub_title: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        desc: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        sub_desc: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: "service_translation",
        underscored: true,
    }
)

export const applyServiceAssociations = () => {
    ServiceTranslate.belongsTo(Service, { foreignKey: 'service_id' });
    Service.hasMany(ServiceTranslate, { foreignKey: 'service_id', onDelete: 'CASCADE' });

    Service.belongsTo(MetaData, { foreignKey: 'meta_id', onDelete: 'CASCADE' }); // DO NOT delete service when meta is deleted
    MetaData.hasMany(Service, { foreignKey: 'meta_id' }); // No cascade here
}

Service.addHook('beforeDestroy', 'deleteMetaOnServiceDestroy', async (service: Service, options) => {
    if (service.meta_id) {
        await MetaData.destroy({
            where: { id: service.meta_id },
            transaction: options.transaction,
        });
    }
});


export { Service, ServiceTranslate };