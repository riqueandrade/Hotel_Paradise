// Variáveis globais
let produtos = [];
const modalProduto = new bootstrap.Modal(document.getElementById('modalProduto'));

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    verificarToken();
    carregarProdutos();
    
    // Listeners dos filtros
    const searchInput = document.getElementById('searchInput');
    const categoriaFilter = document.getElementById('categoriaFilter');
    const estoqueFilter = document.getElementById('estoqueFilter');
    const sortBy = document.getElementById('sortBy');
    const btnSalvar = document.getElementById('btnSalvar');

    if (searchInput) searchInput.addEventListener('input', debounce(aplicarFiltros, 500));
    if (categoriaFilter) categoriaFilter.addEventListener('change', aplicarFiltros);
    if (estoqueFilter) estoqueFilter.addEventListener('change', aplicarFiltros);
    if (sortBy) sortBy.addEventListener('change', aplicarFiltros);
    if (btnSalvar) btnSalvar.addEventListener('click', salvarProduto);
});

// Funções de API
async function carregarProdutos(filtros = {}) {
    try {
        const queryParams = new URLSearchParams(filtros);
        const response = await fetch(`/api/produtos?${queryParams}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Erro ao carregar produtos');
        
        produtos = await response.json();
        renderizarProdutos(produtos);
        atualizarEstatisticas();
    } catch (error) {
        console.error('Erro:', error);
        mostrarNotificacao('Erro ao carregar produtos', 'danger');
    }
}

async function salvarProduto() {
    try {
        if (!validarFormulario()) return;

        const produto = {
            nome: document.getElementById('nomeProduto').value,
            categoria: document.getElementById('categoriaProduto').value,
            preco: parseFloat(document.getElementById('precoProduto').value),
            estoque: parseInt(document.getElementById('estoqueProduto').value),
            estoque_minimo: parseInt(document.getElementById('estoqueMinimoProduto').value),
            descricao: document.getElementById('descricaoProduto').value
        };

        const id = document.getElementById('produtoId').value;
        const url = id ? `/api/produtos/${id}` : '/api/produtos';
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(produto)
        });

        if (!response.ok) throw new Error('Erro ao salvar produto');

        modalProduto.hide();
        await carregarProdutos();
        mostrarNotificacao('Produto salvo com sucesso', 'success');
    } catch (error) {
        console.error('Erro:', error);
        mostrarNotificacao('Erro ao salvar produto', 'danger');
    }
}

async function excluirProduto(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
        const response = await fetch(`/api/produtos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Erro ao excluir produto');

        await carregarProdutos();
        mostrarNotificacao('Produto excluído com sucesso', 'success');
    } catch (error) {
        console.error('Erro:', error);
        mostrarNotificacao('Erro ao excluir produto', 'danger');
    }
}

// Funções de UI
function renderizarProdutos(produtos) {
    const tbody = document.getElementById('produtosTableBody');
    
    if (!produtos || produtos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="empty-state">
                        <i class="bi bi-box-seam display-4 text-muted"></i>
                        <h4 class="mt-3">Nenhum produto encontrado</h4>
                        <p class="text-muted">Não há produtos que correspondam aos filtros.</p>
                        <button class="btn btn-primary" onclick="modalProduto.show()">
                            <i class="bi bi-plus-lg"></i> Novo Produto
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = produtos.map(produto => {
        const preco = parseFloat(produto.preco) || 0;
        
        const status = getStatusEstoque(produto.estoque, produto.estoque_minimo);
        
        return `
            <tr>
                <td>${produto.id}</td>
                <td>${produto.nome}</td>
                <td><span class="badge bg-${produto.categoria}">${formatarCategoria(produto.categoria)}</span></td>
                <td>R$ ${preco.toFixed(2)}</td>
                <td>${produto.estoque}</td>
                <td><span class="badge bg-${status.cor}">${status.texto}</span></td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="editarProduto(${produto.id})" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="ajustarEstoque(${produto.id})" title="Ajustar Estoque">
                            <i class="bi bi-plus-slash-minus"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="excluirProduto(${produto.id})" title="Excluir">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function editarProduto(id) {
    const produto = produtos.find(p => p.id === id);
    if (!produto) return;

    document.getElementById('produtoId').value = produto.id;
    document.getElementById('nomeProduto').value = produto.nome;
    document.getElementById('categoriaProduto').value = produto.categoria;
    document.getElementById('precoProduto').value = produto.preco;
    document.getElementById('estoqueProduto').value = produto.estoque;
    document.getElementById('estoqueMinimoProduto').value = produto.estoque_minimo;
    document.getElementById('descricaoProduto').value = produto.descricao || '';
    
    document.querySelector('#modalProduto .modal-title').textContent = 'Editar Produto';
    modalProduto.show();
}

function ajustarEstoque(id) {
    const produto = produtos.find(p => p.id === id);
    if (!produto) return;

    const quantidade = prompt(`Ajustar estoque de "${produto.nome}"\nQuantidade atual: ${produto.estoque}\nDigite a nova quantidade:`);
    if (quantidade === null) return;

    const novaQuantidade = parseInt(quantidade);
    if (isNaN(novaQuantidade) || novaQuantidade < 0) {
        mostrarNotificacao('Quantidade inválida', 'danger');
        return;
    }

    atualizarEstoque(id, novaQuantidade);
}

async function atualizarEstoque(id, quantidade) {
    try {
        const response = await fetch(`/api/produtos/${id}/estoque`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ estoque: quantidade })
        });

        if (!response.ok) throw new Error('Erro ao atualizar estoque');

        await carregarProdutos();
        mostrarNotificacao('Estoque atualizado com sucesso', 'success');
    } catch (error) {
        console.error('Erro:', error);
        mostrarNotificacao('Erro ao atualizar estoque', 'danger');
    }
}

function atualizarEstatisticas() {
    const stats = {
        total: produtos.length,
        emEstoque: produtos.filter(p => p.estoque > p.estoque_minimo).length,
        estoqueBaixo: produtos.filter(p => p.estoque > 0 && p.estoque <= p.estoque_minimo).length,
        semEstoque: produtos.filter(p => p.estoque === 0).length
    };

    document.getElementById('totalProdutos').textContent = stats.total;
    document.getElementById('produtosEmEstoque').textContent = stats.emEstoque;
    document.getElementById('produtosEstoqueBaixo').textContent = stats.estoqueBaixo;
    document.getElementById('produtosSemEstoque').textContent = stats.semEstoque;
}

function aplicarFiltros() {
    const filtros = {
        busca: document.getElementById('searchInput').value,
        categoria: document.getElementById('categoriaFilter').value,
        estoque: document.getElementById('estoqueFilter').value,
        ordenacao: document.getElementById('sortBy').value
    };
    carregarProdutos(filtros);
}

// Funções auxiliares
function getStatusEstoque(estoque, minimo) {
    if (estoque === 0) {
        return { cor: 'danger', texto: 'Sem Estoque' };
    }
    if (estoque <= minimo) {
        return { cor: 'warning', texto: 'Estoque Baixo' };
    }
    return { cor: 'success', texto: 'Em Estoque' };
}

function formatarCategoria(categoria) {
    const categorias = {
        'bebidas': 'Bebidas',
        'alimentos': 'Alimentos',
        'higiene': 'Higiene',
        'outros': 'Outros'
    };
    return categorias[categoria.toLowerCase()] || categoria;
}

function validarFormulario() {
    const form = document.getElementById('produtoForm');
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return false;
    }
    return true;
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

function verificarToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}

// Função de debounce para evitar múltiplas chamadas
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