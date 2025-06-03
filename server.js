require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { google } = require('googleapis');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Remova a linha abaixo se for usar Conta de Serviço
// const YOUR_API_KEY = process.env.API_KEY_GOOGLE_SHEETS;

const sheetId = process.env.SHEET_ID;

// --- CONFIGURAÇÃO CORRETA PARA CONTA DE SERVIÇO ---
const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'], // Escopo para leitura
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Aponta para o arquivo JSON
});

// Crie o cliente sheets usando o objeto de autenticação 'auth'
const sheets = google.sheets({ version: 'v4', auth: auth }); // <-- Use 'auth' aqui!

// Função para buscar dados da planilha
async function getSheetData() {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: 'Página1!A:B',
            // Não precisa de 'auth: auth' aqui novamente, pois 'sheets' já foi inicializado com 'auth'
        });
        return response.data.values;
    } catch (error) {
        console.error('Erro ao buscar dados da planilha:', error);
        return null;
    }
}

// Serve arquivos estáticos do frontend
app.use(express.static('public'));

// WebSockets: Lidar com conexões
io.on('connection', (socket) => {
    console.log('Um cliente conectado:', socket.id);

    // Envia os dados iniciais assim que um cliente se conecta
    getSheetData().then(data => {
        if (data) {
            socket.emit('sheetData', data);
        }
    });

    // Você pode configurar um intervalo para buscar atualizações periodicamente
    // Em um ambiente de produção real, você poderia usar webhooks do Google ou Google Apps Script
    // para acionar o backend quando a planilha for alterada.
    const interval = setInterval(async () => {
        const data = await getSheetData();
        if (data) {
            io.emit('sheetData', data); // Envia para todos os clientes conectados
        }
    }, 5000); // A cada 5 segundos (ajuste conforme a necessidade)

    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
        clearInterval(interval); // Limpa o intervalo quando o cliente desconecta
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});