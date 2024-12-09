document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('token');
    
    // Se não houver token, redireciona para o login
    if (!token) {
        window.location.href = '/html/login.html';
        return;
    }

    try {
        // Verifica se o token é válido
        const response = await fetch('/api/auth/verify', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Token inválido');
        }

        const data = await response.json();
        console.log('Dados do usuário:', data);
        
        // Atualiza o nome do usuário
        if (data.user && data.user.nome) {
            document.getElementById('userName').textContent = data.user.nome;
        }

        // Inicializa os modais
        const modals = {
            modalNovaReserva: document.getElementById('modalNovaReserva'),
            modalNovoCliente: document.getElementById('modalNovoCliente'),
            modalCheckInOut: document.getElementById('modalCheckInOut'),
            modalPagamento: document.getElementById('modalPagamento')
        };

        // Inicializa cada modal se o elemento existir
        Object.keys(modals).forEach(modalName => {
            if (modals[modalName]) {
                window[modalName] = new bootstrap.Modal(modals[modalName]);
            }
        });

        // Carrega os dados do dashboard
        await updateDashboardData();

        // Atualiza os dados a cada 5 minutos
        setInterval(updateDashboardData, 5 * 60 * 1000);

        // Inicializa os eventos dos botões de ação rápida
        initializeQuickActions();

        // Inicializa os eventos dos formulários
        initializeFormEvents();

    } catch (error) {
        console.error('Erro de autenticação:', error);
        localStorage.removeItem('token');
        window.location.href = '/html/login.html';
    }

    // Configuração do botão de logout
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('token');
        window.location.href = '/html/login.html';
    });

    // Toggle do menu lateral em dispositivos móveis
    const toggleSidebar = () => {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('active');
    };

    // Adiciona o evento de toggle ao botão do menu (se existir)
    const menuButton = document.querySelector('.navbar-toggler');
    if (menuButton) {
        menuButton.addEventListener('click', toggleSidebar);
    }
});

