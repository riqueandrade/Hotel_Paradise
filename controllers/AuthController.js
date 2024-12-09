const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

class AuthController {
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            // Busca o usuário pelo email
            const [users] = await pool.execute(
                'SELECT u.*, c.nome as cargo_nome FROM usuarios u JOIN cargos c ON u.cargo_id = c.id WHERE u.email = ?',
                [email]
            );

            if (users.length === 0) {
                return res.status(401).json({ message: 'Email ou senha inválidos' });
            }

            const user = users[0];

            // Verifica se a senha está correta
            const validPassword = await bcrypt.compare(password, user.senha);
            if (!validPassword) {
                return res.status(401).json({ message: 'Email ou senha inválidos' });
            }

            // Gera o token JWT
            const token = jwt.sign(
                { 
                    id: user.id,
                    nome: user.nome,
                    email: user.email,
                    cargo: user.cargo_nome
                },
                process.env.JWT_SECRET || 'hotel_paradise_secret',
                { expiresIn: '24h' }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    nome: user.nome,
                    email: user.email,
                    cargo: user.cargo_nome
                }
            });
        } catch (error) {
            console.error('Erro no login:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }

    static async registro(req, res) {
        try {
            const { nome, email, password, cargo_id } = req.body;

            // Verifica se o email já está em uso
            const [existingUsers] = await pool.execute(
                'SELECT id FROM usuarios WHERE email = ?',
                [email]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({ message: 'Email já está em uso' });
            }

            // Hash da senha
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Insere o novo usuário
            const [result] = await pool.execute(
                'INSERT INTO usuarios (nome, email, senha, cargo_id) VALUES (?, ?, ?, ?)',
                [nome, email, hashedPassword, cargo_id]
            );

            // Busca o cargo do usuário
            const [cargos] = await pool.execute(
                'SELECT nome FROM cargos WHERE id = ?',
                [cargo_id]
            );

            const token = jwt.sign(
                { 
                    id: result.insertId,
                    nome,
                    email,
                    cargo: cargos[0].nome
                },
                process.env.JWT_SECRET || 'hotel_paradise_secret',
                { expiresIn: '24h' }
            );

            res.status(201).json({
                token,
                user: {
                    id: result.insertId,
                    nome,
                    email,
                    cargo: cargos[0].nome
                }
            });
        } catch (error) {
            console.error('Erro no registro:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }

    static async verificarToken(req, res) {
        try {
            // O middleware de autenticação já verificou o token
            // Busca informações atualizadas do usuário
            const [users] = await pool.execute(
                'SELECT u.*, c.nome as cargo_nome FROM usuarios u JOIN cargos c ON u.cargo_id = c.id WHERE u.id = ?',
                [req.userId]
            );

            if (users.length === 0) {
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }

            const user = users[0];

            res.json({
                valid: true,
                user: {
                    id: user.id,
                    nome: user.nome,
                    email: user.email,
                    cargo: user.cargo_nome
                }
            });
        } catch (error) {
            console.error('Erro ao verificar token:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }

    static async googleCallback(req, res) {
        try {
            console.log('User from Google:', req.user);

            // Gera o token JWT após autenticação bem-sucedida
            const token = jwt.sign(
                { 
                    id: req.user.id,
                    nome: req.user.nome,
                    email: req.user.email,
                    cargo: req.user.cargo_nome
                },
                process.env.JWT_SECRET || 'hotel_paradise_secret',
                { expiresIn: '24h' }
            );
            
            // Redireciona para uma página que salvará o token e redirecionará para o dashboard
            res.send(`
                <html>
                <body>
                    <script>
                        try {
                            // Salva o token no localStorage
                            localStorage.setItem('token', '${token}');
                            console.log('Token salvo:', '${token}');
                            // Redireciona para o dashboard
                            window.location.href = '/html/dashboard.html';
                        } catch (error) {
                            console.error('Erro ao salvar token:', error);
                            alert('Erro ao fazer login. Por favor, tente novamente.');
                            window.location.href = '/html/login.html';
                        }
                    </script>
                </body>
                </html>
            `);
        } catch (error) {
            console.error('Erro no callback do Google:', error);
            res.redirect('/html/login.html');
        }
    }
}

module.exports = AuthController; 