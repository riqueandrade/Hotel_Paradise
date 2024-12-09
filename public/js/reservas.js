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

// Função para atualizar a tabela de reservas
function atualizarTabelaReservas(reservas) {
    const tbody = document.querySelector('#reservasTableBody');
    tbody.innerHTML = '';

    if (reservas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">Nenhuma reserva encontrada</td>
            </tr>
        `;
        return;
    }

    reservas.forEach(reserva => {
        const dataEntrada = new Date(reserva.data_entrada).toLocaleDateString('pt-BR');
        const dataSaida = new Date(reserva.data_saida).toLocaleDateString('pt-BR');
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${reserva.id}</td>
            <td>${reserva.cliente_nome}</td>
            <td>${reserva.quarto_numero}</td>
            <td>${dataEntrada}</td>
            <td>${dataSaida}</td>
            <td>R$ ${reserva.valor_total.toFixed(2)}</td>
            <td>
                <span class="badge bg-${getStatusColor(reserva.status)}">${reserva.status}</span>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="visualizarReserva(${reserva.id})">
                        <i class="bi bi-eye"></i>
                    </button>
                    ${getAcoesAdicionais(reserva)}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Função para atualizar a paginação
function atualizarPaginacao(totalPaginas, paginaAtual) {
    const paginacao = document.querySelector('.pagination');
    paginacao.innerHTML = '';

    // Botão Anterior
    const btnAnterior = document.createElement('li');
    btnAnterior.className = `page-item ${paginaAtual === 1 ? 'disabled' : ''}`;
    btnAnterior.innerHTML = `
        <a class="page-link" href="#" onclick="carregarReservas(${paginaAtual - 1})">Anterior</a>
    `;
    paginacao.appendChild(btnAnterior);

    // Páginas
    for (let i = 1; i <= totalPaginas; i++) {
        const item = document.createElement('li');
        item.className = `page-item ${i === paginaAtual ? 'active' : ''}`;
        item.innerHTML = `
            <a class="page-link" href="#" onclick="carregarReservas(${i})">${i}</a>
        `;
        paginacao.appendChild(item);
    }

    // Botão Próximo
    const btnProximo = document.createElement('li');
    btnProximo.className = `page-item ${paginaAtual === totalPaginas ? 'disabled' : ''}`;
    btnProximo.innerHTML = `
        <a class="page-link" href="#" onclick="carregarReservas(${paginaAtual + 1})">Próximo</a>
    `;
    paginacao.appendChild(btnProximo);
}

// Função auxiliar para obter a cor do status
function getStatusColor(status) {
    const cores = {
        'pendente': 'warning',
        'confirmada': 'primary',
        'checkin': 'success',
        'checkout': 'info',
        'cancelada': 'danger'
    };
    return cores[status] || 'secondary';
}

// Função auxiliar para obter ações adicionais baseadas no status
function getAcoesAdicionais(reserva) {
    let acoes = '';
    
    switch (reserva.status) {
        case 'pendente':
            acoes = `
                <button class="btn btn-sm btn-outline-success" onclick="confirmarReserva(${reserva.id})">
                    <i class="bi bi-check-lg"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="cancelarReserva(${reserva.id})">
                    <i class="bi bi-x-lg"></i>
                </button>
            `;
            break;
        case 'confirmada':
            acoes = `
                <button class="btn btn-sm btn-outline-success" onclick="realizarCheckin(${reserva.id})">
                    <i class="bi bi-box-arrow-in-right"></i>
                </button>
            `;
            break;
        case 'checkin':
            acoes = `
                <button class="btn btn-sm btn-outline-info" onclick="realizarCheckout(${reserva.id})">
                    <i class="bi bi-box-arrow-right"></i>
                </button>
            `;
            break;
    }
    
    return acoes;
} 