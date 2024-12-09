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

        // Inicializa os modais
        window.modalNovoCliente = new bootstrap.Modal(document.getElementById('modalNovoCliente'));

        // Inicializa máscaras e validações
        initializeMasks();
        initializeValidations();

        // Carrega a lista de clientes
        await carregarClientes();

        // Adiciona eventos de filtro
        document.getElementById('searchInput').addEventListener('input', debounce(aplicarFiltros, 500));
        document.getElementById('estadoFilter').addEventListener('change', aplicarFiltros);
        document.getElementById('sortBy').addEventListener('change', aplicarFiltros);

    } catch (error) {
        console.error('Erro de autenticação:', error);
        localStorage.removeItem('token');
        window.location.href = '/html/login.html';
    }
});

// Função para carregar a lista de clientes
async function carregarClientes(pagina = 1, filtros = {}) {
    try {
        const token = localStorage.getItem('token');
        const queryParams = new URLSearchParams({
            pagina: pagina,
            ...filtros
        });

        const response = await fetch(`/api/clientes?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar clientes');
        }

        const data = await response.json();
        atualizarTabelaClientes(data.clientes);
        atualizarPaginacao(data.totalPaginas, pagina);
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        showToast('Erro ao carregar lista de clientes', 'error');
    }
}

// Função para atualizar a tabela de clientes
function atualizarTabelaClientes(clientes) {
    const tbody = document.getElementById('clientesTableBody');
    
    if (!clientes || clientes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="empty-state">
                        <i class="bi bi-people text-muted" style="font-size: 2rem;"></i>
                        <h4 class="mt-3">Nenhum cliente encontrado</h4>
                        <p class="text-muted">Não há clientes cadastrados ou que correspondam aos filtros.</p>
                        <button class="btn btn-primary mt-2" onclick="window.modalNovoCliente.show()">
                            <i class="bi bi-person-plus"></i> Novo Cliente
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = clientes.map(cliente => `
        <tr>
            <td>${cliente.nome}</td>
            <td>${formatarCPF(cliente.cpf)}</td>
            <td>${cliente.email}</td>
            <td>${formatarTelefone(cliente.telefone)}</td>
            <td>${cliente.cidade}/${cliente.estado}</td>
            <td>${cliente.ultima_hospedagem ? formatarData(cliente.ultima_hospedagem) : 'Nunca'}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editarCliente(${cliente.id})" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-info" onclick="verHistorico(${cliente.id})" title="Histórico">
                        <i class="bi bi-clock-history"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="excluirCliente(${cliente.id})" title="Excluir">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Função para atualizar a paginação
function atualizarPaginacao(totalPaginas, paginaAtual) {
    const pagination = document.querySelector('.pagination');
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
    const filtros = obterFiltrosAtuais();
    carregarClientes(pagina, filtros);
}

// Função para aplicar filtros
function aplicarFiltros() {
    const filtros = obterFiltrosAtuais();
    carregarClientes(1, filtros);
}

// Função para obter filtros atuais
function obterFiltrosAtuais() {
    return {
        busca: document.getElementById('searchInput').value,
        estado: document.getElementById('estadoFilter').value,
        ordenacao: document.getElementById('sortBy').value
    };
}

// Função para salvar cliente
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
        
        // Recarrega a lista de clientes
        await carregarClientes();
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
        showToast(error.message || 'Erro ao cadastrar cliente', 'error');
    }
}

// Função para editar cliente
async function editarCliente(id) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/clientes/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao carregar dados do cliente');
        }

        const cliente = await response.json();
        const form = document.getElementById('formNovoCliente');
        
        // Preenche o formulário
        form.querySelector('[name="nome"]').value = cliente.nome;
        form.querySelector('[name="email"]').value = cliente.email;
        form.querySelector('[name="telefone"]').value = cliente.telefone;
        form.querySelector('[name="cpf"]').value = cliente.cpf;
        form.querySelector('[name="data_nascimento"]').value = cliente.data_nascimento;
        form.querySelector('[name="endereco"]').value = cliente.endereco;
        form.querySelector('[name="cidade"]').value = cliente.cidade;
        form.querySelector('[name="estado"]').value = cliente.estado;
        form.querySelector('[name="cep"]').value = cliente.cep;
        form.querySelector('[name="observacoes"]').value = cliente.observacoes;

        // Atualiza o título do modal
        document.querySelector('#modalNovoCliente .modal-title').textContent = 'Editar Cliente';
        
        // Adiciona o ID do cliente ao formulário
        form.dataset.clienteId = id;

        window.modalNovoCliente.show();
    } catch (error) {
        console.error('Erro ao carregar cliente:', error);
        showToast('Erro ao carregar dados do cliente', 'error');
    }
}

// Função para excluir cliente
async function excluirCliente(id) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/clientes/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao excluir cliente');
        }

        showToast('Cliente excluído com sucesso!', 'success');
        await carregarClientes();
    } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        showToast(error.message || 'Erro ao excluir cliente', 'error');
    }
}

// Função para ver histórico do cliente
async function verHistorico(id) {
    // Implementar visualização do histórico
    alert('Funcionalidade em desenvolvimento');
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
}

// Função para inicializar validações
function initializeValidations() {
    // Validação de CPF
    function validarCPF(cpf) {
        cpf = cpf.replace(/[^\d]/g, '');
        
        if (cpf.length !== 11) return false;
        
        if (/^(\d)\1+$/.test(cpf)) return false;
        
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

    // Adiciona busca de CEP
    const cepInputs = document.querySelectorAll('input[name="cep"]');
    cepInputs.forEach(input => {
        input.addEventListener('blur', async function() {
            const cep = this.value.replace(/\D/g, '');
            if (cep.length === 8) {
                try {
                    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                    const data = await response.json();
                    
                    if (!data.erro) {
                        const form = this.closest('form');
                        form.querySelector('[name="endereco"]').value = data.logradouro;
                        form.querySelector('[name="cidade"]').value = data.localidade;
                        form.querySelector('[name="estado"]').value = data.uf;
                    }
                } catch (error) {
                    console.error('Erro ao buscar CEP:', error);
                }
            }
        });
    });
}

// Função para formatar CPF
function formatarCPF(cpf) {
    if (!cpf) return '';
    cpf = cpf.replace(/[^\d]/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Função para formatar telefone
function formatarTelefone(telefone) {
    if (!telefone) return '';
    telefone = telefone.replace(/[^\d]/g, '');
    if (telefone.length === 11) {
        return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return telefone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

// Função para formatar data
function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
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