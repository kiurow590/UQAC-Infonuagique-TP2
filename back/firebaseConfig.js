/**
 * IMPORTS
 */
import admin from 'firebase-admin';
import {getAuth} from 'firebase/auth';
import {getDatabase} from 'firebase-admin/database';
import {initializeApp} from 'firebase/app';
import serviceAccount from './imc-infonuagique-firebase-adminsdk-j3xx0-f05bc01d2d.json' assert {type: 'json'}; // Remplacez par le chemin vers votre fichier de clé de compte de service

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://imc-infonuagique-default-rtdb.firebaseio.com'
});


// Initialiser Firebase avec les configurations pour le frontend
const firebaseConfig = {
    apiKey: "AIzaSyBMpcXiG_RlDrh2s6o-YqOk2u6re8sBc5I",
    authDomain: "imc-infonuagique.firebaseapp.com",
    projectId: "imc-infonuagique",
    storageBucket: "imc-infonuagique.appspot.com",
    messagingSenderId: "346593808424",
    appId: "1:346593808424:web:85834d13172648cf86651d",
    measurementId: "G-4DDQVDW3XL"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase();

export {auth, database};