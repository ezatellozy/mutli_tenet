import { Model, Optional, DataTypes } from "sequelize"

import sequelize from "../../utils/database"
import bcrypt from "bcrypt"

interface UserAttrs {
    id: number,
    name: string,
    password: string,
    email: string,
    role: string,
    phone: string,
    isActive: boolean,
    image: string
}

interface UserCreatitionAttributes extends Optional<UserAttrs, 'id' | 'email'> { }

class User extends Model<UserAttrs, UserCreatitionAttributes> implements UserAttrs {
    declare id: number;
    declare name: string;
    declare password: string;
    declare email: string;
    declare role: string;
    declare phone: string;
    declare image: string;
    declare isActive: boolean;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;
    declare readonly deletedAt: Date;

}

User.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: DataTypes.STRING,
    password: DataTypes.STRING,
    email: DataTypes.STRING,
    role: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone: DataTypes.STRING,
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,

    },
    image: {
        type: DataTypes.STRING,
        allowNull: true,
    }

}, {
    sequelize,
    modelName: 'User',

    timestamps: true,
    underscored: true,
    paranoid: true, // Soft deletes
    defaultScope: {
        attributes: { exclude: ['password'] }
    },
    scopes: {
        withPassword: { attributes: { include: ["password"] } }, // ✅ Allows including password when needed
    },
})

// const adminUsers = await User.scope("admin").findAll(); get all users where role = 'admin'

User.addHook('beforeCreate', async (user: User) => {
    if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
    }
});


export default User;