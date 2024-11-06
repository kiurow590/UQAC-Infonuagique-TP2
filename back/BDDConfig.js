/**
 * IMPORTS
 */
import {DataTypes} from 'sequelize';
import sequelize from './dbConfig.js';
import {logger} from "./logger.mjs";

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

const HealthData = sequelize.define('HealthData', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    poids: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    taille: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    imc: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
});

sequelize.sync().then(r =>
    logger.debug('Tables synchronisées')
);

export {User, HealthData};