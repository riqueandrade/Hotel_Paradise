const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    console.log('Headers:', req.headers);
    
    // Obtém o token do header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        console.log('Token não fornecido');
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    // O token vem no formato "Bearer token"
    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
        console.log('Token mal formatado (partes):', parts);
        return res.status(401).json({ error: 'Erro no token' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        console.log('Token mal formatado (scheme):', scheme);
        return res.status(401).json({ error: 'Token mal formatado' });
    }

    // Verifica se o token é válido
    jwt.verify(token, process.env.JWT_SECRET || 'hotel_paradise_secret', (err, decoded) => {
        if (err) {
            console.log('Erro na verificação do token:', err);
            return res.status(401).json({ error: 'Token inválido' });
        }

        console.log('Token decodificado:', decoded);
        
        // Salva o ID do usuário para uso nas rotas
        req.userId = decoded.id;
        return next();
    });
}; 