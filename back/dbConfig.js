/**
 * IMPORT
 */
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('database_name', 'root', 'password', {
    host: 'mysql', // Nom du service MySQL dans Kubernetes
    dialect: 'mysql'
});

export default sequelize;