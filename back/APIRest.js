import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import db from './BDDConfig.js';
import { logger } from './logger.mjs';
import bodyParser from 'body-parser';

/**
 * CONSTANTES
 */
const app = express();
// CORS configuration
const corsOptions = {
    origin: ["http://localhost:8080", "http://localhost:3000"], // Specify allowed origins
    methods: ["GET", "POST", "PUT", "DELETE"], // Specify allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
    credentials: true // Allow credentials
};

const port = process.env.PORT;

/**
 * APPLICATION
 */

app.use(cors(/*corsOptions*/)); // Configurer CORS avec les options spécifiées
app.use(express.json()); // Middleware to parse JSON requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Example route to print req.body
app.post('/example', (req, res) => {
    console.log(req.body); // Print req.body to the console
    res.send('Check the console for req.body');
});

/**
 * ROUTES DE L'API POUR CREER UN UTILISATEUR
 */
app.post('/users/signup', async (req, res) => {
    const { email, password, name } = req.body; // Récupérer les données de la requête
    logger.info('Inscription de l\'utilisateur:', email);
    logger.info('Données de l\'utilisateur:', req.body);

    if (!email || !password || !name) { // Vérifier que les données sont bien présentes
        return res.status(400).send('Missing email, password, or name');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Hacher le mot de passe
        const userID = uuidv4();
        const [result] = await db.execute(
            'INSERT INTO User (id, email, password, name) VALUES (?, ?, ?, ?)',
            [userID, email, hashedPassword, name]
        );
        logger.debug('Utilisateur inscrit:', result);
        return res.status(200).json({ message: "Sign Up success", value: userID}); // Retourner une réponse au client
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            logger.error('Cet email est déjà utilisé:', error.message);
            return res.status(409).json('Cet email est déjà utilisé.');
        } else {
            logger.error('Erreur Serveur lors de l\'inscription:', error.message);
            return res.status(500).send('Erreur Serveur lors de l\'inscription');
        }
    }
});
/**
 * ROUTES DE L'API POUR SE CONNECTER
 */
app.post('/users/login', async (req, res) => {
    const { email, password } = req.body; // Récupérer les données de la requête

    logger.info('Connexion de l\'utilisateur:', email);
    logger.info('Données de l\'utilisateur:', req.body);

    if (!email || !password) { // Vérifier que les données sont bien présentes
        return res.status(400).send('Missing email or password');
    }

    try {
        const [rows] = await db.execute('SELECT * FROM User WHERE email = ?', [email]);
        const existingUser = rows[0];
        if (!existingUser || !await bcrypt.compare(password, existingUser.password)) { // Vérifier le mot de passe
            logger.error('Erreur lors de la connexion: Utilisateur ou mot de passe incorrect');
            return res.status(401).send('Erreur lors de la connexion');
        }
        logger.info('Utilisateur connecté:', existingUser);
        return res.status(200).json({ message: "Authentification success", value: existingUser.id }); // Retourner une réponse au client
    } catch (error) {
        logger.error('Erreur lors de la connexion:', error.message);
        return res.status(500).send('Erreur lors de la connexion');
    }
});

/**
 * ROUTES DE L'API POUR RECUPERER LE NOM DE L'UTILISATEUR
 */
app.get('/users/getName/:userId', async (req, res) => {
    const { userId } = req.params; // Récupérer les données de la requête
    logger.info('Récupération du nom de l\'utilisateur:', userId);
    try {
        const [rows] = await db.execute('SELECT name FROM User WHERE id = ?', [userId]);
        const existingUser = rows[0];
        if (!existingUser) {
            return res.status(400).json({ message: "User not found" });
        }
        return res.status(200).json({ name: existingUser.name }); // Retourner le nom de l'utilisateur
    } catch (error) {
        logger.error('Erreur Serveur lors de la récupération du nom:', error.message);
        return res.status(500).send('Erreur Serveur lors de la récupération du nom');
    }
});

/**
 * ROUTES DE L'API POUR RECUPERER LES DONNEES DE L'UTILISATEUR
 */
app.get('/users/getData/:userId', async (req, res) => {
    const { userId } = req.params; // Récupérer les données de la requête
    logger.info('Récupération des données de l\'utilisateur:', userId);
    try {
        const [rows] = await db.execute('SELECT * FROM HealthData WHERE userId = ? ORDER BY date ASC', [userId]);
        if (!rows.length) {
            return res.status(200).send('No data found for this user');
        }
        return res.status(200).json({ data: rows }); // Retourner les données de santé
    } catch (error) {
        logger.error('Erreur Serveur lors de la récupération des données:', error.message);
        return res.status(500).send('Erreur Serveur lors de la récupération des données');
    }
});

/**
 * ROUTES DE L'API POUR AJOUTER DES DONNEES EN BASE DE DONNEES
 */
app.put('/users/sendHealthData', async (req, res) => {
    const { userId, poids, taille, date } = req.body; // Récupérer les données de la requête
    logger.info('Ajout des données de santé pour l\'utilisateur:', userId);
    logger.info('Données de santé:');
    logger.info('poids:', poids);
    logger.info('taille:', taille);
    logger.info('date:', date);
    if (!userId || !poids || !taille || !date) { // Vérifier que les données sont bien présentes
        logger.error("userId, poids, taille, ou date manquant.");
        return res.status(400).send('Missing userId, poids, taille, or date');
    }

    try {
        const [userRows] = await db.execute('SELECT * FROM User WHERE id = ?', [userId]);
        const existingUser = userRows[0];
        if (!existingUser) {
            return res.status(404).send('Utilisateur non trouvé');
        }

        const imc = calculerIMC(poids, taille); // Calculer l'IMC
        const [result] = await db.execute(
            'INSERT INTO HealthData (id, userId, poids, taille, date, imc) VALUES (?, ?, ?, ?, ?, ?)',
            [uuidv4(), userId, poids, taille, date, imc]
        );
        logger.info(result);
        logger.info(`Données de santé pour l'utilisateur ${userId} ajoutées avec succès.`);
        return res.status(201).json({ message: "Données de santé ajoutées avec succès", value: imc }); // Retourner une réponse au client
    } catch (error) {
        logger.error('Erreur Serveur lors de l\'ajout des données de santé:', error.message);
        return res.status(500).send('Erreur Serveur lors de l\'ajout des données de santé');
    }
});

/**
 * Calculer l'IMC
 * @param poids     poids en kg
 * @param taille  taille en cm
 * @returns {number} IMC
 */
function calculerIMC(poids, taille) {
    taille = taille / 100; // Conversion de la taille en m
    return poids / (taille * taille); // Calculer l'IMC
}

// Démarrer le serveur
app.listen(port, () => {
    logger.info(`API REST : Exécution sur http://localhost:${port}`);
});