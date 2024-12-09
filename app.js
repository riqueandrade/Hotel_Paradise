const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const passport = require('passport');
require('dotenv').config();
require('./config/passport');
const cors = require('cors');

const app = express();

// Configurações
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'hotel_paradise_secret',
    resave: false,
    saveUninitialized: true
}));

// Inicialização do Passport
app.use(passport.initialize());
app.use(passport.session());

// Middlewares
app.use(cors());

// Arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/quartos', require('./routes/api/quartos'));
app.use('/api/produtos', require('./routes/api/produtos'));
app.use('/api/relatorios', require('./routes/api/relatorios'));
app.use('/api/usuarios', require('./routes/api/usuarios'));
app.use('/api/configuracoes', require('./routes/api/configuracoes'));
app.use('/api/dashboard', require('./routes/api/dashboard'));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

// Rota para todas as páginas HTML
app.get('*.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', path.basename(req.url)));
});

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Algo deu errado!' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
}); 