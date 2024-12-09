-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS hotel_paradise;
USE hotel_paradise;

-- Removendo tabelas existentes na ordem correta
DROP TABLE IF EXISTS pagamentos;
DROP TABLE IF EXISTS consumos;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS reservas;
DROP TABLE IF EXISTS quartos;
DROP TABLE IF EXISTS tipos_quarto;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS tokens_recuperacao;
DROP TABLE IF EXISTS logs_acesso;
DROP TABLE IF EXISTS funcionarios;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS cargos;

-- Tabela de cargos
CREATE TABLE IF NOT EXISTS cargos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    cargo_id INT,
    google_id VARCHAR(100),
    ativo BOOLEAN DEFAULT true,
    ultimo_acesso TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cargo_id) REFERENCES cargos(id)
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telefone VARCHAR(20),
    cpf VARCHAR(14) UNIQUE,
    data_nascimento DATE,
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(9),
    profissao VARCHAR(100),
    motivo_visita TEXT,
    origem VARCHAR(100),
    observacoes TEXT,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ultima_hospedagem TIMESTAMP NULL,
    total_hospedagens INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de tipos de quarto
CREATE TABLE IF NOT EXISTS tipos_quarto (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL,
    descricao TEXT,
    preco_diaria DECIMAL(10,2) NOT NULL,
    capacidade INT NOT NULL DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de quartos
CREATE TABLE IF NOT EXISTS quartos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero VARCHAR(10) NOT NULL UNIQUE,
    tipo_id INT NOT NULL,
    status ENUM('disponivel', 'ocupado', 'manutencao') DEFAULT 'disponivel',
    andar VARCHAR(10),
    ultima_limpeza TIMESTAMP NULL,
    ultima_manutencao TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_id) REFERENCES tipos_quarto(id)
);

-- Tabela de reservas
CREATE TABLE IF NOT EXISTS reservas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cliente_id INT NOT NULL,
    quarto_id INT NOT NULL,
    data_entrada DATE NOT NULL,
    data_saida DATE NOT NULL,
    status ENUM('pendente', 'confirmada', 'checkin', 'checkout', 'cancelada') DEFAULT 'pendente',
    valor_diaria DECIMAL(10,2) NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    data_checkin TIMESTAMP NULL,
    data_checkout TIMESTAMP NULL,
    data_cancelamento TIMESTAMP NULL,
    motivo_cancelamento TEXT,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (quarto_id) REFERENCES quartos(id)
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('bebidas', 'alimentos', 'higiene', 'outros')),
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    estoque INT DEFAULT 0,
    estoque_minimo INT DEFAULT 5,
    ultima_reposicao TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de consumos
CREATE TABLE IF NOT EXISTS consumos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reserva_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    data_consumo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reserva_id) REFERENCES reservas(id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

-- Tabela de configurações
CREATE TABLE IF NOT EXISTS configuracoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome_hotel VARCHAR(100) NOT NULL,
    endereco TEXT,
    telefone VARCHAR(20),
    email_contato VARCHAR(100),
    notificacoes JSON,
    ultimo_backup TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reserva_id INT NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    forma_pagamento ENUM('credito', 'debito', 'dinheiro', 'pix') NOT NULL,
    parcelas INT DEFAULT 1,
    status ENUM('pendente', 'aprovado', 'recusado', 'estornado') DEFAULT 'pendente',
    data_aprovacao TIMESTAMP NULL,
    observacoes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reserva_id) REFERENCES reservas(id)
);

-- Inserção de dados iniciais
INSERT INTO cargos (nome, descricao) VALUES
('Administrador', 'Acesso total ao sistema'),
('Gerente', 'Gerenciamento de reservas e funcionários'),
('Recepcionista', 'Atendimento aos clientes e gestão de reservas');

-- Inserir um usuário administrador padrão (senha: admin123)
INSERT INTO usuarios (nome, email, senha, cargo_id) VALUES
('Administrador', 'admin@hotelparadise.com', '$2a$10$n8qF0s6UHXyZJ3Y1.lO3/.3GxgJqB1RV0QwqbHsDxpihwL2ADvxVi', 1); 