// Retorna a data atual sem o horário
const hoje = () => {
    const data = new Date();
    data.setHours(0, 0, 0, 0);
    return data;
};

// Calcula a diferença em dias entre duas datas
const diferencaDias = (dataInicio, dataFim) => {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diffTime = Math.abs(fim - inicio);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Adiciona dias a uma data
const adicionarDias = (data, dias) => {
    const novaData = new Date(data);
    novaData.setDate(novaData.getDate() + dias);
    return novaData;
};

// Retorna o primeiro dia do mês
const primeiroDiaMes = (data = new Date()) => {
    const primeiroDia = new Date(data.getFullYear(), data.getMonth(), 1);
    primeiroDia.setHours(0, 0, 0, 0);
    return primeiroDia;
};

// Retorna o último dia do mês
const ultimoDiaMes = (data = new Date()) => {
    const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0);
    ultimoDia.setHours(23, 59, 59, 999);
    return ultimoDia;
};

// Verifica se uma data está entre duas outras
const dataEntre = (data, inicio, fim) => {
    const dataVerificar = new Date(data);
    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);
    return dataVerificar >= dataInicio && dataVerificar <= dataFim;
};

// Retorna o nome do mês
const nomeMes = (data = new Date()) => {
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril',
        'Maio', 'Junho', 'Julho', 'Agosto',
        'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return meses[data.getMonth()];
};

// Retorna o nome do dia da semana
const nomeDiaSemana = (data = new Date()) => {
    const dias = [
        'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
        'Quinta-feira', 'Sexta-feira', 'Sábado'
    ];
    return dias[data.getDay()];
};

module.exports = {
    hoje,
    diferencaDias,
    adicionarDias,
    primeiroDiaMes,
    ultimoDiaMes,
    dataEntre,
    nomeMes,
    nomeDiaSemana
}; 