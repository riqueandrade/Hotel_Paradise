// Formatar CPF
const formatarCPF = (cpf) => {
    if (!cpf) return '';
    cpf = cpf.replace(/[^\d]/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

// Formatar telefone
const formatarTelefone = (telefone) => {
    if (!telefone) return '';
    telefone = telefone.replace(/[^\d]/g, '');
    if (telefone.length === 11) {
        return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1)$2-$3');
    }
    return telefone.replace(/(\d{2})(\d{4})(\d{4})/, '($1)$2-$3');
};

// Formatar data
const formatarData = (data) => {
    if (!data) return '';
    const d = new Date(data);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
};

// Formatar valor monetário
const formatarValor = (valor) => {
    if (!valor) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
};

// Formatar CEP
const formatarCEP = (cep) => {
    if (!cep) return '';
    cep = cep.replace(/[^\d]/g, '');
    return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
};

// Formatar número do quarto
const formatarNumeroQuarto = (numero) => {
    if (!numero) return '';
    return numero.toString().padStart(3, '0');
};

// Formatar status da reserva
const formatarStatusReserva = (status) => {
    const statusMap = {
        'pendente': 'Pendente',
        'confirmada': 'Confirmada',
        'checkin': 'Check-in',
        'checkout': 'Check-out',
        'cancelada': 'Cancelada'
    };
    return statusMap[status] || status;
};

// Formatar status do quarto
const formatarStatusQuarto = (status) => {
    const statusMap = {
        'disponivel': 'Disponível',
        'ocupado': 'Ocupado',
        'manutencao': 'Manutenção',
        'bloqueado': 'Bloqueado'
    };
    return statusMap[status] || status;
};

module.exports = {
    formatarCPF,
    formatarTelefone,
    formatarData,
    formatarValor,
    formatarCEP,
    formatarNumeroQuarto,
    formatarStatusReserva,
    formatarStatusQuarto
}; 