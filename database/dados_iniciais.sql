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
INSERT INTO produtos (nome, descricao, preco, quantidade_estoque, quantidade_minima) VALUES
('Água Mineral', 'Garrafa 500ml', 5.00, 100, 20),
('Refrigerante', 'Lata 350ml', 8.00, 80, 15),
('Chocolate', 'Barra 90g', 12.00, 50, 10),
('Vinho', 'Garrafa 750ml', 89.90, 30, 5);

-- Inserir alguns consumos
INSERT INTO consumos (reserva_id, produto_id, quantidade, valor_unitario, valor_total) VALUES
(1, 1, 2, 5.00, 10.00),
(1, 3, 1, 12.00, 12.00),
(2, 4, 1, 89.90, 89.90); 