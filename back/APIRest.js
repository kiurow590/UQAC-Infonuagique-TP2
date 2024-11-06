// APIRest.js
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { User, HealthData } from './BDDConfig.js';
import { logger } from './logger.mjs';

/**
 * CONSTANTES
 */
const app = express();
const corsOption = {
    credential: true,
    origin: ["http://localhost:8080/", "http://localhost:3000/"]
};
const port = 3000;

/**
 * APPLICATION
 */
app.use(express.json(), cors(corsOption)); // pour parser les requêtes au format JSON

/**
 * ROUTES DE L'API POUR CREER UN UTILISATEUR
 */
app.post('/users/signup', async (req, res) => {
    const { user, password, name } = req.body; // Récupérer les données de la requête

    if (!user || !password || !name) { // Vérifier que les données sont bien présentes
        return res.status(400).send('Missing user, password, or name');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Hacher le mot de passe
        const newUser = await User.create({ email: user, password: hashedPassword, name }); // Créer un nouvel utilisateur
        logger.debug('Utilisateur inscrit:', newUser);
        return res.status(200).json({ message: "Sign Up success", value: newUser.id }); // Retourner une réponse au client
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
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
    const { user, password } = req.body; // Récupérer les données de la requête

    if (!user || !password) { // Vérifier que les données sont bien présentes
        return res.status(400).send('Missing user or password');
    }

    try {
        const existingUser = await User.findOne({ where: { email: user } }); // Trouver l'utilisateur par email
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
app.get('/users/getName/:user', async (req, res) => {
    const { user } = req.params; // Récupérer les données de la requête

    try {
        const existingUser = await User.findByPk(user); // Trouver l'utilisateur par ID
        if (!existingUser) {
            return res.status(400).json({ message: "User not found" });
        }
        return res.status(200).json({ nom: existingUser.name }); // Retourner le nom de l'utilisateur
    } catch (error) {
        logger.error('Erreur Serveur lors de la récupération du nom:', error.message);
        return res.status(500).send('Erreur Serveur lors de la récupération du nom');
    }
});

/**
 * ROUTES DE L'API POUR RECUPERER LES DONNEES DE L'UTILISATEUR
 */
app.get('/users/getData/:user', async (req, res) => {
    const { user } = req.params; // Récupérer les données de la requête

    try {
        const healthData = await HealthData.findAll({ where: { userId: user }, order: [['date', 'ASC']] }); // Trouver les données de santé par ID utilisateur
        if (!healthData.length) {
            return res.status(404).send('No data found for this user');
        }
        return res.status(200).json({ data: healthData }); // Retourner les données de santé
    } catch (error) {
        logger.error('Erreur Serveur lors de la récupération des données:', error.message);
        return res.status(500).send('Erreur Serveur lors de la récupération des données');
    }
});

/**
 * ROUTES DE L'API POUR AJOUTER DES DONNEES EN BASE DE DONNEES
 */
app.put('/users/sendHealthData', async (req, res) => {
    const { userID, poids, taille, date } = req.body; // Récupérer les données de la requête

    if (!userID || !poids || !taille || !date) { // Vérifier que les données sont bien présentes
        logger.error("userID, poids, taille, ou date manquant.");
        return res.status(400).send('Missing userID, poids, taille, or date');
    }

    try {
        const existingUser = await User.findByPk(userID); // Trouver l'utilisateur par ID
        if (!existingUser) {
            return res.status(404).send('Utilisateur non trouvé');
        }

        const imc = calculerIMC(poids, taille); // Calculer l'IMC
        const newHealthData = await HealthData.create({ userId: userID, poids, taille, date, imc }); // Créer de nouvelles données de santé
        logger.info(`Données de santé pour l'utilisateur ${userID} ajoutées avec succès.`);
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
    return poids / (taille * taille);
}

// Démarrer le serveur
app.listen(port, () => {
    logger.info(`API REST : Exécution sur http://localhost:${port}`);
});