// Validação de CPF
const validarCPF = (cpf) => {
    if (!cpf) return false;
    
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, '');

    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    // Validação do primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let dv1 = resto > 9 ? 0 : resto;
    if (dv1 !== parseInt(cpf.charAt(9))) return false;

    // Validação do segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    let dv2 = resto > 9 ? 0 : resto;
    if (dv2 !== parseInt(cpf.charAt(10))) return false;

    return true;
};

// Validação de email
const validarEmail = (email) => {
    if (!email) return false;
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
};

// Validação de senha
const validarSenha = (senha) => {
    if (!senha) return false;
    // Mínimo 8 caracteres, pelo menos uma letra maiúscula, uma minúscula e um número
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return regex.test(senha);
};

// Validação de datas
const validarDatas = (dataInicio, dataFim) => {
    if (!dataInicio || !dataFim) return false;

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Verifica se as datas são válidas
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) return false;

    // Verifica se a data inicial é maior ou igual a hoje
    if (inicio < hoje) return false;

    // Verifica se a data final é maior que a inicial
    if (fim <= inicio) return false;

    return true;
};

// Validação de número do quarto
const validarNumeroQuarto = (numero) => {
    if (!numero) return false;
    // Aceita números de 1 a 999 com possível prefixo alfabético
    const regex = /^[A-Za-z]?\d{1,3}$/;
    return regex.test(numero.toString());
};

// Validação de valor monetário
const validarValor = (valor) => {
    if (!valor) return false;
    // Aceita valores positivos com até 2 casas decimais
    return typeof valor === 'number' && valor > 0 && Number.isFinite(valor);
};

// Validação de telefone
const validarTelefone = (telefone) => {
    if (!telefone) return false;
    // Remove caracteres não numéricos
    telefone = telefone.replace(/[^\d]/g, '');
    // Aceita formatos: (XX)XXXXX-XXXX ou XXXXXXXXXXX
    return /^[1-9]{2}9?[0-9]{8}$/.test(telefone);
};

module.exports = {
    validarCPF,
    validarEmail,
    validarSenha,
    validarDatas,
    validarNumeroQuarto,
    validarValor,
    validarTelefone
}; 