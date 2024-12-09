USE hotel_paradise;

-- Limpar dados existentes na ordem correta (respeitando as chaves estrangeiras)
DELETE FROM pagamentos;
DELETE FROM consumos;
DELETE FROM reservas;
DELETE FROM produtos;
DELETE FROM quartos;
DELETE FROM tipos_quarto;
DELETE FROM clientes;
DELETE FROM usuarios;
DELETE FROM cargos;

-- Inserir cargos (precisa ser primeiro pois é referenciado por usuarios)
INSERT INTO cargos (nome, descricao) VALUES
('Administrador', 'Acesso total ao sistema'),
('Gerente', 'Gerenciamento de reservas e funcionários'),
('Recepcionista', 'Atendimento aos clientes e gestão de reservas');

-- Inserir usuário administrador padrão (senha: admin123)
INSERT INTO usuarios (nome, email, senha, cargo_id) VALUES
('Administrador', 'admin@hotelparadise.com', '$2a$10$n8qF0s6UHXyZJ3Y1.lO3/.3GxgJqB1RV0QwqbHsDxpihwL2ADvxVi', 
(SELECT id FROM cargos WHERE nome = 'Administrador'));

-- Inserir tipos de quarto (precisa ser antes dos quartos)
INSERT INTO tipos_quarto (nome, descricao, preco_diaria) VALUES
('Standard', 'Quarto confortável com duas camas de solteiro', 150.00),
('Standard Plus', 'Quarto confortável com cama de casal', 150.00),
('Luxo', 'Quarto Luxo com vista para a cidade', 250.00),
('Luxo Família', 'Quarto Luxo Família com três camas', 300.00),
('Suite Master', 'Suite Master com hidromassagem', 400.00),
('Suite Presidencial', 'Suite Presidencial com sala de estar', 500.00);

-- Inserir quartos (usando subquery para pegar o id do tipo)
INSERT INTO quartos (numero, tipo_id, status, andar) VALUES
('101', (SELECT id FROM tipos_quarto WHERE nome = 'Standard'), 'disponivel', '1'),
('102', (SELECT id FROM tipos_quarto WHERE nome = 'Standard Plus'), 'disponivel', '1'),
('201', (SELECT id FROM tipos_quarto WHERE nome = 'Luxo'), 'disponivel', '2'),
('202', (SELECT id FROM tipos_quarto WHERE nome = 'Luxo Família'), 'disponivel', '2'),
('301', (SELECT id FROM tipos_quarto WHERE nome = 'Suite Master'), 'disponivel', '3'),
('302', (SELECT id FROM tipos_quarto WHERE nome = 'Suite Presidencial'), 'disponivel', '3');

-- Inserir produtos
INSERT INTO produtos (nome, categoria, descricao, preco, estoque, estoque_minimo) VALUES
('Água Mineral 500ml', 'bebidas', 'Água mineral sem gás', 5.00, 100, 20),
('Refrigerante 350ml', 'bebidas', 'Refrigerante em lata', 7.00, 80, 15),
('Chocolate', 'alimentos', 'Barra de chocolate 90g', 8.00, 50, 10),
('Salgadinho', 'alimentos', 'Pacote de salgadinho 90g', 7.50, 40, 10),
('Kit Dental', 'higiene', 'Escova e pasta de dente', 15.00, 30, 10),
('Sabonete', 'higiene', 'Sabonete em barra 90g', 3.00, 100, 20);

-- Inserir configurações iniciais
INSERT INTO configuracoes (nome_hotel, endereco, telefone, email_contato, notificacoes) VALUES
('Hotel Paradise', 'Rua Principal, 123 - Centro', '(11) 1234-5678', 'contato@hotelparadise.com', 
'{"reservas": true, "checkIn": true, "checkOut": true, "produtos": true}'); 