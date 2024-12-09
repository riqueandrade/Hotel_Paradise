// Variáveis globais
let quartos = [];
const modalQuarto = new bootstrap.Modal(document.getElementById('modalQuarto'));

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    verificarToken();
    carregarQuartos();
    atualizarEstatisticas();
    
    // Listeners dos filtros
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const tipoFilter = document.getElementById('tipoFilter');
    const sortBy = document.getElementById('sortBy');
    const btnSalvar = document.getElementById('btnSalvar');

    if (searchInput) searchInput.addEventListener('input', debounce(aplicarFiltros, 500));
    if (statusFilter) statusFilter.addEventListener('change', aplicarFiltros);
    if (tipoFilter) tipoFilter.addEventListener('change', aplicarFiltros);
    if (sortBy) sortBy.addEventListener('change', aplicarFiltros);
    if (btnSalvar) btnSalvar.addEventListener('click', salvarQuarto);
});

// Funções de API
async function carregarQuartos(filtros = {}) {
    try {
        const queryParams = new URLSearchParams(filtros);
        const url = `/api/quartos?${queryParams}`;
        console.log('Tentando carregar quartos:', url);
        
        const token = localStorage.getItem('token');
        console.log('Token presente:', !!token);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao carregar quartos');
        }
        
        quartos = await response.json();
        console.log('Quartos carregados:', quartos.length);
        renderizarQuartos(quartos);
        atualizarEstatisticas();
    } catch (error) {
        console.error('Erro detalhado:', error);
        mostrarNotificacao(`Erro ao carregar quartos: ${error.message}`, 'danger');
    }
}

function atualizarEstatisticas() {
    // Calcula estatísticas baseado nos quartos carregados
    if (!quartos.length) return;

    const stats = {
        disponiveis: quartos.filter(q => q.status === 'disponivel').length,
        ocupados: quartos.filter(q => q.status === 'ocupado').length,
        manutencao: quartos.filter(q => q.status === 'manutencao').length,
        faturamento_diario: quartos
            .filter(q => q.status === 'ocupado')
            .reduce((total, q) => total + parseFloat(q.preco_diaria), 0)
    };

    document.getElementById('quartosDisponiveis').textContent = stats.disponiveis;
    document.getElementById('quartosOcupados').textContent = stats.ocupados;
    document.getElementById('quartosManutencao').textContent = stats.manutencao;
    document.getElementById('faturamentoDiario').textContent = 
        `R$ ${stats.faturamento_diario.toFixed(2)}`;
}

async function salvarQuarto() {
    try {
        if (!validarFormulario()) return;

        const quarto = {
            numero: document.getElementById('numeroQuarto').value,
            tipo: document.getElementById('tipoQuarto').value,
            status: document.getElementById('statusQuarto').value,
            andar: document.getElementById('andarQuarto').value,
            preco_diaria: document.getElementById('precoDiaria').value,
            descricao: document.getElementById('descricaoQuarto').value
        };

        const id = document.getElementById('quartoId').value;
        const url = id ? `/api/quartos/${id}` : '/api/quartos';
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(quarto)
        });

        if (!response.ok) throw new Error('Erro ao salvar quarto');

        modalQuarto.hide();
        await carregarQuartos();
        mostrarNotificacao('Quarto salvo com sucesso', 'success');
    } catch (error) {
        mostrarNotificacao('Erro ao salvar quarto', 'danger');
    }
}

