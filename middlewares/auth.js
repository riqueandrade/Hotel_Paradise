const jwt = require('jsonwebtoken');

// Mapeamento de permissões por cargo (exatamente como está no banco de dados)
const permissoesPorCargo = {
    'Administrador': ['*'], // Acesso total
    'Gerente': [
        'reservas', 'quartos', 'funcionarios', 'relatorios', 'tipos_quarto',
        'clientes', 'produtos', 'configuracoes', 'dashboard'
    ],
    'Recepcionista': [
        'reservas', 'quartos', 'clientes', 'produtos', 'dashboard'
    ],
    'Camareira': [
        'quartos', 'dashboard'
    ],
    'Financeiro': [
        'pagamentos', 'relatorios', 'produtos', 'dashboard'
    ],
    'Manutenção': [
        'quartos', 'dashboard'
    ],
    'Atendente': [
        'produtos', 'consumos', 'dashboard'
    ]
};

// Middleware de autenticação
const authMiddleware = (req, res, next) => {
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
        console.log('Cargo do usuário:', decoded.cargo);
        
        // Salva os dados do usuário para uso nas rotas
        req.userId = decoded.id;
        req.userCargo = decoded.cargo;

        // Verifica se o cargo existe no mapeamento
        if (!permissoesPorCargo[req.userCargo]) {
            console.log('Cargo não encontrado no mapeamento:', req.userCargo);
            return res.status(403).json({ 
                error: 'Acesso negado',
                message: `Cargo '${req.userCargo}' não tem permissões definidas no sistema`
            });
        }

        return next();
    });
};

// Middleware de autorização baseado no cargo
const authorize = (recursos) => {
    return (req, res, next) => {
        const cargo = req.userCargo;
        console.log('Verificando permissões para cargo:', cargo);
        console.log('Recursos necessários:', recursos);
        console.log('Permissões disponíveis:', permissoesPorCargo[cargo]);
        
        if (!cargo || !permissoesPorCargo[cargo]) {
            console.log('Cargo não encontrado ou sem permissões:', cargo);
            return res.status(403).json({ 
                error: 'Acesso negado',
                message: `Cargo '${cargo}' não tem permissões definidas no sistema`
            });
        }

        // Administrador tem acesso total
        if (permissoesPorCargo[cargo].includes('*')) {
            console.log('Acesso de administrador concedido');
            return next();
        }

        // Verifica se o cargo tem permissão para acessar o recurso
        const temPermissao = recursos.some(recurso => 
            permissoesPorCargo[cargo].includes(recurso)
        );

        console.log('Tem permissão?', temPermissao);

        if (!temPermissao) {
            console.log('Permissão negada para o recurso');
            return res.status(403).json({ 
                error: 'Acesso negado',
                message: `Cargo '${cargo}' não tem permissão para acessar este recurso`
            });
        }

        console.log('Permissão concedida');
        next();
    };
};

module.exports = {
    authMiddleware,
    authorize
}; 