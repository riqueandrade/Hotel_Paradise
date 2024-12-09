const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./database');
const bcrypt = require('bcryptjs');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const [users] = await pool.execute(
            'SELECT * FROM usuarios WHERE id = ?',
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
    callbackURL: "http://localhost:3000/api/auth/google/callback",
    passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        // Verifica se o usuário já existe
        const [existingUsers] = await pool.execute(
            'SELECT * FROM usuarios WHERE google_id = ? OR email = ?',
            [profile.id, profile.emails[0].value]
        );

        if (existingUsers.length > 0) {
            // Atualiza o google_id se necessário
            if (!existingUsers[0].google_id) {
                await pool.execute(
                    'UPDATE usuarios SET google_id = ? WHERE id = ?',
                    [profile.id, existingUsers[0].id]
                );
            }
            return done(null, existingUsers[0]);
        }

        // Cria um novo usuário
        const [result] = await pool.execute(
            'INSERT INTO usuarios (nome, email, google_id, senha, cargo_id) VALUES (?, ?, ?, ?, ?)',
            [
                profile.displayName,
                profile.emails[0].value,
                profile.id,
                await bcrypt.hash(Math.random().toString(36), 10), // Senha aleatória
                3 // Cargo padrão (ajuste conforme necessário)
            ]
        );

        const [newUser] = await pool.execute(
            'SELECT * FROM usuarios WHERE id = ?',
            [result.insertId]
        );

        done(null, newUser[0]);
    } catch (error) {
        done(error, null);
    }
})); 