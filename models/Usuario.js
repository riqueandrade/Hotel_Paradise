const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class Usuario {
    // Buscar usuário por ID
    static async buscarPorId(id) {
        const [usuarios] = await pool.execute(
            'SELECT id, nome, email, cargo, created_at FROM usuarios WHERE id = ?',
            [id]
        );
        return usuarios[0];
    }

    // Buscar usuário por email
    static async buscarPorEmail(email) {
        const [usuarios] = await pool.execute(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );
        return usuarios[0];
    }

    // Criar novo usuário
    static async criar(dados) {
        const {
            nome,
            email,
            senha,
            cargo = 'funcionario'
        } = dados;

        // Verifica se o email já existe
        const usuarioExistente = await this.buscarPorEmail(email);
        if (usuarioExistente) {
            throw new Error('Email já cadastrado');
        }

        // Hash da senha
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        const [result] = await pool.execute(
            `INSERT INTO usuarios (
                nome, email, senha, cargo
            ) VALUES (?, ?, ?, ?)`,
            [nome, email, senhaHash, cargo]
        );

        return {
            id: result.insertId,
            nome,
            email,
            cargo
        };
    }

    // Atualizar usuário
    static async atualizar(id, dados) {
        const {
            nome,
            email,
            senha,
            cargo
        } = dados;

        // Se estiver atualizando o email, verifica se já existe
        if (email) {
            const usuarioExistente = await this.buscarPorEmail(email);
            if (usuarioExistente && usuarioExistente.id !== parseInt(id)) {
                throw new Error('Email já cadastrado');
            }
        }

        let query = 'UPDATE usuarios SET';
        const params = [];

        if (nome) {
            query += ' nome = ?,';
            params.push(nome);
        }

        if (email) {
            query += ' email = ?,';
            params.push(email);
        }

        if (senha) {
            const salt = await bcrypt.genSalt(10);
            const senhaHash = await bcrypt.hash(senha, salt);
            query += ' senha = ?,';
            params.push(senhaHash);
        }

        if (cargo) {
            query += ' cargo = ?,';
            params.push(cargo);
        }

        // Remove a última vírgula
        query = query.slice(0, -1);

        query += ' WHERE id = ?';
        params.push(id);

        await pool.execute(query, params);

        return this.buscarPorId(id);
    }

    // Excluir usuário
    static async excluir(id) {
        await pool.execute('DELETE FROM usuarios WHERE id = ?', [id]);
    }

    // Autenticar usuário
    static async autenticar(email, senha) {
        const usuario = await this.buscarPorEmail(email);
        if (!usuario) {
            throw new Error('Usuário não encontrado');
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            throw new Error('Senha inválida');
        }

        const token = jwt.sign(
            { id: usuario.id, cargo: usuario.cargo },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return {
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                cargo: usuario.cargo
            }
        };
    }

    // Autenticar com Google
    static async autenticarGoogle(profile) {
        let usuario = await this.buscarPorEmail(profile.email);

        if (!usuario) {
            // Cria novo usuário
            const [result] = await pool.execute(
                `INSERT INTO usuarios (
                    nome, email, google_id, cargo
                ) VALUES (?, ?, ?, 'funcionario')`,
                [profile.displayName, profile.email, profile.id]
            );

            usuario = {
                id: result.insertId,
                nome: profile.displayName,
                email: profile.email,
                cargo: 'funcionario'
            };
        } else {
            // Atualiza o google_id se necessário
            if (!usuario.google_id) {
                await pool.execute(
                    'UPDATE usuarios SET google_id = ? WHERE id = ?',
                    [profile.id, usuario.id]
                );
            }
        }

        const token = jwt.sign(
            { id: usuario.id, cargo: usuario.cargo },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return {
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                cargo: usuario.cargo
            }
        };
    }

    // Verificar token
    static async verificarToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const usuario = await this.buscarPorId(decoded.id);
            
            if (!usuario) {
                throw new Error('Usuário não encontrado');
            }

            return {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                cargo: usuario.cargo
            };
        } catch (error) {
            throw new Error('Token inválido');
        }
    }

    // Alterar senha
    static async alterarSenha(id, senhaAtual, novaSenha) {
        const [usuarios] = await pool.execute(
            'SELECT * FROM usuarios WHERE id = ?',
            [id]
        );

        const usuario = usuarios[0];
        if (!usuario) {
            throw new Error('Usuário não encontrado');
        }

        const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
        if (!senhaValida) {
            throw new Error('Senha atual inválida');
        }

        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(novaSenha, salt);

        await pool.execute(
            'UPDATE usuarios SET senha = ? WHERE id = ?',
            [senhaHash, id]
        );
    }

    // Resetar senha
    static async resetarSenha(email) {
        const usuario = await this.buscarPorEmail(email);
        if (!usuario) {
            throw new Error('Usuário não encontrado');
        }

        // Gera uma senha aleatória
        const novaSenha = Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(novaSenha, salt);

        await pool.execute(
            'UPDATE usuarios SET senha = ? WHERE id = ?',
            [senhaHash, usuario.id]
        );

        return novaSenha;
    }

    // Buscar todos os usuários
    static async buscarTodos() {
        const [usuarios] = await pool.execute(
            'SELECT id, nome, email, cargo, created_at FROM usuarios ORDER BY nome'
        );
        return usuarios;
    }

    // Buscar logs de acesso
    static async buscarLogsAcesso(usuarioId, limite = 10) {
        const [logs] = await pool.execute(
            `SELECT * FROM logs_acesso 
             WHERE usuario_id = ? 
             ORDER BY data_acesso DESC 
             LIMIT ?`,
            [usuarioId, limite]
        );
        return logs;
    }

    // Registrar log de acesso
    static async registrarLogAcesso(usuarioId, ip, userAgent) {
        await pool.execute(
            `INSERT INTO logs_acesso (
                usuario_id, ip, user_agent
            ) VALUES (?, ?, ?)`,
            [usuarioId, ip, userAgent]
        );
    }
}

module.exports = Usuario; 