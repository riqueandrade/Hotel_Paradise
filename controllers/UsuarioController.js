const Usuario = require('../models/Usuario');
const { validarEmail, validarSenha } = require('../utils/validations');
const errorHandler = require('../utils/errorHandler');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class UsuarioController {
    // Login
    static async login(req, res) {
        try {
            const { email, senha } = req.body;

            // Validações
            if (!validarEmail(email)) {
                return res.status(400).json({ message: 'Email inválido' });
            }

            const usuario = await Usuario.buscarPorEmail(email);
            if (!usuario) {
                return res.status(401).json({ message: 'Credenciais inválidas' });
            }

            const senhaValida = await bcrypt.compare(senha, usuario.senha);
            if (!senhaValida) {
                return res.status(401).json({ message: 'Credenciais inválidas' });
            }

            const token = jwt.sign(
                { id: usuario.id, email: usuario.email },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                token,
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    cargo: usuario.cargo
                }
            });
        } catch (error) {
            errorHandler(res, error, 'Erro ao realizar login');
        }
    }

    // Registro
    static async registrar(req, res) {
        try {
            const { nome, email, senha, cargo } = req.body;

            // Validações
            if (!validarEmail(email)) {
                return res.status(400).json({ message: 'Email inválido' });
            }

            if (!validarSenha(senha)) {
                return res.status(400).json({ message: 'Senha inválida' });
            }

            // Verifica se email já existe
            if (await Usuario.emailExiste(email)) {
                return res.status(400).json({ message: 'Email já cadastrado' });
            }

            // Hash da senha
            const senhaHash = await bcrypt.hash(senha, 10);

            const novoUsuario = await Usuario.criar({
                nome,
                email,
                senha: senhaHash,
                cargo
            });

            res.status(201).json({
                usuario: {
                    id: novoUsuario.id,
                    nome: novoUsuario.nome,
                    email: novoUsuario.email,
                    cargo: novoUsuario.cargo
                }
            });
        } catch (error) {
            errorHandler(res, error, 'Erro ao registrar usuário');
        }
    }

    // Buscar usuário atual
    static async buscarUsuarioAtual(req, res) {
        try {
            const usuario = await Usuario.buscarPorId(req.usuario.id);
            if (!usuario) {
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }

            res.json({
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                cargo: usuario.cargo
            });
        } catch (error) {
            errorHandler(res, error, 'Erro ao buscar usuário');
        }
    }

    // Atualizar perfil
    static async atualizarPerfil(req, res) {
        try {
            const { nome, email, senha_atual, nova_senha } = req.body;
            const id = req.usuario.id;

            const usuario = await Usuario.buscarPorId(id);
            if (!usuario) {
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }

            // Validações
            if (email && !validarEmail(email)) {
                return res.status(400).json({ message: 'Email inválido' });
            }

            if (email && email !== usuario.email) {
                if (await Usuario.emailExiste(email)) {
                    return res.status(400).json({ message: 'Email já cadastrado' });
                }
            }

            // Se estiver alterando a senha
            if (nova_senha) {
                if (!senha_atual) {
                    return res.status(400).json({ message: 'Senha atual é necessária' });
                }

                const senhaValida = await bcrypt.compare(senha_atual, usuario.senha);
                if (!senhaValida) {
                    return res.status(400).json({ message: 'Senha atual incorreta' });
                }

                if (!validarSenha(nova_senha)) {
                    return res.status(400).json({ message: 'Nova senha inválida' });
                }
            }

            const dados = {
                nome: nome || usuario.nome,
                email: email || usuario.email
            };

            if (nova_senha) {
                dados.senha = await bcrypt.hash(nova_senha, 10);
            }

            const usuarioAtualizado = await Usuario.atualizar(id, dados);

            res.json({
                id: usuarioAtualizado.id,
                nome: usuarioAtualizado.nome,
                email: usuarioAtualizado.email,
                cargo: usuarioAtualizado.cargo
            });
        } catch (error) {
            errorHandler(res, error, 'Erro ao atualizar perfil');
        }
    }

    // Listar todos os usuários (apenas para admin)
    static async listar(req, res) {
        try {
            if (req.usuario.cargo !== 'admin') {
                return res.status(403).json({ message: 'Acesso negado' });
            }

            const usuarios = await Usuario.buscarTodos();
            res.json(usuarios.map(u => ({
                id: u.id,
                nome: u.nome,
                email: u.email,
                cargo: u.cargo
            })));
        } catch (error) {
            errorHandler(res, error, 'Erro ao listar usuários');
        }
    }

    // Excluir usuário (apenas para admin)
    static async excluir(req, res) {
        try {
            if (req.usuario.cargo !== 'admin') {
                return res.status(403).json({ message: 'Acesso negado' });
            }

            if (req.params.id === req.usuario.id) {
                return res.status(400).json({ message: 'Não é possível excluir o próprio usuário' });
            }

            await Usuario.excluir(req.params.id);
            res.json({ message: 'Usuário excluído com sucesso' });
        } catch (error) {
            errorHandler(res, error, 'Erro ao excluir usuário');
        }
    }
}

module.exports = UsuarioController; 