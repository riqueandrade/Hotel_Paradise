const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Obtém o token do header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    // O token vem no formato "Bearer token"
    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
        return res.status(401).json({ error: 'Erro no token' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ error: 'Token mal formatado' });
    }

    // Verifica se o token é válido
    jwt.verify(token, process.env.JWT_SECRET || 'hotel_paradise_secret', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token inválido' });
        }

        // Salva o ID do usuário para uso nas rotas
        req.userId = decoded.id;
        return next();
    });
}; 