const socket = io(); // Conecta-se ao servidor Socket.IO

let myChart; // Variável para armazenar a instância do Chart.js

socket.on('sheetData', (data) => {
    console.log('Dados recebidos do servidor:', data);

    if (!data || data.length === 0) {
        console.warn('Nenhum dado válido recebido.');
        return;
    }

    // Assumindo que a primeira coluna são labels e a segunda são valores
    const labels = data.map(row => row[0]); // Primeira coluna
    const values = data.map(row => parseFloat(row[1])); // Segunda coluna, convertendo para número

    if (myChart) {
        // Atualiza o gráfico existente
        myChart.data.labels = labels;
        myChart.data.datasets[0].data = values;
        myChart.update();
    } else {
        // Cria o gráfico pela primeira vez
        const ctx = document.getElementById('myChart').getContext('2d');
        myChart = new Chart(ctx, {
            type: 'line', // ou 'line', 'pie', etc.
            data: {
                labels: labels,
                datasets: [{
                    label: 'Pessoas impactadas Diretamente',
                    data: values,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
});

socket.on('connect_error', (error) => {
    console.error('Erro de conexão com Socket.IO:', error);
});