// Função para inicializar os gráficos
function initializeCharts(data) {
    try {
        // Configurações comuns para os gráficos
        Chart.defaults.font.family = "'Segoe UI', 'Helvetica Neue', 'Arial', sans-serif";
        Chart.defaults.font.size = 12;
        Chart.defaults.color = '#666';

        // Gráfico de Ocupação
        const occupancyCtx = document.getElementById('occupancyChart');
        const roomsCtx = document.getElementById('roomsChart');

        if (!occupancyCtx || !roomsCtx) {
            console.error('Elementos dos gráficos não encontrados');
            return;
        }

        // Verifica se há dados para o gráfico de ocupação
        const hasOccupancyData = data.graficos.ocupacaoSemanal.data.some(value => value > 0);
        toggleEmptyState(occupancyCtx.parentElement, !hasOccupancyData);

        if (hasOccupancyData) {
            // Configuração do gráfico de ocupação
            const occupancyConfig = {
                type: 'line',
                data: {
                    labels: data.graficos.ocupacaoSemanal.labels,
                    datasets: [{
                        label: 'Taxa de Ocupação',
                        data: data.graficos.ocupacaoSemanal.data,
                        borderColor: '#2962ff',
                        backgroundColor: 'rgba(41, 98, 255, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    }
                }
            };

            // Destruir gráfico existente se houver
            if (window.occupancyChart instanceof Chart) {
                window.occupancyChart.destroy();
            }

            // Criar novo gráfico
            window.occupancyChart = new Chart(occupancyCtx, occupancyConfig);
        }

        // Verifica se há dados para o gráfico de distribuição
        const hasRoomsData = data.graficos.distribuicaoQuartos.data.some(value => value > 0);
        toggleEmptyState(roomsCtx.parentElement, !hasRoomsData);

        if (hasRoomsData) {
            // Configuração do gráfico de distribuição de quartos
            const roomsConfig = {
                type: 'doughnut',
                data: {
                    labels: data.graficos.distribuicaoQuartos.labels,
                    datasets: [{
                        data: data.graficos.distribuicaoQuartos.data,
                        backgroundColor: ['#4CAF50', '#2962ff', '#FF9800'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    },
                    cutout: '70%'
                }
            };

            // Destruir gráfico existente se houver
            if (window.roomsChart instanceof Chart) {
                window.roomsChart.destroy();
            }

            // Criar novo gráfico
            window.roomsChart = new Chart(roomsCtx, roomsConfig);
        }

    } catch (error) {
        console.error('Erro ao inicializar gráficos:', error);
        showToast('Erro ao inicializar gráficos', 'error');
    }
}

// Função para atualizar os cards
function updateCards(data) {
    try {
        const cards = {
            reservas: document.querySelector('[data-card="reservas"] .card-value'),
            ocupacao: document.querySelector('[data-card="ocupacao"] .card-value'),
            receita: document.querySelector('[data-card="receita"] .card-value'),
            clientes: document.querySelector('[data-card="clientes"] .card-value')
        };

        const trends = {
            reservas: document.querySelector('[data-card="reservas"] .card-trend'),
            ocupacao: document.querySelector('[data-card="ocupacao"] .card-trend'),
            receita: document.querySelector('[data-card="receita"] .card-trend'),
            clientes: document.querySelector('[data-card="clientes"] .card-trend')
        };

        // Verifica se todos os elementos existem antes de atualizar
        if (cards.reservas) {
            cards.reservas.textContent = data.cards.reservasHoje || '0';
            updateTrend(trends.reservas, data.cards.reservasHoje, 0);
        }
        
        if (cards.ocupacao) {
            const taxa = data.cards.taxaOcupacao || 0;
            cards.ocupacao.textContent = `${taxa}%`;
            updateTrend(trends.ocupacao, taxa, 70); // 70% é considerado bom
        }
        
        if (cards.receita) {
            cards.receita.textContent = formatCurrency(data.cards.receitaDiaria || 0);
            updateTrend(trends.receita, data.cards.receitaDiaria, 0);
        }
        
        if (cards.clientes) {
            cards.clientes.textContent = data.cards.novosClientes || '0';
            updateTrend(trends.clientes, data.cards.novosClientes, 0);
        }
    } catch (error) {
        console.error('Erro ao atualizar cards:', error);
        showToast('Erro ao atualizar cards', 'error');
    }
}

// Função para atualizar as tendências
function updateTrend(element, value, baseline) {
    if (!element) return;

    const isUp = value > baseline;
    const icon = element.querySelector('i');
    const text = element.querySelector('span');

    // Remove classes antigas
    element.classList.remove('up', 'down');
    icon.classList.remove('bi-arrow-up', 'bi-arrow-down');

    // Adiciona novas classes
    element.classList.add(isUp ? 'up' : 'down');
    icon.classList.add(isUp ? 'bi-arrow-up' : 'bi-arrow-down');

    // Atualiza o texto
    if (baseline === 0) {
        text.textContent = value > 0 ? 'Ativo hoje' : 'Sem atividade';
    } else {
        const diff = Math.abs(value - baseline);
        const percent = Math.round((diff / baseline) * 100);
        text.textContent = `${percent}% ${isUp ? 'acima' : 'abaixo'} da média`;
    }
}

// Função para atualizar a tabela de reservas
function updateReservasTable(reservas) {
    try {
        const tbody = document.querySelector('.custom-table tbody');
        if (!tbody) return;

        if (!reservas || reservas.length === 0) {
            tbody.innerHTML = `
                <tr class="table-empty">
                    <td colspan="7">
                        <div class="empty-state">
                            <i class="bi bi-calendar-x"></i>
                            <h4>Nenhuma reserva encontrada</h4>
                            <p>Não há reservas para exibir neste momento.</p>
                            <button class="btn btn-primary mt-3" onclick="showModal('nova-reserva')">
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
                <td>${reserva.cliente}</td>
                <td>${reserva.quarto}</td>
                <td>${formatDate(reserva.checkIn)}</td>
                <td>${formatDate(reserva.checkOut)}</td>
                <td><span class="status-badge status-${reserva.status}">${reserva.status}</span></td>
                <td>${formatCurrency(reserva.valor)}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="showModal('editar-reserva', ${reserva.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="showModal('cancelar-reserva', ${reserva.id})">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Erro ao atualizar tabela:', error);
        showToast('Erro ao atualizar tabela de reservas', 'error');
    }
}

// Função para formatar números como moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Função para formatar datas
function formatDate(date) {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

// Função para atualizar os dados do dashboard
async function updateDashboardData() {
    try {
        const response = await fetch('/api/dashboard/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const data = await response.json();

        // Atualiza os cards
        document.querySelector('[data-card="reservas"] .card-value').textContent = data.cards.reservasHoje;
        document.querySelector('[data-card="ocupacao"] .card-value').textContent = `${data.cards.taxaOcupacao}%`;

        // Verifica se tem dados financeiros antes de atualizar
        const receitaCard = document.querySelector('[data-card="receita"]');
        const clientesCard = document.querySelector('[data-card="clientes"]');

        if (data.cards.receitaDiaria !== undefined) {
            receitaCard.style.display = 'block';
            receitaCard.querySelector('.card-value').textContent = 
                `R$ ${data.cards.receitaDiaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        } else {
            receitaCard.style.display = 'none';
        }

        if (data.cards.novosClientes !== undefined) {
            clientesCard.style.display = 'block';
            clientesCard.querySelector('.card-value').textContent = data.cards.novosClientes;
        } else {
            clientesCard.style.display = 'none';
        }

        // Atualiza o gráfico de distribuição de quartos
        if (data.graficos.distribuicaoQuartos) {
            const ctx = document.getElementById('roomsChart').getContext('2d');
            if (window.roomsChart) {
                window.roomsChart.destroy();
            }
            window.roomsChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.graficos.distribuicaoQuartos.labels,
                    datasets: [{
                        data: data.graficos.distribuicaoQuartos.data,
                        backgroundColor: ['#28a745', '#dc3545', '#ffc107']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // Atualiza o gráfico de ocupação semanal se disponível
        const occupancyContainer = document.querySelector('.col-lg-8');
        if (data.graficos.ocupacaoSemanal) {
            occupancyContainer.style.display = 'block';
            const ctx = document.getElementById('occupancyChart').getContext('2d');
            if (window.occupancyChart) {
                window.occupancyChart.destroy();
            }
            window.occupancyChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.graficos.ocupacaoSemanal.labels,
                    datasets: [{
                        label: 'Taxa de Ocupação (%)',
                        data: data.graficos.ocupacaoSemanal.data,
                        borderColor: '#0d6efd',
                        tension: 0.1,
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: value => `${value}%`
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        } else {
            occupancyContainer.style.display = 'none';
        }

        // Atualiza a média de estadia se disponível
        const mediaEstadia = document.getElementById('mediaEstadia');
        if (mediaEstadia && data.estatisticas.mediaEstadia !== undefined) {
            mediaEstadia.textContent = `${data.estatisticas.mediaEstadia} dias`;
        }

    } catch (error) {
        console.error('Erro ao atualizar dados:', error);
        showToast('Erro ao carregar dados do dashboard', 'error');
    }
}

// Atualiza os dados quando a página carregar
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Verifica o token e obtém dados do usuário
        const response = await fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Token inválido');
        }

        const data = await response.json();
        console.log('Dados do usuário:', data);

        // Atualiza o nome do usuário
        document.getElementById('userName').textContent = data.user.nome;

        // Atualiza os dados do dashboard
        await updateDashboardData();

        // Configura o botão de logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '/html/login.html';
        });

    } catch (error) {
        console.error('Erro:', error);
        window.location.href = '/html/login.html';
    }
});

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

// Função para mostrar modal
function showModal(modalType) {
    // Implementar sistema de modais
    console.log(`Abrindo modal: ${modalType}`);
}

// Função para mostrar/esconder estados vazios
function toggleEmptyState(chartContainer, isEmpty) {
    const canvas = chartContainer.querySelector('canvas');
    const emptyState = chartContainer.querySelector('.empty-state');
    
    if (isEmpty) {
        canvas.style.display = 'none';
        emptyState.style.display = 'flex';
    } else {
        canvas.style.display = 'block';
        emptyState.style.display = 'none';
    }
}

// Função para inicializar eventos dos formulários
function initializeFormEvents() {
    // Inicializa máscaras
    initializeMasks();

    // Inicializa validações
    initializeValidations();

    // Form Nova Reserva
    const formNovaReserva = document.getElementById('formNovaReserva');
    if (formNovaReserva) {
        // Atualiza valor total quando as datas mudam
        ['data_entrada', 'data_saida'].forEach(field => {
            formNovaReserva.querySelector(`[name="${field}"]`).addEventListener('change', calcularValorTotal);
        });

        // Atualiza quartos disponíveis quando tipo é selecionado
        formNovaReserva.querySelector('[name="tipo_quarto"]').addEventListener('change', carregarQuartosDisponiveis);

        // Define data mínima como hoje
        const today = new Date().toISOString().split('T')[0];
        formNovaReserva.querySelector('[name="data_entrada"]').min = today;
        formNovaReserva.querySelector('[name="data_saida"]').min = today;

        // Atualiza data mínima de check-out quando check-in muda
        formNovaReserva.querySelector('[name="data_entrada"]').addEventListener('change', function() {
            formNovaReserva.querySelector('[name="data_saida"]').min = this.value;
        });

        // Carrega a lista de clientes quando o modal é aberto
        const modalNovaReserva = document.getElementById('modalNovaReserva');
        modalNovaReserva.addEventListener('shown.bs.modal', async () => {
            try {
                await carregarClientes();
            } catch (error) {
                console.error('Erro ao carregar clientes para nova reserva:', error);
            }
        });
    }

    // Form Novo Cliente
    const formNovoCliente = document.getElementById('formNovoCliente');
    if (formNovoCliente) {
        // Define data máxima como hoje menos 18 anos
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() - 18);
        formNovoCliente.querySelector('[name="data_nascimento"]').max = maxDate.toISOString().split('T')[0];

        // Adiciona máscara de CEP
        const cepInput = formNovoCliente.querySelector('[name="cep"]');
        if (cepInput) {
            cepInput.addEventListener('blur', async function() {
                const cep = this.value.replace(/\D/g, '');
                if (cep.length === 8) {
                    try {
                        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                        const data = await response.json();
                        
                        if (!data.erro) {
                            formNovoCliente.querySelector('[name="endereco"]').value = data.logradouro;
                            formNovoCliente.querySelector('[name="cidade"]').value = data.localidade;
                            formNovoCliente.querySelector('[name="estado"]').value = data.uf;
                        }
                    } catch (error) {
                        console.error('Erro ao buscar CEP:', error);
                    }
                }
            });
        }

        // Carrega a lista de clientes quando o modal é aberto
        const modalNovoCliente = document.getElementById('modalNovoCliente');
        modalNovoCliente.addEventListener('shown.bs.modal', async () => {
            try {
                await carregarClientes();
            } catch (error) {
                console.error('Erro ao carregar clientes para novo cliente:', error);
            }
        });
    }

    // Form Check-in/out
    const formCheckInOut = document.getElementById('formCheckInOut');
    if (formCheckInOut) {
        // Atualiza informações quando reserva é selecionada
        formCheckInOut.querySelector('[name="reserva_id"]').addEventListener('change', carregarDadosReserva);
    }

    // Form Pagamento
    const formPagamento = document.getElementById('formPagamento');
    if (formPagamento) {
        // Atualiza campos quando reserva é selecionada
        formPagamento.querySelector('[name="reserva_id"]').addEventListener('change', carregarDadosPagamento);
        
        // Mostra/esconde campo de parcelas
        formPagamento.querySelector('[name="forma_pagamento"]').addEventListener('change', function() {
            const parcelasField = formPagamento.querySelector('[name="parcelas"]').closest('.mb-3');
            parcelasField.style.display = this.value === 'credito' ? 'block' : 'none';
        });
    }
}

// Função para inicializar máscaras
function initializeMasks() {
    // Máscara para CPF
    const cpfInputs = document.querySelectorAll('input[name="cpf"]');
    cpfInputs.forEach(input => {
        IMask(input, {
            mask: '000.000.000-00'
        });
    });

    // Máscara para telefone
    const telefoneInputs = document.querySelectorAll('input[name="telefone"]');
    telefoneInputs.forEach(input => {
        IMask(input, {
            mask: [
                { mask: '(00) 0000-0000' },
                { mask: '(00) 00000-0000' }
            ]
        });
    });

    // Máscara para CEP
    const cepInputs = document.querySelectorAll('input[name="cep"]');
    cepInputs.forEach(input => {
        IMask(input, {
            mask: '00000-000'
        });
    });

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
    // Validação de CPF
    function validarCPF(cpf) {
        cpf = cpf.replace(/[^\d]/g, '');
        
        if (cpf.length !== 11) return false;
        
        // Verifica CPFs com dígitos iguais
        if (/^(\d)\1+$/.test(cpf)) return false;
        
        // Validação dos dígitos verificadores
        let soma = 0;
        let resto;
        
        for (let i = 1; i <= 9; i++) {
            soma += parseInt(cpf.substring(i-1, i)) * (11 - i);
        }
        
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.substring(9, 10))) return false;
        
        soma = 0;
        for (let i = 1; i <= 10; i++) {
            soma += parseInt(cpf.substring(i-1, i)) * (12 - i);
        }
        
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.substring(10, 11))) return false;
        
        return true;
    }

    // Adiciona validação customizada para CPF
    const cpfInputs = document.querySelectorAll('input[name="cpf"]');
    cpfInputs.forEach(input => {
        input.addEventListener('blur', function() {
            const cpf = this.value.replace(/[^\d]/g, '');
            if (cpf && !validarCPF(cpf)) {
                this.setCustomValidity('CPF inválido');
                this.classList.add('is-invalid');
            } else {
                this.setCustomValidity('');
                this.classList.remove('is-invalid');
            }
        });
    });

    // Validação de e-mail
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            const email = this.value;
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (email && !regex.test(email)) {
                this.setCustomValidity('E-mail inválido');
                this.classList.add('is-invalid');
            } else {
                this.setCustomValidity('');
                this.classList.remove('is-invalid');
            }
        });
    });

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

