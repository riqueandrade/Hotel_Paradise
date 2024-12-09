const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function initDatabase() {
    try {
        // Primeiro, conecta sem selecionar um banco de dados
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS
        });

        console.log('Conectado ao MySQL');

        // Lê e executa o schema.sql
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        const schemaSql = await fs.readFile(schemaPath, 'utf8');
        
        // Divide o arquivo em comandos individuais
        const commands = schemaSql
            .split(';')
            .map(command => command.trim())
            .filter(command => command.length > 0);

        // Executa cada comando separadamente
        for (const command of commands) {
            await connection.query(command);
        }

        console.log('Schema criado com sucesso');

        // Lê e executa dados_iniciais.sql
        const dadosIniciaisPath = path.join(__dirname, '..', 'database', 'dados_iniciais.sql');
        const dadosIniciaisSql = await fs.readFile(dadosIniciaisPath, 'utf8');
        
        // Divide o arquivo em comandos individuais
        const dadosCommands = dadosIniciaisSql
            .split(';')
            .map(command => command.trim())
            .filter(command => command.length > 0);

        // Executa cada comando separadamente
        for (const command of dadosCommands) {
            await connection.query(command);
        }

        console.log('Dados iniciais inseridos com sucesso');

        await connection.end();
        console.log('Banco de dados inicializado com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
        process.exit(1);
    }
}

initDatabase(); 