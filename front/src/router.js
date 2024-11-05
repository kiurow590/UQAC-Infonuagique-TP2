import { createRouter, createWebHistory } from 'vue-router'; // Importation correcte pour Vue 3
import LoginComponent from './components/Login.vue';
import WelcomeComponent from './components/Welcome.vue';

const routes = [
    { path: '/', component: LoginComponent },
    { path: '/welcome', component: WelcomeComponent }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