// Funções para carregar dados
async function carregarClientes() {
    try {
        const response = await fetch('/api/clientes', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Erro ao carregar clientes');
        }
        
        const clientes = await response.json();
        
        // Atualiza todos os selects de clientes
        document.querySelectorAll('select[name="cliente_id"]').forEach(select => {
            select.innerHTML = '<option value="">Selecione um cliente</option>' +
                clientes.map(cliente => `
                    <option value="${cliente.id}">${cliente.nome} - ${cliente.cpf}</option>
                `).join('');
        });

        return clientes;
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        showToast('Erro ao carregar lista de clientes', 'error');
        throw error;
    }
}

async function carregarQuartosDisponiveis() {
    try {
        const tipoQuarto = document.querySelector('#formNovaReserva [name="tipo_quarto"]').value;
        const dataEntrada = document.querySelector('#formNovaReserva [name="data_entrada"]').value;
        const dataSaida = document.querySelector('#formNovaReserva [name="data_saida"]').value;

        if (!tipoQuarto || !dataEntrada || !dataSaida) return;

        const response = await fetch(`/api/quartos/disponiveis?tipo=${tipoQuarto}&entrada=${dataEntrada}&saida=${dataSaida}`);
        if (!response.ok) throw new Error('Erro ao carregar quartos');
        
        const quartos = await response.json();
        const select = document.querySelector('#formNovaReserva [name="quarto_id"]');
        
        select.innerHTML = '<option value="">Selecione um quarto</option>' +
            quartos.map(quarto => `
                <option value="${quarto.id}">${quarto.numero}</option>
            `).join('');

        // Atualiza valor da diária
        const valorDiaria = document.querySelector('#formNovaReserva [name="valor_diaria"]');
        valorDiaria.value = quartos[0]?.preco_diaria || 0;
        
        calcularValorTotal();
    } catch (error) {
        console.error('Erro ao carregar quartos:', error);
        showToast('Erro ao carregar quartos disponíveis', 'error');
    }
}

