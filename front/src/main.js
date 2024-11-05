import { createApp } from 'vue'; // Utilise createApp pour Vue 3
import App from './App.vue';
import router from './router';

createApp(App)
    .use(router) // Utilise le router
    .mount('#app');
