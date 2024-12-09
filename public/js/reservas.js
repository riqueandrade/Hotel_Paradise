document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('token');
    
    // Se não houver token, redireciona para o login
    if (!token) {
        window.location.href = '/html/login.html';
        return;
    }

    try {
        // Verifica se o token é válido
        const response = await fetch('/api/auth/verificar', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Token inválido');
        }

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

// Função para atualizar a tabela de reservas
function atualizarTabelaReservas(reservas) {
    const tbody = document.getElementById('reservasTableBody');
    
    if (!reservas || reservas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <div class="empty-state">
                        <i class="bi bi-calendar-x text-muted" style="font-size: 2rem;"></i>
                        <h4 class="mt-3">Nenhuma reserva encontrada</h4>
                        <p class="text-muted">Não há reservas que correspondam aos filtros.</p>
                        <button class="btn btn-primary mt-2" onclick="window.modalNovaReserva.show()">
                            <i class="bi bi-plus-lg"></i> Nova Reserva
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = reservas.map(reserva => `
        <tr>
            <td>#${reserva.id}</td>
            <td>${reserva.cliente_nome}</td>
            <td>${reserva.quarto_numero} - ${reserva.tipo_quarto}</td>
            <td>${formatarData(reserva.data_entrada)}</td>
            <td>${formatarData(reserva.data_saida)}</td>
            <td>${formatarMoeda(reserva.valor_total)}</td>
            <td>
                <span class="badge bg-${getStatusColor(reserva.status)}">
                    ${formatarStatus(reserva.status)}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editarReserva(${reserva.id})" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    ${reserva.status === 'pendente' ? `
                        <button class="btn btn-outline-success" onclick="realizarCheckin(${reserva.id})" title="Check-in">
                            <i class="bi bi-box-arrow-in-right"></i>
                        </button>
                    ` : ''}
                    ${reserva.status === 'checkin' ? `
                        <button class="btn btn-outline-info" onclick="realizarCheckout(${reserva.id})" title="Check-out">
                            <i class="bi bi-box-arrow-right"></i>
                        </button>
                    ` : ''}
                    ${['pendente', 'confirmada'].includes(reserva.status) ? `
                        <button class="btn btn-outline-danger" onclick="cancelarReserva(${reserva.id})" title="Cancelar">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Função para atualizar a paginação
function atualizarPaginacao(totalPaginas, paginaAtual) {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;

    let html = '';

    // Botão Anterior
    html += `
        <li class="page-item ${paginaAtual === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="mudarPagina(${paginaAtual - 1})" tabindex="-1">Anterior</a>
        </li>
    `;

    // Páginas
    for (let i = 1; i <= totalPaginas; i++) {
        if (
            i === 1 || // Primeira página
            i === totalPaginas || // Última página
            (i >= paginaAtual - 1 && i <= paginaAtual + 1) // Páginas próximas à atual
        ) {
            html += `
                <li class="page-item ${i === paginaAtual ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="mudarPagina(${i})">${i}</a>
                </li>
            `;
        } else if (
            i === paginaAtual - 2 ||
            i === paginaAtual + 2
        ) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }

    // Botão Próxima
    html += `
        <li class="page-item ${paginaAtual === totalPaginas ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="mudarPagina(${paginaAtual + 1})">Próxima</a>
        </li>
    `;

    pagination.innerHTML = html;
}

// Função para mudar de página
function mudarPagina(pagina) {
    carregarReservas(pagina, {
        busca: document.getElementById('searchInput').value,
        status: document.getElementById('statusFilter').value,
        periodo: document.getElementById('periodoFilter').value,
        ordenacao: document.getElementById('sortBy').value
    });
}

// Função para aplicar filtros
function aplicarFiltros() {
    const filtros = obterFiltrosAtuais();
    carregarReservas(1, filtros);
}

// Função para obter filtros atuais
function obterFiltrosAtuais() {
    return {
        busca: document.getElementById('searchInput').value,
        status: document.getElementById('statusFilter').value,
        periodo: document.getElementById('periodoFilter').value,
        ordenacao: document.getElementById('sortBy').value
    };
}

// Função para salvar reserva
async function salvarReserva() {
    try {
        const form = document.getElementById('formNovaReserva');
        if (!form.checkValidity()) {
            form.classList.add('was-validated');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Usuário não autenticado');
        }

        const formData = new FormData(form);
        const data = {
            cliente_id: formData.get('cliente_id'),
            quarto_id: formData.get('quarto_id'),
            data_entrada: formData.get('data_entrada'),
            data_saida: formData.get('data_saida'),
            valor_diaria: formData.get('valor_diaria').replace(/[^\d.,]/g, '').replace(',', '.'),
            valor_total: formData.get('valor_total').replace(/[^\d.,]/g, '').replace(',', '.'),
            observacoes: formData.get('observacoes') || null
        };

        const response = await fetch('/api/reservas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao salvar reserva');
        }

        showToast('Reserva cadastrada com sucesso!', 'success');
        window.modalNovaReserva.hide();
        form.reset();
        form.classList.remove('was-validated');
        
        // Recarrega os dados
        await Promise.all([
            carregarReservas(),
            carregarEstatisticas()
        ]);
    } catch (error) {
        console.error('Erro ao salvar reserva:', error);
        showToast(error.message || 'Erro ao cadastrar reserva', 'error');
    }
}

// Função para editar reserva
async function editarReserva(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/reservas/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar dados da reserva');
        }

        const reserva = await response.json();
        const form = document.getElementById('formNovaReserva');
        
        // Preenche o formulário
        form.querySelector('[name="cliente_id"]').value = reserva.cliente_id;
        form.querySelector('[name="quarto_id"]').value = reserva.quarto_id;
        form.querySelector('[name="data_entrada"]').value = reserva.data_entrada;
        form.querySelector('[name="data_saida"]').value = reserva.data_saida;
        form.querySelector('[name="valor_diaria"]').value = formatarMoeda(reserva.valor_diaria);
        form.querySelector('[name="valor_total"]').value = formatarMoeda(reserva.valor_total);
        form.querySelector('[name="observacoes"]').value = reserva.observacoes || '';

        // Atualiza o título do modal
        document.querySelector('#modalNovaReserva .modal-title').textContent = 'Editar Reserva';
        
        // Adiciona o ID da reserva ao formulário
        form.dataset.reservaId = id;

        window.modalNovaReserva.show();
    } catch (error) {
        console.error('Erro ao carregar reserva:', error);
        showToast('Erro ao carregar dados da reserva', 'error');
    }
}

// Função para realizar check-in
async function realizarCheckin(id) {
    if (!confirm('Confirmar check-in desta reserva?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/reservas/${id}/checkin`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao realizar check-in');
        }

        showToast('Check-in realizado com sucesso!', 'success');
        await Promise.all([
            carregarReservas(),
            carregarEstatisticas()
        ]);
    } catch (error) {
        console.error('Erro ao realizar check-in:', error);
        showToast(error.message || 'Erro ao realizar check-in', 'error');
    }
}

