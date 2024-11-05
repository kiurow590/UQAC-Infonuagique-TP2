<template>
    <div class="login-container">
        <div class="login-form">
            <h2>Connexion</h2>
            <form @submit.prevent="login">
                <div>
                    <label>Email :</label>
                    <input type="email" v-model="email" required />
                </div>
                <div>
                    <label>Mot de passe :</label>
                    <input type="password" v-model="password" required />
                </div>
                <button type="submit">Se connecter</button>
            </form>
        </div>
        <div class="signup-form">
            <h2>Inscription</h2>
            <form @submit.prevent="signup">
                <div>
                    <label>Nom :</label>
                    <input type="text" v-model="name" required />
                </div>
                <div>
                    <label>Email :</label>
                    <input type="email" v-model="emailSignup" required />
                </div>
                <div>
                    <label>Mot de passe :</label>
                    <input type="password" v-model="passwordSignup" required />
                </div>
                <button type="submit">S'inscrire</button>
            </form>
        </div>
    </div>
</template>

<script>
export default {
    name: 'LoginComponent',
    data() {
        return {
            email: '',
            password: '',
            name: '',
            emailSignup: '',
            passwordSignup: '',
            loginError: "mail ou mot de passe incorrect"
        };
    },
    methods: {
        async login() {
            try {
                const response = await fetch('http://localhost:3000/users/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user: this.email,
                        password: this.password
                    })
                });

                if (!response.ok) {
                    alert(`Erreur : ${this.loginError}`);
                    throw new Error(this.loginError);
                }

                const data = await response.json();
                console.log(data);
                this.$router.push({ path: '/welcome', query: { uid: data.value } });
            } catch (error) {
                this.loginError = error.message;
                console.error(this.loginError);
            }
        },
        async signup() {
            try {
                const response = await fetch('http://localhost:3000/users/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user: this.emailSignup,
                        password: this.passwordSignup,
                        name: this.name
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    alert(`Erreur : ${data}`);
                    throw new Error(data);
                }

                console.log(data);
                this.$router.push({ path: '/welcome', query: { uid: data.value } });
            } catch (error) {
                alert(`Erreur : mot de passe trop court`);
                console.error(error.message);
            }
        }
    }
};
</script>



<style scoped>
.login-container {
    display: flex;
    justify-content: space-between;
    max-width: 800px;
    margin: auto;
    padding: 1em;
}

.login-form,
.signup-form {
    flex: 1;
    margin: 0 1em;
    padding: 1em;
    border: 1px solid #ccc;
    border-radius: 5px;
}

h2 {
    text-align: center;
}

input {
    width: 100%;
    padding: 0.5em;
    margin-bottom: 1em;
}
</style>