async function excluirQuarto(id) {
    if (!confirm('Tem certeza que deseja excluir este quarto?')) return;

    try {
        const response = await fetch(`/api/quartos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Erro ao excluir quarto');

        await carregarQuartos();
        mostrarNotificacao('Quarto excluído com sucesso', 'success');
    } catch (error) {
        mostrarNotificacao('Erro ao excluir quarto', 'danger');
    }
}

// Funções de UI
function renderizarQuartos(quartos) {
    const tbody = document.getElementById('quartosTableBody');
    
    if (!quartos || quartos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="empty-state">
                        <i class="bi bi-door-closed display-4 text-muted"></i>
                        <h4 class="mt-3">Nenhum quarto encontrado</h4>
                        <p class="text-muted">Não há quartos que correspondam aos filtros.</p>
                        <button class="btn btn-primary" onclick="modalQuarto.show()">
                            <i class="bi bi-plus-lg"></i> Novo Quarto
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = quartos.map(quarto => {
        // Converte o preço para número e trata valores inválidos
        const preco = parseFloat(quarto.preco_diaria) || 0;
        
        // Define as cores dos badges
        const statusColors = {
            'disponivel': 'success',
            'ocupado': 'danger',
            'manutencao': 'warning'
        };

        const tipoColors = {
            'standard': 'primary',
            'luxo': 'info',
            'suite': 'orange'
        };

        const statusColor = statusColors[quarto.status?.toLowerCase()] || 'secondary';
        const tipoColor = tipoColors[quarto.tipo?.toLowerCase()] || 'secondary';
        
        return `
            <tr>
                <td>${quarto.numero}</td>
                <td><span class="badge bg-${tipoColor}">${formatarTipo(quarto.tipo)}</span></td>
                <td><span class="badge bg-${statusColor}">${formatarStatus(quarto.status)}</span></td>
                <td>${quarto.andar}º</td>
                <td>R$ ${preco.toFixed(2)}</td>
                <td>${formatarData(quarto.updated_at)}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="editarQuarto(${quarto.id})" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="alterarStatus(${quarto.id})" title="Alterar Status">
                            <i class="bi bi-arrow-repeat"></i>
                        </button>
                        ${quarto.status !== 'ocupado' ? `
                            <button class="btn btn-sm btn-outline-danger" onclick="excluirQuarto(${quarto.id})" title="Excluir">
                                <i class="bi bi-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function aplicarFiltros() {
    const filtros = {
        busca: document.getElementById('searchInput').value,
        status: document.getElementById('statusFilter').value,
        tipo: document.getElementById('tipoFilter').value,
        ordenacao: document.getElementById('sortBy').value
    };
    carregarQuartos(filtros);
}

function editarQuarto(id) {
    const quarto = quartos.find(q => q.id === id);
    if (!quarto) return;

    document.getElementById('quartoId').value = quarto.id;
    document.getElementById('numeroQuarto').value = quarto.numero;
    document.getElementById('tipoQuarto').value = quarto.tipo.toLowerCase();
    document.getElementById('statusQuarto').value = quarto.status;
    document.getElementById('andarQuarto').value = quarto.andar;
    document.getElementById('precoDiaria').value = quarto.preco_diaria;
    document.getElementById('descricaoQuarto').value = quarto.descricao || '';
    
    document.querySelector('#modalQuarto .modal-title').textContent = 'Editar Quarto';
    modalQuarto.show();
}

async function alterarStatus(id) {
    const quarto = quartos.find(q => q.id === id);
    if (!quarto) return;

    try {
        const novoStatus = prompt('Digite o novo status (disponivel, ocupado, manutencao):', quarto.status);
        if (!novoStatus) return;

        if (!['disponivel', 'ocupado', 'manutencao'].includes(novoStatus)) {
            throw new Error('Status inválido');
        }

        const response = await fetch(`/api/quartos/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ status: novoStatus })
        });

        if (!response.ok) throw new Error('Erro ao atualizar status');

        await carregarQuartos();
        mostrarNotificacao('Status atualizado com sucesso', 'success');
    } catch (error) {
        mostrarNotificacao(error.message, 'danger');
    }
}

function mostrarNotificacao(mensagem, tipo = 'success') {
    const toastContainer = document.querySelector('.toast-container');
    const toastHtml = `
        <div class="toast align-items-center text-white bg-${tipo} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">${mensagem}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    const toastElement = toastContainer.lastElementChild;
    const toast = new bootstrap.Toast(toastElement);
    
    toast.show();
    toastElement.addEventListener('hidden.bs.toast', () => toastElement.remove());
}

// Funções auxiliares
function validarFormulario() {
    const form = document.getElementById('quartoForm');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return false;
    }
    return true;
}

function formatarStatus(status) {
    const statusMap = {
        'disponivel': 'Disponível',
        'ocupado': 'Ocupado',
        'manutencao': 'Manutenção'
    };
    return statusMap[status.toLowerCase()] || status;
}

function formatarTipo(tipo) {
    const tipos = {
        'standard': 'Standard',
        'luxo': 'Luxo',
        'suite': 'Suíte'
    };
    return tipos[tipo.toLowerCase()] || tipo;
}

function formatarData(data) {
    return new Date(data).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function verificarToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/html/login.html';
}

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