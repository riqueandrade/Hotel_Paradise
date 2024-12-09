const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcryptjs');
const db = require('../database/db');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const [users] = await db.query(
            'SELECT u.*, c.nome as cargo_nome FROM usuarios u JOIN cargos c ON u.cargo_id = c.id WHERE u.id = ?',
            [id]
        );
        done(null, users[0]);
    } catch (error) {
        done(error, null);
    }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Verifica se o usuário já existe
        const [users] = await db.query(
            'SELECT u.*, c.nome as cargo_nome FROM usuarios u JOIN cargos c ON u.cargo_id = c.id WHERE u.google_id = ?',
            [profile.id]
        );
        
        if (users.length > 0) {
            // Usuário já existe
            return done(null, users[0]);
        }

        // Usa o ID 3 que é o cargo de Recepcionista (definido no dados_iniciais.sql)
        const cargoId = 3;

        // Gera uma senha aleatória
        const randomPassword = Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);

        // Cria um novo usuário
        const [result] = await db.query(
            'INSERT INTO usuarios (nome, email, google_id, cargo_id, senha) VALUES (?, ?, ?, ?, ?)',
            [profile.displayName, profile.emails[0].value, profile.id, cargoId, hashedPassword]
        );

        // Busca o usuário recém-criado com o nome do cargo
        const [newUser] = await db.query(
            'SELECT u.*, c.nome as cargo_nome FROM usuarios u JOIN cargos c ON u.cargo_id = c.id WHERE u.id = ?',
            [result.insertId]
        );

        done(null, newUser[0]);
    } catch (error) {
        console.error('Erro na autenticação Google:', error);
        done(error, null);
    }
})); 