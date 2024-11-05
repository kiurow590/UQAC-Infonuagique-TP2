/**
 * IMPORTS
 */
import express, {Router} from 'express';
import cors from 'cors'
import {createUserWithEmailAndPassword, signInWithEmailAndPassword} from 'firebase/auth';
import {logger} from "./logger.mjs";
import {auth, database} from "./firebaseConfig.js";


/**
 * CONSTANTES
 */
const app = express();
const corsOption = {
    credential: true,
    orgin: ["http://localhost:8080/", "http://localhost:3000/"] // A changer en fonction de l'adresse IP de votre machine
}
const port = 3000;

/**
 * APPLICATION
 */
app.use(express.json(), cors(corsOption)); // pour parser les requêtes au format JSON


/**
 * ROUTES DE L'API POUR CREER UN UTILISATEUR
 */
app.post('/users/signup', async (req, res) => {
    const {user, password, name} = req.body; // Récupérer les données de la requête

    if (!user || !password || !name) { // Vérifier que les données sont bien présentes
        return res.status(400).send('Missing user, password, or name');
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, user, password); // Ajour de l'utilisateur dans la base de données Firebase
        logger.debug('Utilisateur inscrit:', userCredential.user);
        const userId = userCredential.user.uid; // Récupérer l'identifiant de l'utilisateur
        const utilisateursRef = database.ref(`utilisateurs/${userId}`); // Référence à l'emplacement de l'utilisateur dans la base de données
        await utilisateursRef.set({ // Ajouter l'utilisateur dans la base de données
            nom: name
        });
        return res.status(200).json({message: "Sign Up succes", value: userCredential.user.uid}); // Retourner une réponse au client
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
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
    const {user, password} = req.body; // Récupérer les données de la requête

    if (!user || !password) { // Vérifier que les données sont bien présentes
        return res.status(400).send('Missing user or password');
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, user, password); // Connexion de l'utilisateur
        logger.info('Utilisateur connecté:', userCredential.user); // Afficher un message dans la console
        return res.status(200).json({message: "Authentification succes", value: userCredential.user.uid}); // ajouter le token

    } catch (error) {
        logger.error('Erreur lors de la connexion:', error.message);
        return res.status(401).send('Erreur lors de la connexion');
    }
});

/**
 * ROUTES DE L'API POUR RECUPERER LE NOM DE L'UTILISATEUR
 */
app.get('/users/getName/:user', async (req, res) => {
    const {user} = req.params; // Récupérer les données de la requête
    logger.debug("Enter on getName : " + user)
    const refUtilisateurs = database.ref('utilisateurs'); // Référence à l'emplacement de la base de données
    const snapshot = await refUtilisateurs.once('value'); // Récupérer les données de la base de données
    const utilisateurs = snapshot.val(); // Récupérer les utilisateurs

    if (utilisateurs) { // Vérifier que les utilisateurs existent
        if (utilisateurs[user]) { // Vérifier que l'utilisateur existe
            return res.status(200).json({nom: utilisateurs[user].nom});
        } else {
            return res.status(400).json({message: "User not found"})
        }
    } else {
        console.log("Aucun utilisateur trouvé."); // Afficher un message dans la console
        return res.status(404).json({message: "Error server"}) // Retourner une erreur
    }
});


/**
 * ROUTES DE L'API POUR RECUPERER LES DONNEES DE L'UTILISATEUR
 */
app.get('/users/getData/:user', async (req, res) => {
    const {user} = req.params; // Récupérer les données de la requête
    logger.debug("Enter on getData : " + user)
    if (!user) { // Vérifier que les données sont bien présentes
        logger.error("Utilisateur manquant.");
        return res.status(400).send('Missing user');
    }

    const refUtilisateurs = database.ref('utilisateurs'); // Référence à l'emplacement de la base de données
    const snapshot = await refUtilisateurs.once('value'); // Récupérer les données de la base de données
    const utilisateurs = snapshot.val(); // Récupérer les utilisateurs
    try {
        if (utilisateurs) { // on verifie que les utilisateurs existent
            const utilisateur = utilisateurs[user]; // Récupérer l'utilisateur
            if (Array.isArray(utilisateur.data)) {
                (utilisateur.data).sort((a, b) => { // Trier les données par date
                    let da = new Date(a.date),
                        db = new Date(b.date);
                    return da - db;
                });
                return res.status(200).json({data: utilisateur.data}); // Retourner les données de l'utilisateur
            } else {
                logger.warn("Aucune donnée trouvée pour cet utilisateur.");
                return res.status(404).send('No data found for this user');
            }
        } else {
            logger.error("Aucun utilisateur trouvé.");
            return res.status(404).send('User not found');
        }
    } catch (error) {
        logger.error('Erreur Serveur lors de la récupération des données:', error.message);
        return res.status(500).send('Erreur Serveur lors de la récupération des données');
    }

});


/**
 * ROUTES DE L'API POUR AJOUTER DES DONNEES EN BASE DE DONNEES
 */
app.put('/users/sendHealthData', async (req, res) => {
    const {userID, poids, taille, date} = req.body; // Récupérer les données de la requête

    if (!userID || !poids || !taille || !date) { // Vérifier que les données sont bien
        logger.error("userID, poid, taille, ou IMC manquant.");
        return res.status(400).send('Missing userID, poid, taille, or IMC');
    }

    const utilisateursRef = database.ref(`utilisateurs/${userID}`); // Référence à l'emplacement de l'utilisateur dans la base de données
    const snapshot = await utilisateursRef.get(); // Récupérer les données de l'utilisateur

    if (snapshot.exists()) { // Vérifier que l'utilisateur existe
        const data = snapshot.val().data || []; // Récupérer les données de l'utilisateur
        const imc = calculerIMC(poids, taille); // Calculer l'IMC
        data.push({ // Ajouter les données de santé
            date: date,
            poids: poids,
            taille: taille,
            imc: imc
        });
        await utilisateursRef.update({data}); // Mettre à jour les données de l'utilisateur
        logger.info(`Données de santé pour l'utilisateur ${userID} ajoutées avec succès.`);
        return res.status(201).json({message: "Données de santé ajoutées avec succès", value: imc});
    } else {
        logger.error(`Utilisateur ${userID} non trouvé.`);
        return res.status(404).send('Utilisateur non trouvé');
    }
});

/**
 * Calculer l'IMC
 * @param poids     poids en kg
 * @param taille  taille en cm
 * @returns {number} IMC
 */
function calculerIMC(poids, taille) {
    taille = taille / 100 // Conversion de la taille en m
    return poids / (taille * taille);
}

// Démarrer le serveur
app.listen(port, () => {
    logger.info(`API REST : Exécution sur http://localhost:${port}`);
});