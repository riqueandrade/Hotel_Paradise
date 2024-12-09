// Mapeamento de páginas para permissões necessárias
const pagePermissions = {
    'dashboard.html': ['dashboard.basico'],
    'reservas.html': ['reservas.visualizar'],
    'clientes.html': ['clientes.visualizar'],
    'quartos.html': ['quartos.visualizar'],
    'produtos.html': ['produtos.visualizar'],
    'relatorios.html': ['relatorios'],
    'configuracoes.html': ['configuracoes']
};

// Função para decodificar o token JWT
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Erro ao decodificar token:', e);
        return null;
    }
}

// Função para verificar se o usuário tem permissão para acessar uma página
function hasPermission(userCargo, requiredPermissions) {
    // Se não há permissões requeridas, permite acesso
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    // Administrador tem acesso total
    if (userCargo === 'Administrador') return true;

    // Verifica cada permissão requerida
    return requiredPermissions.some(permission => {
        const [category, action] = permission.split('.');
        return permissoesPorCargo[userCargo]?.some(userPerm => {
            // Permissão exata
            if (userPerm === permission) return true;
            // Permissão por categoria
            const [userCategory, userAction] = userPerm.split('.');
            return userCategory === category;
        });
    });
}

// Função para redirecionar para a primeira página permitida
function redirectToFirstAllowedPage(userCargo) {
    const pages = Object.entries(pagePermissions);
    for (const [page, permissions] of pages) {
        if (hasPermission(userCargo, permissions)) {
            window.location.href = `/html/${page}`;
            return;
        }
    }
    // Se não encontrar nenhuma página permitida, redireciona para o login
    window.location.href = '/html/login.html';
}

// Função para atualizar a sidebar com base nas permissões
function updateSidebar() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/html/login.html';
        return;
    }

    const decoded = parseJwt(token);
    if (!decoded) {
        localStorage.removeItem('token');
        window.location.href = '/html/login.html';
        return;
    }

    const userCargo = decoded.cargo;

    // Atualiza os links da sidebar
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        const page = link.getAttribute('href').split('/').pop();
        const permissions = pagePermissions[page];

        if (!hasPermission(userCargo, permissions)) {
            link.classList.add('disabled');
            link.style.opacity = '0.5';
            link.style.pointerEvents = 'none';
            link.setAttribute('title', 'Sem permissão para acessar esta página');
        }
    });

    // Verifica se a página atual é permitida
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage && currentPage !== 'login.html') {
        const requiredPermissions = pagePermissions[currentPage];
        if (!hasPermission(userCargo, requiredPermissions)) {
            redirectToFirstAllowedPage(userCargo);
        }
    }
}

// Mapeamento de permissões por cargo
const permissoesPorCargo = {
    'Administrador': ['*'],
    'Gerente': [
        'reservas', 'quartos', 'funcionarios', 'relatorios', 'tipos_quarto',
        'clientes', 'produtos', 'configuracoes', 'dashboard', 'consumos'
    ],
    'Recepcionista': [
        'reservas.visualizar',
        'reservas.criar',
        'reservas.editar',
        'quartos.visualizar',
        'clientes.visualizar',
        'clientes.criar',
        'clientes.editar',
        'checkin',
        'checkout',
        'dashboard.basico'
    ],
    'Atendente': [
        'produtos.visualizar',
        'consumos.criar',
        'consumos.visualizar',
        'clientes.visualizar',
        'dashboard.basico'
    ],
    'Camareira': [
        'quartos.status',
        'dashboard.basico'
    ],
    'Financeiro': [
        'pagamentos',
        'relatorios',
        'produtos.precos',
        'dashboard.financeiro'
    ],
    'Manutenção': [
        'quartos.manutencao',
        'dashboard.basico'
    ]
};

// Inicializa a sidebar quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', updateSidebar); 