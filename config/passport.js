const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../database/db');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const [users] = await db.query('SELECT * FROM usuarios WHERE id = ?', [id]);
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
        const [users] = await db.query('SELECT * FROM usuarios WHERE google_id = ?', [profile.id]);
        
        if (users.length > 0) {
            // Usuário já existe
            return done(null, users[0]);
        }

        // Busca o cargo de funcionário
        const [cargos] = await db.query('SELECT id FROM cargos WHERE nome = ?', ['Funcionario']);
        const cargoId = cargos[0]?.id || 3; // Usa o ID 3 (Recepcionista) como fallback

        // Cria um novo usuário
        const [result] = await db.query(
            'INSERT INTO usuarios (nome, email, google_id, cargo_id) VALUES (?, ?, ?, ?)',
            [profile.displayName, profile.emails[0].value, profile.id, cargoId]
        );

        const [newUser] = await db.query('SELECT * FROM usuarios WHERE id = ?', [result.insertId]);
        done(null, newUser[0]);
    } catch (error) {
        done(error, null);
    }
})); 