// Função para cancelar reserva
async function cancelarReserva(id) {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/reservas/${id}/cancelar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao cancelar reserva');
        }

        showToast('Reserva cancelada com sucesso!', 'success');
        await Promise.all([
            carregarReservas(),
            carregarEstatisticas()
        ]);
    } catch (error) {
        console.error('Erro ao cancelar reserva:', error);
        showToast(error.message || 'Erro ao cancelar reserva', 'error');
    }
}

// Função para inicializar máscaras
function initializeMasks() {
    // Máscara para valores monetários
    const moneyInputs = document.querySelectorAll('input[name="valor_diaria"], input[name="valor_total"]');
    moneyInputs.forEach(input => {
        IMask(input, {
            mask: Number,
            scale: 2,
            thousandsSeparator: '.',
            padFractionalZeros: true,
            normalizeZeros: true,
            radix: ','
        });
    });
}

// Função para inicializar validações
function initializeValidations() {
    // Validação de datas
    const form = document.getElementById('formNovaReserva');
    if (form) {
        const dataEntrada = form.querySelector('[name="data_entrada"]');
        const dataSaida = form.querySelector('[name="data_saida"]');
        const quartoSelect = form.querySelector('[name="quarto_id"]');

        // Define data mínima como hoje
        const today = new Date().toISOString().split('T')[0];
        dataEntrada.min = today;
        dataSaida.min = today;

        // Atualiza data mínima de check-out quando check-in muda
        dataEntrada.addEventListener('change', function() {
            dataSaida.min = this.value;
            if (dataSaida.value && dataSaida.value < this.value) {
                dataSaida.value = this.value;
            }
            calcularValorTotal();
        });

        // Recalcula valor total quando data de saída muda
        dataSaida.addEventListener('change', calcularValorTotal);

        // Atualiza valor da diária quando quarto é selecionado
        quartoSelect.addEventListener('change', function() {
            const option = this.options[this.selectedIndex];
            const valorDiaria = option.dataset.diaria || '0';
            form.querySelector('[name="valor_diaria"]').value = formatarMoeda(valorDiaria);
            calcularValorTotal();
        });
    }

    // Validação de formulários do Bootstrap
    const forms = document.querySelectorAll('.needs-validation');
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });
}

// Função para calcular valor total
function calcularValorTotal() {
    const form = document.getElementById('formNovaReserva');
    const dataEntrada = new Date(form.querySelector('[name="data_entrada"]').value);
    const dataSaida = new Date(form.querySelector('[name="data_saida"]').value);
    const valorDiaria = parseFloat(form.querySelector('[name="valor_diaria"]').value.replace(/[^\d.,]/g, '').replace(',', '.'));

    if (dataEntrada && dataSaida && valorDiaria) {
        const dias = Math.ceil((dataSaida - dataEntrada) / (1000 * 60 * 60 * 24));
        const total = dias * valorDiaria;
        form.querySelector('[name="valor_total"]').value = formatarMoeda(total);
    }
}

// Função para formatar moeda
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// Função para formatar data
function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

// Função para formatar status
function formatarStatus(status) {
    const statusMap = {
        'pendente': 'Pendente',
        'confirmada': 'Confirmada',
        'checkin': 'Check-in',
        'checkout': 'Check-out',
        'cancelada': 'Cancelada'
    };
    return statusMap[status] || status;
}

// Função para obter cor do status
function getStatusColor(status) {
    const colorMap = {
        'pendente': 'warning',
        'confirmada': 'primary',
        'checkin': 'success',
        'checkout': 'info',
        'cancelada': 'danger'
    };
    return colorMap[status] || 'secondary';
}

// Função para mostrar toast
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;

    const toastId = 'toast-' + Date.now();
    const bgClass = {
        info: 'bg-primary',
        success: 'bg-success',
        error: 'bg-danger',
        warning: 'bg-warning'
    }[type] || 'bg-primary';

    const iconClass = {
        info: 'bi-info-circle',
        success: 'bi-check-circle',
        error: 'bi-exclamation-circle',
        warning: 'bi-exclamation-triangle'
    }[type] || 'bi-info-circle';

    const toast = document.createElement('div');
    toast.className = `toast ${bgClass} text-white`;
    toast.id = toastId;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="toast-header ${bgClass} text-white">
            <i class="bi ${iconClass} me-2"></i>
            <strong class="me-auto">Hotel Paradise</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Fechar"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;

    toastContainer.appendChild(toast);

    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 5000
    });

    bsToast.show();

    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
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