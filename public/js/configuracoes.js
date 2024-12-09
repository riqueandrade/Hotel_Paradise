// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    verificarToken();
    carregarConfiguracoes();
    inicializarEventos();
});

// Função para mostrar notificações toast
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container');
    const toastId = `toast-${Date.now()}`;
    
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center text-white bg-${type}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    
    toast.show();
    
    // Remove o elemento após ser ocultado
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

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
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/html/login.html';
            return;
        }

        // Carregar dados do usuário
        const responseUsuario = await fetch('/api/usuarios/perfil', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!responseUsuario.ok) {
            if (responseUsuario.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/html/login.html';
                return;
            }
            throw new Error('Erro ao carregar dados do usuário');
        }

        const usuario = await responseUsuario.json();
        document.getElementById('nome').value = usuario.nome || '';
        document.getElementById('email').value = usuario.email || '';

        // Carregar configurações do sistema
        const responseConfig = await fetch('/api/configuracoes', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!responseConfig.ok) {
            if (responseConfig.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/html/login.html';
                return;
            }
            throw new Error('Erro ao carregar configurações do sistema');
        }

        const config = await responseConfig.json();
        
        // Atualiza os campos do formulário
        document.getElementById('nome_hotel').value = config.nome_hotel || '';
        document.getElementById('endereco').value = config.endereco || '';
        document.getElementById('telefone').value = config.telefone || '';
        document.getElementById('email_contato').value = config.email_contato || '';

        // Atualiza as notificações
        if (config.notificacoes) {
            const notificacoes = typeof config.notificacoes === 'string' 
                ? JSON.parse(config.notificacoes) 
                : config.notificacoes;

            document.getElementById('notifReservas').checked = notificacoes.reservas || false;
            document.getElementById('notifCheckIn').checked = notificacoes.checkIn || false;
            document.getElementById('notifCheckOut').checked = notificacoes.checkOut || false;
            document.getElementById('notifProdutos').checked = notificacoes.produtos || false;
        }

        // Atualiza a data do último backup
        if (config.ultimo_backup) {
            document.getElementById('ultimoBackup').textContent = 
                new Date(config.ultimo_backup).toLocaleString();
        }
    } catch (error) {
        console.error('Erro:', error);
        showToast(error.message || 'Erro ao carregar configurações', 'danger');
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

        if (!response.ok) {
            throw new Error('Erro ao salvar configurações');
        }

        showToast('Configurações salvas com sucesso', 'success');
        await carregarConfiguracoes();
    } catch (error) {
        console.error('Erro:', error);
        showToast(error.message || 'Erro ao salvar configurações', 'danger');
    }
}

async function fazerBackup() {
    try {
        const response = await fetch('/api/configuracoes/backup', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao gerar backup');
        }

        // Pega o nome do arquivo do header ou gera um nome padrão
        const filename = response.headers.get('Content-Disposition')?.split('filename=')[1] || 
            `backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;

        // Cria um blob com o conteúdo do backup
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Cria um link temporário para download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Limpa o objeto URL e remove o link
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showToast('Backup realizado com sucesso', 'success');
        await carregarConfiguracoes(); // Atualiza a data do último backup
    } catch (error) {
        console.error('Erro:', error);
        showToast(error.message || 'Erro ao fazer backup', 'danger');
    }
}

async function restaurarBackup() {
    const fileInput = document.getElementById('arquivoBackup');
    if (!fileInput.files[0]) {
        showToast('Selecione um arquivo de backup', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('backup', fileInput.files[0]);

    try {
        showToast('Restaurando backup...', 'info');
        const response = await fetch('/api/configuracoes/backup/restaurar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Erro ao restaurar backup');
        }

        const data = await response.json();
        showToast(data.message || 'Backup restaurado com sucesso', 'success');
        
        // Limpa o input de arquivo
        fileInput.value = '';
        
        // Atualiza as configurações após restaurar o backup
        await carregarConfiguracoes();
    } catch (error) {
        console.error('Erro:', error);
        showToast(error.message || 'Erro ao restaurar backup', 'danger');
    }
}

function verificarToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/html/login.html';
        return;
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