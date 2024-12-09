const jwt = require('jsonwebtoken');

// Mapeamento de permissões por cargo
const permissoesPorCargo = {
    'Administrador': ['*'],
    'Gerente': ['*'],
    'Recepcionista': [
        'reservas',
        'quartos',
        'clientes',
        'checkin',
        'checkout',
        'dashboard'
    ],
    'Atendente': [
        'produtos',
        'consumos',
        'clientes',
        'dashboard'
    ],
    'Camareira': [
        'quartos',
        'dashboard'
    ],
    'Financeiro': [
        'pagamentos',
        'relatorios',
        'produtos',
        'dashboard'
    ],
    'Manutenção': [
        'quartos',
        'dashboard'
    ]
};

// Middleware de autenticação
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
        return res.status(401).json({ error: 'Token mal formatado' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ error: 'Token mal formatado' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'hotel_paradise_secret', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Token inválido' });
        }

        req.userId = decoded.id;
        req.userCargo = decoded.cargo;

        if (!permissoesPorCargo[req.userCargo]) {
            return res.status(403).json({ 
                error: 'Acesso negado',
                message: `Cargo '${req.userCargo}' não tem permissões definidas`
            });
        }

        return next();
    });
};

// Middleware de autorização
const authorize = (recursos) => {
    return (req, res, next) => {
        const cargo = req.userCargo;
        
        // Administrador e Gerente têm acesso total
        if (cargo === 'Administrador' || cargo === 'Gerente') {
            return next();
        }

        // Verifica se o cargo tem permissão para todos os recursos necessários
        const permissoes = permissoesPorCargo[cargo] || [];
        const temPermissao = recursos.every(recurso => permissoes.includes(recurso));

        if (!temPermissao) {
            return res.status(403).json({ 
                error: 'Acesso negado',
                message: `Cargo '${cargo}' não tem permissão para acessar este recurso`
            });
        }

        next();
    };
};

module.exports = {
    authMiddleware,
    authorize
}; 