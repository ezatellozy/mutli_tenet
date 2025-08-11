import { Model, Optional, HasManyGetAssociationsMixin, DataTypes } from 'sequelize'

import sequelize from '../../utils/database'

export type HomeTypes = 'top_intro' | 'middle_intro' | 'message' | 'vision' | 'mission'

export interface PageAttributes {
    id: number
    image: string
    video: string
    icon: string
    type: HomeTypes
    PageTranslations?: PageTranslationAttributes[]

}

interface PageTranslationAttributes {
    id: number
    page_id: number
    locale: string
    name: string
    title: string
    sub_title: string
    content: string
    button_name: string
}

interface PageCreationAttributes extends Optional<PageAttributes, 'id' | 'type'> { }

class Page extends Model<PageAttributes, Optional<PageCreationAttributes, 'id'>> implements PageAttributes {
    declare id: number
    declare image: string
    declare video: string
    declare icon: string
    declare type: HomeTypes
    declare readonly createdAt: Date
    declare readonly updatedAt: Date
    declare getPageTranslations: HasManyGetAssociationsMixin<PageTranslations>
    declare PageTranslations: PageTranslations[]
}

Page.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        video: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        icon: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
    }, {
    sequelize,
    modelName: 'page',
}
)


interface TranslationCreationAttributes extends Optional<PageTranslationAttributes, 'id'> { }


class PageTranslations extends Model<PageTranslationAttributes, Optional<TranslationCreationAttributes, 'id'>> implements PageTranslationAttributes {
    declare id: number
    declare page_id: number
    declare locale: string
    declare title: string
    declare name: string
    declare sub_title: string
    declare content: string
    declare button_name: string

    declare readonly createdAt: Date
    declare readonly updatedAt: Date

}

PageTranslations.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        page_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'pages',
                key: 'id',
            },
        },
        locale: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        sub_title: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        button_name: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        underscored: true,
        modelName: 'PageTranslation',
    }
)


export const pagesAssociations = () => {
    Page.hasMany(PageTranslations, { foreignKey: 'page_id', onDelete: 'CASCADE' });
    PageTranslations.belongsTo(Page, { foreignKey: 'page_id' });
}

export { Page, PageTranslations }