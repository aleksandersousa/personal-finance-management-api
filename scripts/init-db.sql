-- Arquivo de inicialização do banco de dados
-- Este script é executado automaticamente pelo Docker

CREATE SCHEMA IF NOT EXISTS financial;

SET search_path TO financial, public;

SET search_path TO public;

-- Criar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar extensão para funções de criptografia
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

SET search_path TO financial, public;

-- Configurações de timezone
SET timezone = 'UTC';

-- Criação manual das tabelas (caso o TypeORM não sincronize automaticamente)

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    password VARCHAR,
    avatar_url VARCHAR,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    type VARCHAR NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabela de entradas financeiras
CREATE TABLE IF NOT EXISTS entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    description VARCHAR NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    date TIMESTAMP NOT NULL,
    type VARCHAR NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    is_fixed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
CREATE INDEX IF NOT EXISTS idx_entries_type ON entries(type);
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entries_updated_at ON entries;
CREATE TRIGGER update_entries_updated_at 
    BEFORE UPDATE ON entries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Dados de exemplo para desenvolvimento (opcional)
-- Inserir usuário de teste
INSERT INTO users (id, name, email, password) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Test User', 'test@example.com', '$2a$10$example.hash')
ON CONFLICT (email) DO NOTHING;

-- Inserir categorias de exemplo (aguardar a aplicação criar as tabelas primeiro)
-- INSERT INTO categories (id, name, type, user_id) VALUES
-- ('550e8400-e29b-41d4-a716-446655440001', 'Salário', 'INCOME', '550e8400-e29b-41d4-a716-446655440000'),
-- ('550e8400-e29b-41d4-a716-446655440002', 'Freelance', 'INCOME', '550e8400-e29b-41d4-a716-446655440000'),
-- ('550e8400-e29b-41d4-a716-446655440003', 'Alimentação', 'EXPENSE', '550e8400-e29b-41d4-a716-446655440000'),
-- ('550e8400-e29b-41d4-a716-446655440004', 'Transporte', 'EXPENSE', '550e8400-e29b-41d4-a716-446655440000')
-- ON CONFLICT (id) DO NOTHING; 