SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS auth_sessions (
  id VARCHAR(40) PRIMARY KEY,
  user_id VARCHAR(40) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_auth_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_auth_sessions_user (user_id),
  INDEX idx_auth_sessions_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

UPDATE users SET role='Administrador' WHERE role IN ('Admin','admin','Administrador');
UPDATE users SET role='Gestor de visitantes' WHERE role IN ('Recepcion','Recepción','Protocolo');

INSERT INTO users (id, name, role, email, password_hash, active)
SELECT 'u_admin', 'Administrador', 'Administrador', 'admin@costadelfaro.local', '$2y$10$FWNYH268t3RTNbZdyrZGlOrRFVJhpoNiD4yg2pSRRdfJYSdmdLogW', 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='admin@costadelfaro.local');

INSERT INTO users (id, name, role, email, password_hash, active)
SELECT 'u_eventos', 'Gestor Eventos', 'Gestor de eventos', 'eventos@costadelfaro.local', '$2y$10$FWNYH268t3RTNbZdyrZGlOrRFVJhpoNiD4yg2pSRRdfJYSdmdLogW', 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='eventos@costadelfaro.local');

INSERT INTO users (id, name, role, email, password_hash, active)
SELECT 'u_visitantes', 'Gestor Visitantes', 'Gestor de visitantes', 'visitantes@costadelfaro.local', '$2y$10$FWNYH268t3RTNbZdyrZGlOrRFVJhpoNiD4yg2pSRRdfJYSdmdLogW', 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email='visitantes@costadelfaro.local');

