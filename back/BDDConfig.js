/**
 * IMPORTS
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { logger } from './logger.mjs';

dotenv.config(); // Charger les variables d'environnement

/**
 * Fonction pour se connecter à la base de données avec une logique de retry
 */
const connectWithRetry = async (retries = 5, delay = 2000) => {
    while (retries > 0) {
        try {
            const db = await mysql.createConnection({
                host: process.env.DB_HOST, // Remplace par l'IP retournée par `minikube ip`
                port: process.env.DB_PORT,
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASSWORD,
                database: process.env.MYSQL_DATABASE
            });

            await db.connect();
            logger.info('Connecté à la base de données MySQL');
            return db;
        } catch (err) {
            logger.error(`Erreur de connexion à la base de données: ${err.message}`);
            retries -= 1;
            if (retries === 0) throw err;
            logger.info(`Nouvelle tentative dans ${delay / 1000} secondes...`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
};

/**
 * Fonction pour créer les tables si elles n'existent pas
 */
const createTables = async (db) => {
    const createUserTable = `
        CREATE TABLE IF NOT EXISTS User (
            id CHAR(36) PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL
        );
    `;

    const createHealthDataTable = `
        CREATE TABLE IF NOT EXISTS HealthData (
            id CHAR(36) PRIMARY KEY,
            userId CHAR(36) NOT NULL,
            poids FLOAT NOT NULL,
            taille FLOAT NOT NULL,
            date DATE NOT NULL,
            imc FLOAT NOT NULL,
            FOREIGN KEY (userId) REFERENCES User(id)
        );
    `;

    await db.execute(createUserTable);
    await db.execute(createHealthDataTable);

    logger.info('Tables créées avec succès');
};

dotenv.config(); // Charger les variables d'environnement. Retirez le .example du fichier .env.example

const db = await connectWithRetry();
await createTables(db);

export default db;