function calcularValorTotal() {
    const dataEntrada = new Date(document.querySelector('#formNovaReserva [name="data_entrada"]').value);
    const dataSaida = new Date(document.querySelector('#formNovaReserva [name="data_saida"]').value);
    const valorDiaria = parseFloat(document.querySelector('#formNovaReserva [name="valor_diaria"]').value);

    if (dataEntrada && dataSaida && valorDiaria) {
        const dias = Math.ceil((dataSaida - dataEntrada) / (1000 * 60 * 60 * 24));
        const total = dias * valorDiaria;
        document.querySelector('#formNovaReserva [name="valor_total"]').value = total.toFixed(2);
    }
}

// Funções para salvar dados
async function salvarReserva() {
    try {
        const form = document.getElementById('formNovaReserva');
        const formData = new FormData(form);
        
        const response = await fetch('/api/reservas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(Object.fromEntries(formData))
        });

        if (!response.ok) throw new Error('Erro ao salvar reserva');

        showToast('Reserva criada com sucesso!', 'success');
        modalNovaReserva.hide();
        form.reset();
        updateDashboardData();
    } catch (error) {
        console.error('Erro ao salvar reserva:', error);
        showToast('Erro ao criar reserva', 'error');
    }
}

async function salvarCliente() {
    try {
        const form = document.getElementById('formNovoCliente');
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
            nome: formData.get('nome'),
            email: formData.get('email'),
            telefone: formData.get('telefone').replace(/\D/g, ''),
            cpf: formData.get('cpf').replace(/\D/g, ''),
            data_nascimento: formData.get('data_nascimento') || null,
            endereco: formData.get('endereco'),
            cidade: formData.get('cidade'),
            estado: formData.get('estado'),
            cep: formData.get('cep').replace(/\D/g, '') || null,
            observacoes: formData.get('observacoes') || null
        };

        const response = await fetch('/api/clientes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao salvar cliente');
        }

        showToast('Cliente cadastrado com sucesso!', 'success');
        window.modalNovoCliente.hide();
        form.reset();
        form.classList.remove('was-validated');
        
        // Atualiza a lista de clientes
        await carregarClientes();
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
        showToast(error.message || 'Erro ao cadastrar cliente', 'error');
    }
}

