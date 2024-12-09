// Variáveis globais
let graficoAtual = null;
let dadosRelatorio = null;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    verificarToken();
    inicializarEventos();
    carregarRelatorioInicial();
});

function inicializarEventos() {
    // Listeners dos filtros
    document.getElementById('tipoRelatorio').addEventListener('change', atualizarRelatorio);
    document.getElementById('periodoRelatorio').addEventListener('change', handlePeriodoChange);
    document.getElementById('formatoRelatorio').addEventListener('change', alternarVisualizacao);
    document.getElementById('dataInicial').addEventListener('change', atualizarRelatorio);
    document.getElementById('dataFinal').addEventListener('change', atualizarRelatorio);

    // Listeners dos botões
    document.getElementById('btnImprimir').addEventListener('click', imprimirRelatorio);
    document.getElementById('btnExportar').addEventListener('click', exportarRelatorio);
}

// Funções de API
async function carregarDadosRelatorio() {
    try {
        const tipo = document.getElementById('tipoRelatorio').value;
        const periodo = document.getElementById('periodoRelatorio').value;
        const dataInicial = document.getElementById('dataInicial').value;
        const dataFinal = document.getElementById('dataFinal').value;

        const params = new URLSearchParams({
            tipo,
            periodo,
            ...(periodo === 'personalizado' && { dataInicial, dataFinal })
        });

        const response = await fetch(`/api/relatorios?${params}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Erro ao carregar dados do relatório');
        
        dadosRelatorio = await response.json();
        return dadosRelatorio;
    } catch (error) {
        console.error('Erro:', error);
        mostrarNotificacao('Erro ao carregar dados do relatório', 'danger');
        return null;
    }
}

// Funções de UI
function carregarRelatorioInicial() {
    document.getElementById('tipoRelatorio').value = 'ocupacao';
    document.getElementById('periodoRelatorio').value = 'mes';
    document.getElementById('formatoRelatorio').value = 'grafico';
    atualizarRelatorio();
}

async function atualizarRelatorio() {
    const dados = await carregarDadosRelatorio();
    if (!dados) return;

    const formato = document.getElementById('formatoRelatorio').value;
    if (formato === 'grafico') {
        renderizarGrafico(dados);
    } else {
        renderizarTabela(dados);
    }
}

function handlePeriodoChange(event) {
    const periodoPersonalizado = document.getElementById('datasPersonalizadas');
    periodoPersonalizado.classList.toggle('d-none', event.target.value !== 'personalizado');
    
    if (event.target.value !== 'personalizado') {
        atualizarRelatorio();
    }
}

function alternarVisualizacao() {
    const formato = document.getElementById('formatoRelatorio').value;
    const areaGrafico = document.getElementById('areaGrafico');
    const areaTabela = document.querySelector('.table-responsive');

    if (formato === 'grafico') {
        areaGrafico.style.display = 'block';
        areaTabela.style.display = 'none';
        renderizarGrafico(dadosRelatorio);
    } else {
        areaGrafico.style.display = 'none';
        areaTabela.style.display = 'block';
        renderizarTabela(dadosRelatorio);
    }
}

function renderizarGrafico(dados) {
    const areaGrafico = document.getElementById('areaGrafico');
    
    // Limpa a área do gráfico
    areaGrafico.innerHTML = '<canvas></canvas>';
    
    const ctx = areaGrafico.querySelector('canvas').getContext('2d');
    const tipo = document.getElementById('tipoRelatorio').value;
    
    if (graficoAtual) {
        graficoAtual.destroy();
    }

    const config = gerarConfigGrafico(tipo, dados);
    graficoAtual = new Chart(ctx, config);
}

function renderizarTabela(dados) {
    const tipo = document.getElementById('tipoRelatorio').value;
    const header = document.getElementById('relatorioHeader');
    const body = document.getElementById('relatorioBody');

    const { colunas, linhas } = gerarDadosTabela(tipo, dados);

    header.innerHTML = `
        <tr>
            ${colunas.map(coluna => `<th>${coluna}</th>`).join('')}
        </tr>
    `;

    body.innerHTML = linhas.map(linha => `
        <tr>
            ${linha.map(celula => `<td>${celula}</td>`).join('')}
        </tr>
    `).join('');
}

// Funções de Exportação
function imprimirRelatorio() {
    window.print();
}

function exportarRelatorio() {
    const tipo = document.getElementById('tipoRelatorio').value;
    const dados = dadosRelatorio;
    
    if (!dados) {
        mostrarNotificacao('Não há dados para exportar', 'warning');
        return;
    }

    const { colunas, linhas } = gerarDadosTabela(tipo, dados);
    const csv = [
        colunas.join(','),
        ...linhas.map(linha => linha.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${tipo}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Funções Auxiliares
function gerarConfigGrafico(tipo, dados) {
    const configs = {
        ocupacao: {
            type: 'bar',
            data: {
                labels: dados.map(d => d.periodo),
                datasets: [{
                    label: 'Taxa de Ocupação (%)',
                    data: dados.map(d => d.taxa_ocupacao),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        },
        financeiro: {
            type: 'line',
            data: {
                labels: dados.map(d => d.periodo),
                datasets: [{
                    label: 'Receita (R$)',
                    data: dados.map(d => d.receita),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        },
        produtos: {
            type: 'pie',
            data: {
                labels: dados.map(d => d.produto),
                datasets: [{
                    data: dados.map(d => d.quantidade),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)',
                        'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)',
                        'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        },
        clientes: {
            type: 'bar',
            data: {
                labels: dados.map(d => d.categoria),
                datasets: [{
                    label: 'Número de Clientes',
                    data: dados.map(d => d.quantidade),
                    backgroundColor: 'rgba(153, 102, 255, 0.5)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        }
    };

    return configs[tipo];
}

function gerarDadosTabela(tipo, dados) {
    const estruturas = {
        ocupacao: {
            colunas: ['Período', 'Quartos Ocupados', 'Total de Quartos', 'Taxa de Ocupação'],
            linhas: dados.map(d => [
                d.periodo,
                d.quartos_ocupados,
                d.total_quartos,
                `${d.taxa_ocupacao}%`
            ])
        },
        financeiro: {
            colunas: ['Período', 'Receita', 'Despesas', 'Lucro'],
            linhas: dados.map(d => [
                d.periodo,
                `R$ ${d.receita.toFixed(2)}`,
                `R$ ${d.despesas.toFixed(2)}`,
                `R$ ${(d.receita - d.despesas).toFixed(2)}`
            ])
        },
        produtos: {
            colunas: ['Produto', 'Quantidade Vendida', 'Receita Total'],
            linhas: dados.map(d => [
                d.produto,
                d.quantidade,
                `R$ ${d.receita.toFixed(2)}`
            ])
        },
        clientes: {
            colunas: ['Categoria', 'Quantidade', 'Valor Médio Gasto'],
            linhas: dados.map(d => [
                d.categoria,
                d.quantidade,
                `R$ ${d.valor_medio.toFixed(2)}`
            ])
        }
    };

    return estruturas[tipo];
}

// Função de Notificação
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

// Função de Verificação de Token
function verificarToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/html/login.html';
        return;
    }
} 