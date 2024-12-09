const errorHandler = (res, error, mensagemPadrao) => {
    console.error(error);

    // Erros específicos do MySQL
    if (error.code) {
        switch (error.code) {
            case 'ER_DUP_ENTRY':
                return res.status(400).json({
                    message: 'Registro duplicado'
                });
            case 'ER_NO_REFERENCED_ROW':
            case 'ER_NO_REFERENCED_ROW_2':
                return res.status(400).json({
                    message: 'Referência inválida'
                });
            case 'ER_ROW_IS_REFERENCED':
            case 'ER_ROW_IS_REFERENCED_2':
                return res.status(400).json({
                    message: 'Não é possível excluir este registro pois ele está sendo referenciado'
                });
        }
    }

    // Erros de validação
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            message: error.message
        });
    }

    // Erros de autenticação
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            message: 'Token inválido'
        });
    }

    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            message: 'Token expirado'
        });
    }

    // Erros personalizados
    if (error.statusCode) {
        return res.status(error.statusCode).json({
            message: error.message
        });
    }

    // Erro padrão
    res.status(500).json({
        message: mensagemPadrao || 'Erro interno do servidor'
    });
};

module.exports = errorHandler; 