async function realizarCheckInOut() {
    try {
        const form = document.getElementById('formCheckInOut');
        const formData = new FormData(form);
        const tipo = document.querySelector('input[name="checkType"]:checked').value;
        
        const response = await fetch(`/api/reservas/${formData.get('reserva_id')}/${tipo}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                observacoes: formData.get('observacoes')
            })
        });

        if (!response.ok) throw new Error(`Erro ao realizar ${tipo}`);

        showToast(`${tipo === 'checkin' ? 'Check-in' : 'Check-out'} realizado com sucesso!`, 'success');
        modalCheckInOut.hide();
        form.reset();
        updateDashboardData();
    } catch (error) {
        console.error('Erro ao realizar check-in/out:', error);
        showToast('Erro ao realizar operação', 'error');
    }
}

async function registrarPagamento() {
    try {
        const form = document.getElementById('formPagamento');
        const formData = new FormData(form);
        
        const response = await fetch('/api/pagamentos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(Object.fromEntries(formData))
        });

        if (!response.ok) throw new Error('Erro ao registrar pagamento');

        showToast('Pagamento registrado com sucesso!', 'success');
        modalPagamento.hide();
        form.reset();
        updateDashboardData();
    } catch (error) {
        console.error('Erro ao registrar pagamento:', error);
        showToast('Erro ao registrar pagamento', 'error');
    }
}

// Função para carregar dados da reserva
async function carregarDadosReserva() {
    try {
        const reservaId = document.querySelector('#formCheckInOut [name="reserva_id"]').value;
        if (!reservaId) return;

        const response = await fetch(`/api/reservas/${reservaId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar dados da reserva');

        const reserva = await response.json();
        
        // Preenche os campos do formulário
        const form = document.getElementById('formCheckInOut');
        form.querySelector('[name="cliente"]').value = reserva.cliente_nome;
        form.querySelector('[name="quarto"]').value = reserva.quarto_numero;
        form.querySelector('[name="data_prevista"]').value = 
            document.querySelector('input[name="checkType"]:checked').value === 'checkin' 
                ? formatDate(reserva.data_entrada)
                : formatDate(reserva.data_saida);
    } catch (error) {
        console.error('Erro ao carregar dados da reserva:', error);
        showToast('Erro ao carregar dados da reserva', 'error');
    }
}

// Função para carregar dados do pagamento
async function carregarDadosPagamento() {
    try {
        const reservaId = document.querySelector('#formPagamento [name="reserva_id"]').value;
        if (!reservaId) return;

        const response = await fetch(`/api/reservas/${reservaId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar dados do pagamento');

        const reserva = await response.json();
        
        // Preenche o valor total
        document.querySelector('#formPagamento [name="valor_total"]').value = reserva.valor_total;
    } catch (error) {
        console.error('Erro ao carregar dados do pagamento:', error);
        showToast('Erro ao carregar dados do pagamento', 'error');
    }
}

// Função para carregar lista de reservas
async function carregarListaReservas(status = null) {
    try {
        let url = '/api/reservas';
        if (status) {
            url += `?status=${status}`;
        }

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar lista de reservas');

        const reservas = await response.json();
        
        // Preenche os selects de reservas
        const selects = document.querySelectorAll('select[name="reserva_id"]');
        selects.forEach(select => {
            select.innerHTML = '<option value="">Selecione uma reserva</option>' +
                reservas.map(reserva => `
                    <option value="${reserva.id}">
                        #${reserva.id} - ${reserva.cliente_nome} - Quarto ${reserva.quarto_numero}
                        (${formatDate(reserva.data_entrada)} a ${formatDate(reserva.data_saida)})
                    </option>
                `).join('');
        });
    } catch (error) {
        console.error('Erro ao carregar lista de reservas:', error);
        showToast('Erro ao carregar lista de reservas', 'error');
    }
}

// Atualiza a lista de reservas quando os modais são abertos
document.getElementById('modalCheckInOut')?.addEventListener('show.bs.modal', () => {
    carregarListaReservas('confirmada');
});

document.getElementById('modalPagamento')?.addEventListener('show.bs.modal', () => {
    carregarListaReservas('ativa');
}); 