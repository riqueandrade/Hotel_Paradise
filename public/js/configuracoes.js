// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    verificarToken();
    carregarConfiguracoes();
    inicializarEventos();
});

function inicializarEventos() {
    // Botão Salvar
    document.getElementById('btnSalvar').addEventListener('click', salvarConfiguracoes);

    // Backup e Restauração
    document.getElementById('btnBackup').addEventListener('click', fazerBackup);
    document.getElementById('btnRestaurar').addEventListener('click', restaurarBackup);

    // Validação de senha
    document.getElementById('confirmarSenha').addEventListener('input', validarSenha);
}

// Funções de API
async function carregarConfiguracoes() {
    try {
        // Carregar dados do usuário
        const responseUsuario = await fetch('/api/usuarios/perfil', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (responseUsuario.ok) {
            const usuario = await responseUsuario.json();
            document.getElementById('nome').value = usuario.nome;
            document.getElementById('email').value = usuario.email;
        }

        // Carregar configurações do sistema
        const responseConfig = await fetch('/api/configuracoes', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (responseConfig.ok) {
            const config = await responseConfig.json();
            document.getElementById('nome_hotel').value = config.nome_hotel;
            document.getElementById('endereco').value = config.endereco;
            document.getElementById('telefone').value = config.telefone;
            document.getElementById('email_contato').value = config.email_contato;

            if (config.notificacoes) {
                const notificacoes = typeof config.notificacoes === 'string' 
                    ? JSON.parse(config.notificacoes) 
                    : config.notificacoes;

                document.getElementById('notifReservas').checked = notificacoes.reservas;
                document.getElementById('notifCheckIn').checked = notificacoes.checkIn;
                document.getElementById('notifCheckOut').checked = notificacoes.checkOut;
                document.getElementById('notifProdutos').checked = notificacoes.produtos;
            }

            // Atualizar data do último backup
            if (config.ultimo_backup) {
                document.getElementById('ultimoBackup').textContent = 
                    new Date(config.ultimo_backup).toLocaleString();
            }
        }
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        showToast('Erro ao carregar configurações', 'error');
    }
}

async function salvarConfiguracoes() {
    try {
        const dadosConfig = {
            nome_hotel: document.getElementById('nome_hotel').value,
            endereco: document.getElementById('endereco').value,
            telefone: document.getElementById('telefone').value,
            email_contato: document.getElementById('email_contato').value,
            notificacoes: {
                reservas: document.getElementById('notifReservas').checked,
                checkIn: document.getElementById('notifCheckIn').checked,
                checkOut: document.getElementById('notifCheckOut').checked,
                produtos: document.getElementById('notifProdutos').checked
            }
        };

        const response = await fetch('/api/configuracoes', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(dadosConfig)
        });

        if (response.ok) {
            showToast('Configurações salvas com sucesso', 'success');
            await carregarConfiguracoes(); // Recarrega as configurações
        } else {
            throw new Error('Erro ao salvar configurações');
        }
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        showToast('Erro ao salvar configurações', 'error');
    }
}

// Funções de Backup
async function fazerBackup() {
    try {
        const response = await fetch('/api/backup', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Erro ao gerar backup');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${new Date().toISOString().split('T')[0]}.sql`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        document.getElementById('ultimoBackup').textContent = new Date().toLocaleString();
        mostrarNotificacao('Backup realizado com sucesso', 'success');
    } catch (error) {
        console.error('Erro ao fazer backup:', error);
        mostrarNotificacao('Erro ao fazer backup', 'danger');
    }
}

async function restaurarBackup() {
    try {
        const arquivo = document.getElementById('arquivoBackup').files[0];
        if (!arquivo) {
            mostrarNotificacao('Selecione um arquivo de backup', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('backup', arquivo);

        const response = await fetch('/api/backup/restaurar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) throw new Error('Erro ao restaurar backup');

        mostrarNotificacao('Backup restaurado com sucesso', 'success');
        setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        mostrarNotificacao('Erro ao restaurar backup', 'danger');
    }
}

// Funções Auxiliares
function validarSenha() {
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    
    if (senha && confirmarSenha) {
        if (senha !== confirmarSenha) {
            document.getElementById('confirmarSenha').setCustomValidity('As senhas não coincidem');
        } else {
            document.getElementById('confirmarSenha').setCustomValidity('');
        }
    }
}

function mostrarNotificacao(mensagem, tipo) {
    const toastContainer = document.querySelector('.toast-container');
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${tipo} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${mensagem}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    toast.addEventListener('hidden.bs.toast', () => {
        toastContainer.removeChild(toast);
    });
}

function verificarToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/html/login.html';
        return;
    }
} 