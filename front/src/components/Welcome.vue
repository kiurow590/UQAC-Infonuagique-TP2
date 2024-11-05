<template>
  <div class="welcome">
    <div class="top-right-button">
      <button @click="redirectToLink">Exit</button>
    </div>

    <div>
      <!-- Si les données sont en train d'être récupérées, afficher un message de chargement -->
      <h1 v-if="loading">Bienvenue.</h1>

      <!-- Si les données sont récupérées, afficher la donnée -->
      <h1 v-else>Bienvenue, {{ userName }}</h1>
    </div>

    <div class="input-container">
      <label>Taille (en cm) :</label>
      <input type="number" v-model="taille" required />
    </div>

    <div class="input-container">
      <label>Poids (en kg) :</label>
      <input type="number" v-model="poids" required />
    </div>

    <div class="input-container">
      <label>Date (jj/mm/aaaa) :</label>
      <input type="text" v-model="date" placeholder="jj/mm/aaaa" required />
    </div>

    <button @click="calculateIMC">Calculer IMC</button>

    <p v-if="imc">Votre IMC est de {{ imc.toFixed(2) }}</p>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <p></p>

    <select v-model="selectedMetric" @change="updateChart">
      <option value="poids">Poids</option>
      <option value="taille">Taille</option>
      <option value="imc">IMC</option>
    </select>

    <h1 v-if="loadingTab">Loading...</h1>
    <h1 v-else>Table d'évolution</h1>

    <canvas id="myChart" class="my-chart"></canvas>

  </div>
</template>

<script>
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);



function formatDateToISO(dateStr) {
    // Vérifie que la date est au format jj/mm/aaaa
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateStr.match(regex);

    if (!match) {
        throw new Error('Format de date invalide. Utilisez jj/mm/aaaa.');
    }

    const day = match[1];
    const month = match[2];
    const year = match[3];

    // Crée un objet Date avec les valeurs correspondantes (mois de 0 à 11)
    const date = new Date(Date.UTC(year, month - 1, day));

    // Retourne la date au format ISO
    return date.toISOString();
}

export default {
  name: 'WelcomeComponent',
  data() {
    return {
      uid: this.$route.query.uid,
      userName: null,
      taille: '',
      poids: '',
      date: '',
      imc: null,
      errorMessage: '',
      selectedMetric: 'poids',
      dataList: [],
      loading: true,
      loadingTab: true,
      chart: null
    };
  },
  methods: {
    redirectToLink() {
      window.location.href = 'http://localhost:8080/';
    },
    validateDate(date) {
      const regex = /^\d{2}\/\d{2}\/\d{4}$/;
      return regex.test(date);
    },
    async calculateIMC() {
      if (!this.taille || !this.poids || !this.date) {
        this.errorMessage = 'Veuillez remplir tous les champs.';
        return;
      }

      if (this.taille < 0) {
        this.errorMessage = 'Veuillez remplir une taille positive.';
        return;
      }

      if (this.poids < 0) {
        this.errorMessage = 'Veuillez remplir un poids positive.';
        return;
      }

      if (!this.validateDate(this.date)) {
        this.errorMessage = 'Veuillez entrer une date valide au format jj/mm/aaaa.';
        return;
      }

      const d = formatDateToISO(this.date)

      try {
        const response = await fetch('http://localhost:3000/users/sendHealthData', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userID: this.uid,
            poids: this.poids,
            taille: this.taille,
            date: d
          })
        });

        if (!response.ok) {
          throw new Error('Erreur de connexion');
        }

        const data = await response.json();
        this.imc = data.value
        console.log(data);
      } catch (error) {
        this.loginError = error.message;
        console.error(this.loginError);
      }

      try {
        const response = await fetch('http://localhost:3000/users/getData/' + this.uid, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Erreur de connexion');
        }

        const data = await response.json();
        this.dataList = data.data
        this.updateChart();
      } catch (error) {
        this.loginError = error.message;
        console.error(this.loginError);
      }

      this.errorMessage = '';
    },
    updateChart() {
      const labels = this.dataList.map(data => data.date);
      const dataValues = this.dataList.map(data => data[this.selectedMetric]);

      if (this.chart) {
        this.chart.destroy(); // Détruit l'ancien graphique
      }

      const ctx = document.getElementById('myChart').getContext('2d');
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: this.selectedMetric.charAt(0).toUpperCase() + this.selectedMetric.slice(1),
            data: dataValues,
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            fill: false
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }


  },


  async mounted() {

    fetch(`http://localhost:3000/users/getName/` + this.uid,) // Remplace par ton endpoint API réel
      .then(response => {
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des données");
        }
        return response.json();  // Pour une chaîne de caractères
      })
      .then(data => {
        this.userName = data.nom;  // Stocker les données dans l'état
        this.loading = false;  // Fin du chargement
      })
      .catch(error => {
        console.error(error);  // Gérer l'erreur (log, notification, etc.)
        this.loading = false;  // Fin du chargement même en cas d'erreur
      });


    fetch(`http://localhost:3000/users/getData/` + this.uid,) // Remplace par ton endpoint API réel
      .then(response => {
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des données");
        }
        return response.json();  // Pour une chaîne de caractères
      })
      .then(data => {
        this.dataList = data.data;  // Stocker les données dans l'état
        this.loadingTab = false;  // Fin du chargement
        this.updateChart();
      })
      .catch(error => {
        console.error(error);  // Gérer l'erreur (log, notification, etc.)
        this.loadingTab = false;  // Fin du chargement même en cas d'erreur
      });

    this.updateChart();
  }
};


</script>

<style scoped>
.welcome {
  text-align: center;
  margin-top: 50px;
}

.input-container {
  margin-bottom: 1em;
}

.error {
  color: red;
}

.my-chart {
  position: relative;
  width: 75%;
  margin: auto;
}

.top-right-button {
  position: absolute;
  top: 10px;
  right: 10px;
}


</style>
