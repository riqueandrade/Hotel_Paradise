const db = require('../database/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UsuarioController {
    static async login(req, res) {
        const { email, senha } = req.body;

        try {
            // Busca o usuário pelo email
            const [usuarios] = await db.query(
                `SELECT u.*, c.nome as cargo_nome 
                 FROM usuarios u 
                 JOIN cargos c ON u.cargo_id = c.id 
                 WHERE u.email = ?`,
                [email]
            );

            if (usuarios.length === 0) {
                return res.status(401).json({ error: 'Email ou senha inválidos' });
            }

            const usuario = usuarios[0];

            // Verifica a senha
            const senhaValida = await bcrypt.compare(senha, usuario.senha);
            if (!senhaValida) {
                return res.status(401).json({ error: 'Email ou senha inválidos' });
            }

            // Gera o token JWT
            const token = jwt.sign(
                { 
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    cargo: {
                        id: usuario.cargo_id,
                        nome: usuario.cargo_nome
                    }
                },
                process.env.JWT_SECRET || 'hotel_paradise_secret',
                { expiresIn: '24h' }
            );

            // Atualiza último acesso
            await db.query('UPDATE usuarios SET ultimo_acesso = CURRENT_TIMESTAMP WHERE id = ?', [usuario.id]);

            res.json({
                token,
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    cargo: {
                        id: usuario.cargo_id,
                        nome: usuario.cargo_nome
                    }
                }
            });
        } catch (error) {
            console.error('Erro no login:', error);
            res.status(500).json({ error: 'Erro ao realizar login' });
        }
    }

    static async cadastrar(req, res) {
        const { nome, email, senha, cargo_id } = req.body;

        try {
            // Verifica se o email já está em uso
            const [usuarios] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
            if (usuarios.length > 0) {
                return res.status(400).json({ error: 'Email já está em uso' });
            }

            // Gera o hash da senha
            const salt = await bcrypt.genSalt(10);
            const senhaHash = await bcrypt.hash(senha, salt);

            // Insere o novo usuário
            const [resultado] = await db.query(
                'INSERT INTO usuarios (nome, email, senha, cargo_id) VALUES (?, ?, ?, ?)',
                [nome, email, senhaHash, cargo_id]
            );

            // Busca as informações completas do usuário inserido
            const [novoUsuario] = await db.query(
                `SELECT u.id, u.nome, u.email, c.nome as cargo_nome 
                 FROM usuarios u 
                 JOIN cargos c ON u.cargo_id = c.id 
                 WHERE u.id = ?`,
                [resultado.insertId]
            );

            res.status(201).json({
                message: 'Usuário cadastrado com sucesso',
                usuario: {
                    id: novoUsuario[0].id,
                    nome: novoUsuario[0].nome,
                    email: novoUsuario[0].email,
                    cargo: {
                        id: cargo_id,
                        nome: novoUsuario[0].cargo_nome
                    }
                }
            });
        } catch (error) {
            console.error('Erro no cadastro:', error);
            res.status(500).json({ error: 'Erro ao cadastrar usuário' });
        }
    }

    static async getPerfil(req, res) {
        try {
            const userId = req.userId;

            const [usuarios] = await db.query(
                `SELECT u.id, u.nome, u.email, c.nome as cargo_nome, c.id as cargo_id
                 FROM usuarios u
                 JOIN cargos c ON u.cargo_id = c.id
                 WHERE u.id = ?`,
                [userId]
            );

            if (usuarios.length === 0) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            const usuario = usuarios[0];
            
            res.json({
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                cargo: {
                    id: usuario.cargo_id,
                    nome: usuario.cargo_nome
                }
            });
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            res.status(500).json({ error: 'Erro ao buscar perfil do usuário' });
        }
    }

    static async atualizarPerfil(req, res) {
        const { nome, email } = req.body;
        const userId = req.userId;

        try {
            // Verifica se o email já está em uso por outro usuário
            const [usuarios] = await db.query(
                'SELECT id FROM usuarios WHERE email = ? AND id != ?',
                [email, userId]
            );

            if (usuarios.length > 0) {
                return res.status(400).json({ error: 'Email já está em uso' });
            }

            // Atualiza o perfil
            await db.query(
                'UPDATE usuarios SET nome = ?, email = ? WHERE id = ?',
                [nome, email, userId]
            );

            res.json({ message: 'Perfil atualizado com sucesso' });
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            res.status(500).json({ error: 'Erro ao atualizar perfil' });
        }
    }

    static async alterarSenha(req, res) {
        const { senha_atual, nova_senha } = req.body;
        const userId = req.userId;

        try {
            // Busca o usuário
            const [usuarios] = await db.query(
                'SELECT senha FROM usuarios WHERE id = ?',
                [userId]
            );

            // Verifica a senha atual
            const senhaValida = await bcrypt.compare(senha_atual, usuarios[0].senha);
            if (!senhaValida) {
                return res.status(401).json({ error: 'Senha atual incorreta' });
            }

            // Gera o hash da nova senha
            const salt = await bcrypt.genSalt(10);
            const senhaHash = await bcrypt.hash(nova_senha, salt);

            // Atualiza a senha
            await db.query(
                'UPDATE usuarios SET senha = ? WHERE id = ?',
                [senhaHash, userId]
            );

            res.json({ message: 'Senha alterada com sucesso' });
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            res.status(500).json({ error: 'Erro ao alterar senha' });
        }
    }
}

module.exports = UsuarioController; 