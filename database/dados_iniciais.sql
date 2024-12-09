USE hotel_paradise;

-- Limpar dados existentes na ordem correta (respeitando as chaves estrangeiras)
DELETE FROM pagamentos;
DELETE FROM consumos;
DELETE FROM reservas;
DELETE FROM produtos;
DELETE FROM quartos;
DELETE FROM tipos_quarto;
DELETE FROM clientes;
DELETE FROM configuracoes;
DELETE FROM usuarios;
DELETE FROM cargos;

-- Inserir cargos
INSERT INTO cargos (id, nome, descricao) VALUES
(1, 'Administrador', 'Acesso total ao sistema'),
(2, 'Gerente', 'Gerenciamento de reservas e funcionários'),
(3, 'Recepcionista', 'Atendimento aos clientes e gestão de reservas');

-- Inserir usuário administrador padrão (senha: admin123)
INSERT INTO usuarios (nome, email, senha, cargo_id) VALUES
('Administrador', 'admin@hotelparadise.com', '$2b$10$A7IHvQ7QnX1B2mH2yGZJXOZ.Yw0ASrCk/0RiUk3ZVXsB8kOqfR5.q', 1);

-- Inserir tipos de quarto com IDs fixos
INSERT INTO tipos_quarto (id, nome, descricao, preco_diaria, capacidade) VALUES
(1, 'Standard', 'Quarto confortável com vista para a cidade', 200.00, 2),
(2, 'Superior', 'Quarto espaçoso com vista parcial para o mar', 300.00, 2),
(3, 'Luxo', 'Quarto luxuoso com vista panorâmica para o mar', 500.00, 2),
(4, 'Suíte Presidencial', 'Suíte exclusiva com serviços premium', 1000.00, 4);

-- Inserir quartos (usando os IDs fixos dos tipos)
INSERT INTO quartos (numero, tipo_id, status, andar) VALUES
('101', 1, 'disponivel', '1'),
('102', 1, 'disponivel', '1'),
('201', 2, 'disponivel', '2'),
('202', 2, 'disponivel', '2'),
('301', 3, 'disponivel', '3'),
('401', 4, 'disponivel', '4');

-- Inserir produtos
INSERT INTO produtos (nome, categoria, descricao, preco, estoque, estoque_minimo) VALUES
('Água Mineral 500ml', 'bebidas', 'Água mineral sem gás', 5.00, 100, 20),
('Refrigerante Lata', 'bebidas', 'Refrigerante em lata', 8.00, 80, 15),
('Cerveja Lata', 'bebidas', 'Cerveja em lata', 12.00, 60, 10),
('Vinho Tinto 750ml', 'bebidas', 'Vinho tinto seco', 89.90, 20, 5),
('Chocolate', 'alimentos', 'Barra de chocolate 90g', 7.00, 50, 10),
('Batata Chips', 'alimentos', 'Pacote de batata frita 90g', 9.90, 40, 8),
('Amendoim', 'alimentos', 'Pacote de amendoim 100g', 6.50, 30, 6),
('Sabonete', 'higiene', 'Sabonete em barra 90g', 3.50, 100, 20),
('Shampoo', 'higiene', 'Shampoo 250ml', 12.90, 50, 10),
('Escova de Dentes', 'higiene', 'Escova de dentes macia', 8.90, 30, 10),
('Adaptador de Tomada', 'outros', 'Adaptador universal', 15.90, 20, 5),
('Carregador Universal', 'outros', 'Carregador USB', 45.90, 15, 3);

-- Inserir configurações iniciais
INSERT INTO configuracoes (nome_hotel, endereco, telefone, email_contato, notificacoes) VALUES
('Hotel Paradise', 'Av. Beira Mar, 1000 - Centro', '(47) 3333-4444', 'contato@hotelparadise.com', 
'{"reservas":true,"checkIn":true,"checkOut":true,"produtos":true}'); 