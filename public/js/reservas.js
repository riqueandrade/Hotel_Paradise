document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('token');
    
    // Se não houver token, redireciona para o login
    if (!token) {
        console.log('Token não encontrado, redirecionando para login');
        window.location.href = '/html/login.html';
        return;
    }

    try {
        console.log('Verificando token...');
        // Verifica se o token é válido
        const response = await fetch('/api/auth/verify', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Token inválido');
        }

        const data = await response.json();
        console.log('Token verificado, usuário:', data.user);

        // Inicializa os modais
        window.modalNovaReserva = new bootstrap.Modal(document.getElementById('modalNovaReserva'));

        // Inicializa máscaras e validações
        initializeMasks();
        initializeValidations();

        // Carrega os dados iniciais
        await Promise.all([
            carregarReservas(),
            carregarClientes(),
            carregarQuartos(),
            carregarEstatisticas()
        ]);

        // Adiciona eventos de filtro
        document.getElementById('searchInput').addEventListener('input', debounce(aplicarFiltros, 500));
        document.getElementById('statusFilter').addEventListener('change', aplicarFiltros);
        document.getElementById('periodoFilter').addEventListener('change', aplicarFiltros);
        document.getElementById('sortBy').addEventListener('change', aplicarFiltros);

    } catch (error) {
        console.error('Erro de autenticação:', error);
        localStorage.removeItem('token');
        alert('Sua sessão expirou ou você não tem permissão para acessar esta página. Você será redirecionado para a página de login.');
        window.location.href = '/html/login.html';
    }
});

// Função para carregar estatísticas
async function carregarEstatisticas() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/reservas/estatisticas', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Erro ao carregar estatísticas');
        }

        const data = await response.json();
        
        // Atualiza os cards
        document.getElementById('checkinHoje').textContent = data.checkinHoje;
        document.getElementById('checkoutHoje').textContent = data.checkoutHoje;
        document.getElementById('quartosOcupados').textContent = data.quartosOcupados;
        document.getElementById('reservasPendentes').textContent = data.reservasPendentes;
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        showToast('Erro ao carregar estatísticas: ' + error.message, 'error');
    }
}

// Função para carregar a lista de reservas
async function carregarReservas(pagina = 1, filtros = {}) {
    try {
        const token = localStorage.getItem('token');
        const queryParams = new URLSearchParams({
            pagina: Number(pagina).toString(),
            busca: filtros.busca || '',
            status: filtros.status || '',
            periodo: filtros.periodo || '',
            ordenacao: filtros.ordenacao || 'data_entrada'
        });

        const response = await fetch(`/api/reservas?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Erro ao carregar reservas');
        }

        const data = await response.json();
        
        if (!data.reservas) {
            throw new Error('Dados de reservas inválidos');
        }

        atualizarTabelaReservas(data.reservas);
        if (data.totalPaginas) {
            atualizarPaginacao(Number(data.totalPaginas), Number(data.paginaAtual));
        }
    } catch (error) {
        console.error('Erro ao carregar reservas:', error);
        showToast('Erro ao carregar lista de reservas: ' + error.message, 'error');
    }
}

// Função para carregar clientes
async function carregarClientes() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/clientes', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Erro ao carregar clientes');
        }

        const clientes = await response.json();
        const select = document.querySelector('#formNovaReserva [name="cliente_id"]');
        
        select.innerHTML = '<option value="">Selecione um cliente</option>' +
            clientes.map(cliente => `
                <option value="${cliente.id}">${cliente.nome} - ${cliente.cpf}</option>
            `).join('');
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        showToast('Erro ao carregar lista de clientes: ' + error.message, 'error');
    }
}

// Função para carregar quartos
async function carregarQuartos() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/quartos/disponiveis', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Erro ao carregar quartos');
        }

        const quartos = await response.json();
        const select = document.querySelector('#formNovaReserva [name="quarto_id"]');
        
        select.innerHTML = '<option value="">Selecione um quarto</option>' +
            quartos.map(quarto => `
                <option value="${quarto.id}" data-diaria="${quarto.preco_diaria}">
                    ${quarto.numero} - ${quarto.tipo_nome} (R$ ${quarto.preco_diaria})
                </option>
            `).join('');
    } catch (error) {
        console.error('Erro ao carregar quartos:', error);
        showToast('Erro ao carregar lista de quartos: ' + error.message, 'error');
    }
}

// Função para mostrar toast
function showToast(message, type = 'success') {
    const toastContainer = document.querySelector('.toast-container');
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : 'success'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Função para inicializar máscaras
function initializeMasks() {
    // Implementar se necessário
}

// Função para inicializar validações
function initializeValidations() {
    // Implementar se necessário
}

// Função para aplicar filtros
function aplicarFiltros() {
    // Implementar se necessário
}

// Função para debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
} 