USE hotel_paradise;

-- Inserir tipos de quarto
INSERT INTO tipos_quarto (nome, descricao, preco_diaria) VALUES
('Standard', 'Quarto confortável com cama de casal', 200.00),
('Luxo', 'Quarto espaçoso com vista para a cidade', 350.00),
('Suíte Master', 'Suíte completa com hidromassagem', 500.00);

-- Inserir quartos
INSERT INTO quartos (numero, tipo_id, status, andar) VALUES
('101', 1, 'disponivel', '1'),
('102', 1, 'ocupado', '1'),
('103', 1, 'disponivel', '1'),
('201', 2, 'ocupado', '2'),
('202', 2, 'manutencao', '2'),
('301', 3, 'disponivel', '3'),
('302', 3, 'ocupado', '3');

-- Inserir alguns clientes
INSERT INTO clientes (nome, email, telefone, cpf, cidade, estado) VALUES
('João Silva', 'joao@email.com', '(11) 98765-4321', '123.456.789-00', 'São Paulo', 'SP'),
('Maria Santos', 'maria@email.com', '(21) 98765-4321', '987.654.321-00', 'Rio de Janeiro', 'RJ'),
('Pedro Oliveira', 'pedro@email.com', '(31) 98765-4321', '456.789.123-00', 'Belo Horizonte', 'MG');

-- Inserir algumas reservas
INSERT INTO reservas (cliente_id, quarto_id, data_entrada, data_saida, status, valor_diaria, valor_total) VALUES
(1, 2, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'confirmada', 200.00, 600.00),
(2, 4, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'confirmada', 350.00, 1750.00),
(3, 7, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'confirmada', 500.00, 1000.00);

-- Inserir alguns produtos
INSERT INTO produtos (nome, categoria, descricao, preco, estoque, estoque_minimo) VALUES
('Água Mineral 500ml', 'bebidas', 'Água mineral sem gás', 5.00, 100, 20),
('Refrigerante Lata', 'bebidas', 'Refrigerante em lata 350ml', 8.00, 80, 15),
('Chocolate', 'alimentos', 'Barra de chocolate 90g', 12.00, 50, 10),
('Sabonete', 'higiene', 'Sabonete neutro', 4.50, 60, 12),
('Toalha de Rosto', 'outros', 'Toalha de rosto 100% algodão', 25.00, 30, 5),
('Vinho', 'bebidas', 'Garrafa 750ml', 89.90, 30, 5);

-- Inserir alguns consumos
INSERT INTO consumos (reserva_id, produto_id, quantidade, valor_unitario, valor_total) VALUES
(1, 1, 2, 5.00, 10.00),
(1, 3, 1, 12.00, 12.00),
(2, 4, 1, 89.90, 89.90);

-- Inserir usuário administrador padrão (senha: admin123)
INSERT INTO usuarios (nome, email, senha, cargo) VALUES
('Administrador', 'admin@hotelparadise.com', '$2a$10$n8qF0s6UHXyZJ3Y1.lO3/.3GxgJqB1RV0QwqbHsDxpihwL2ADvxVi', 'admin');

-- Inserir quartos
INSERT INTO quartos (numero, tipo, capacidade, preco_diaria, descricao) VALUES
('101', 'standard', 2, 150.00, 'Quarto Standard com duas camas de solteiro'),
('102', 'standard', 2, 150.00, 'Quarto Standard com cama de casal'),
('201', 'luxo', 2, 250.00, 'Quarto Luxo com vista para a cidade'),
('202', 'luxo', 3, 300.00, 'Quarto Luxo Família com três camas'),
('301', 'suite', 2, 400.00, 'Suite Master com hidromassagem'),
('302', 'suite', 4, 500.00, 'Suite Presidencial com sala de estar');

-- Inserir produtos
INSERT INTO produtos (nome, descricao, preco, categoria, quantidade_estoque) VALUES
('Água Mineral 500ml', 'Água mineral sem gás', 5.00, 'bebidas', 100),
('Refrigerante 350ml', 'Refrigerante em lata', 7.00, 'bebidas', 80),
('Chocolate', 'Barra de chocolate 90g', 8.00, 'alimentos', 50),
('Salgadinho', 'Pacote de salgadinho 90g', 7.50, 'alimentos', 40),
('Kit Dental', 'Escova e pasta de dente', 15.00, 'higiene', 30),
('Sabonete', 'Sabonete em barra 90g', 3.00, 'higiene', 100); 