#!/usr/bin/env python3
"""
Sistema de Gerenciamento de Banco de Dados Local (SQLite)
Fornece armazenamento offline completo com backup automático
"""
import sqlite3
import json
import os
import logging
import zipfile
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Caminhos do banco de dados
DB_DIR = "dados/database"
DB_FILE = os.path.join(DB_DIR, "bicicletario.db")
BACKUP_DIR = os.path.join(DB_DIR, "backups")


class DatabaseManager:
    """Gerenciador de banco de dados SQLite com suporte offline"""
    
    def __init__(self, db_path: str = DB_FILE):
        """Inicializa o gerenciador de banco de dados"""
        self.db_path = db_path
        self._ensure_directories()
        self._init_database()
    
    def _ensure_directories(self):
        """Cria os diretórios necessários"""
        try:
            os.makedirs(DB_DIR, exist_ok=True)
            os.makedirs(BACKUP_DIR, exist_ok=True)
            logger.info(f"Diretórios criados/verificados: {DB_DIR}")
        except Exception as e:
            logger.error(f"Erro ao criar diretórios: {e}")
    
    def _get_connection(self) -> sqlite3.Connection:
        """Retorna uma conexão com o banco de dados"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Permite acesso por nome de coluna
        return conn
    
    def _init_database(self):
        """Inicializa o banco de dados com as tabelas necessárias"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                # Tabela de clientes
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS clientes (
                        id TEXT PRIMARY KEY,
                        cpf TEXT UNIQUE NOT NULL,
                        nome TEXT NOT NULL,
                        telefone TEXT,
                        categoria TEXT,
                        comentarios TEXT,
                        ativo INTEGER DEFAULT 1,
                        data_cadastro TEXT NOT NULL,
                        criado_em TEXT NOT NULL,
                        atualizado_em TEXT NOT NULL
                    )
                """)
                
                # Tabela de bicicletas
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS bicicletas (
                        id TEXT PRIMARY KEY,
                        cliente_id TEXT NOT NULL,
                        descricao TEXT NOT NULL,
                        marca TEXT,
                        modelo TEXT,
                        cor TEXT,
                        aro TEXT,
                        ativa INTEGER DEFAULT 1,
                        criada_em TEXT NOT NULL,
                        atualizada_em TEXT NOT NULL,
                        FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE CASCADE
                    )
                """)
                
                # Tabela de registros de entrada/saída
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS registros (
                        id TEXT PRIMARY KEY,
                        cliente_id TEXT NOT NULL,
                        bicicleta_id TEXT NOT NULL,
                        data_hora_entrada TEXT NOT NULL,
                        data_hora_saida TEXT,
                        pernoite INTEGER DEFAULT 0,
                        acesso_removido INTEGER DEFAULT 0,
                        registro_original_id TEXT,
                        criado_por TEXT,
                        criado_em TEXT NOT NULL,
                        atualizado_em TEXT NOT NULL,
                        FOREIGN KEY (cliente_id) REFERENCES clientes (id),
                        FOREIGN KEY (bicicleta_id) REFERENCES bicicletas (id)
                    )
                """)
                
                # Tabela de usuários
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS usuarios (
                        id TEXT PRIMARY KEY,
                        username TEXT UNIQUE NOT NULL,
                        password_hash TEXT NOT NULL,
                        nome TEXT NOT NULL,
                        tipo TEXT NOT NULL,
                        ativo INTEGER DEFAULT 1,
                        permissoes TEXT,
                        criado_em TEXT NOT NULL,
                        atualizado_em TEXT NOT NULL
                    )
                """)
                
                # Tabela de auditoria
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS auditoria (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        usuario TEXT NOT NULL,
                        acao TEXT NOT NULL,
                        detalhes TEXT,
                        timestamp TEXT NOT NULL
                    )
                """)
                
                # Tabela de sincronização (para rastrear operações pendentes)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS sincronizacao_pendente (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        tipo TEXT NOT NULL,
                        operacao TEXT NOT NULL,
                        dados TEXT NOT NULL,
                        timestamp TEXT NOT NULL,
                        sincronizado INTEGER DEFAULT 0
                    )
                """)
                
                # Índices para melhor performance
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_bicicletas_cliente ON bicicletas(cliente_id)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_registros_cliente ON registros(cliente_id)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_registros_data ON registros(data_hora_entrada)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(usuario)")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_auditoria_timestamp ON auditoria(timestamp)")
                
                conn.commit()
                logger.info("Banco de dados inicializado com sucesso")
        except Exception as e:
            logger.error(f"Erro ao inicializar banco de dados: {e}", exc_info=True)
    
    # ==================== CLIENTES ====================
    
    def save_cliente(self, cliente: Dict[str, Any]) -> bool:
        """Salva ou atualiza um cliente"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                now = datetime.now().isoformat()
                
                # Verifica se cliente já existe
                cursor.execute("SELECT id FROM clientes WHERE id = ?", (cliente['id'],))
                exists = cursor.fetchone()
                
                if exists:
                    # Atualiza cliente existente
                    cursor.execute("""
                        UPDATE clientes SET
                            cpf = ?, nome = ?, telefone = ?, categoria = ?,
                            comentarios = ?, ativo = ?, atualizado_em = ?
                        WHERE id = ?
                    """, (
                        cliente['cpf'], cliente['nome'], cliente.get('telefone', ''),
                        cliente.get('categoria', ''), cliente.get('comentarios', ''),
                        1 if cliente.get('ativo', True) else 0, now, cliente['id']
                    ))
                else:
                    # Insere novo cliente
                    cursor.execute("""
                        INSERT INTO clientes (
                            id, cpf, nome, telefone, categoria, comentarios,
                            ativo, data_cadastro, criado_em, atualizado_em
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        cliente['id'], cliente['cpf'], cliente['nome'],
                        cliente.get('telefone', ''), cliente.get('categoria', ''),
                        cliente.get('comentarios', ''), 1 if cliente.get('ativo', True) else 0,
                        cliente.get('dataCadastro', now), now, now
                    ))
                
                conn.commit()
                logger.debug(f"Cliente salvo: {cliente['id']}")
                return True
        except Exception as e:
            logger.error(f"Erro ao salvar cliente: {e}", exc_info=True)
            return False
    
    def get_cliente(self, cliente_id: str) -> Optional[Dict[str, Any]]:
        """Retorna um cliente pelo ID"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM clientes WHERE id = ?", (cliente_id,))
                row = cursor.fetchone()
                
                if row:
                    cliente = dict(row)
                    cliente['ativo'] = bool(cliente['ativo'])
                    # Carrega bicicletas do cliente
                    cliente['bicicletas'] = self.get_bicicletas_cliente(cliente_id)
                    return cliente
                return None
        except Exception as e:
            logger.error(f"Erro ao buscar cliente: {e}", exc_info=True)
            return None
    
    def get_all_clientes(self) -> List[Dict[str, Any]]:
        """Retorna todos os clientes"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM clientes ORDER BY nome")
                rows = cursor.fetchall()
                
                clientes = []
                for row in rows:
                    cliente = dict(row)
                    cliente['ativo'] = bool(cliente['ativo'])
                    # Carrega bicicletas do cliente
                    cliente['bicicletas'] = self.get_bicicletas_cliente(cliente['id'])
                    clientes.append(cliente)
                
                return clientes
        except Exception as e:
            logger.error(f"Erro ao buscar clientes: {e}", exc_info=True)
            return []
    
    def delete_cliente(self, cliente_id: str) -> bool:
        """Deleta um cliente"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM clientes WHERE id = ?", (cliente_id,))
                conn.commit()
                logger.info(f"Cliente deletado: {cliente_id}")
                return True
        except Exception as e:
            logger.error(f"Erro ao deletar cliente: {e}", exc_info=True)
            return False
    
    # ==================== BICICLETAS ====================
    
    def save_bicicleta(self, bicicleta: Dict[str, Any]) -> bool:
        """Salva ou atualiza uma bicicleta"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                now = datetime.now().isoformat()
                
                cursor.execute("SELECT id FROM bicicletas WHERE id = ?", (bicicleta['id'],))
                exists = cursor.fetchone()
                
                if exists:
                    cursor.execute("""
                        UPDATE bicicletas SET
                            cliente_id = ?, descricao = ?, marca = ?, modelo = ?,
                            cor = ?, aro = ?, ativa = ?, atualizada_em = ?
                        WHERE id = ?
                    """, (
                        bicicleta['clienteId'], bicicleta['descricao'],
                        bicicleta.get('marca', ''), bicicleta.get('modelo', ''),
                        bicicleta.get('cor', ''), bicicleta.get('aro', ''),
                        1 if bicicleta.get('ativa', True) else 0, now, bicicleta['id']
                    ))
                else:
                    cursor.execute("""
                        INSERT INTO bicicletas (
                            id, cliente_id, descricao, marca, modelo,
                            cor, aro, ativa, criada_em, atualizada_em
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        bicicleta['id'], bicicleta['clienteId'], bicicleta['descricao'],
                        bicicleta.get('marca', ''), bicicleta.get('modelo', ''),
                        bicicleta.get('cor', ''), bicicleta.get('aro', ''),
                        1 if bicicleta.get('ativa', True) else 0, now, now
                    ))
                
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Erro ao salvar bicicleta: {e}", exc_info=True)
            return False
    
    def get_bicicletas_cliente(self, cliente_id: str) -> List[Dict[str, Any]]:
        """Retorna todas as bicicletas de um cliente"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT * FROM bicicletas WHERE cliente_id = ? ORDER BY descricao",
                    (cliente_id,)
                )
                rows = cursor.fetchall()
                
                bicicletas = []
                for row in rows:
                    bicicleta = dict(row)
                    bicicleta['clienteId'] = bicicleta.pop('cliente_id')
                    bicicleta['ativa'] = bool(bicicleta['ativa'])
                    bicicletas.append(bicicleta)
                
                return bicicletas
        except Exception as e:
            logger.error(f"Erro ao buscar bicicletas: {e}", exc_info=True)
            return []
    
    # ==================== REGISTROS ====================
    
    def save_registro(self, registro: Dict[str, Any]) -> bool:
        """Salva ou atualiza um registro"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                now = datetime.now().isoformat()
                
                cursor.execute("SELECT id FROM registros WHERE id = ?", (registro['id'],))
                exists = cursor.fetchone()
                
                if exists:
                    cursor.execute("""
                        UPDATE registros SET
                            cliente_id = ?, bicicleta_id = ?, data_hora_entrada = ?,
                            data_hora_saida = ?, pernoite = ?, acesso_removido = ?,
                            registro_original_id = ?, criado_por = ?, atualizado_em = ?
                        WHERE id = ?
                    """, (
                        registro['clienteId'], registro['bicicletaId'],
                        registro['dataHoraEntrada'], registro.get('dataHoraSaida'),
                        1 if registro.get('pernoite', False) else 0,
                        1 if registro.get('acessoRemovido', False) else 0,
                        registro.get('registroOriginalId'), registro.get('criadoPor'),
                        now, registro['id']
                    ))
                else:
                    cursor.execute("""
                        INSERT INTO registros (
                            id, cliente_id, bicicleta_id, data_hora_entrada,
                            data_hora_saida, pernoite, acesso_removido,
                            registro_original_id, criado_por, criado_em, atualizado_em
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        registro['id'], registro['clienteId'], registro['bicicletaId'],
                        registro['dataHoraEntrada'], registro.get('dataHoraSaida'),
                        1 if registro.get('pernoite', False) else 0,
                        1 if registro.get('acessoRemovido', False) else 0,
                        registro.get('registroOriginalId'), registro.get('criadoPor'),
                        now, now
                    ))
                
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Erro ao salvar registro: {e}", exc_info=True)
            return False
    
    def get_all_registros(self) -> List[Dict[str, Any]]:
        """Retorna todos os registros"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT r.*, c.nome as cliente_nome, c.cpf as cliente_cpf
                    FROM registros r
                    LEFT JOIN clientes c ON r.cliente_id = c.id
                    ORDER BY r.data_hora_entrada DESC
                """)
                rows = cursor.fetchall()
                
                registros = []
                for row in rows:
                    registro = dict(row)
                    registro['clienteId'] = registro.pop('cliente_id')
                    registro['bicicletaId'] = registro.pop('bicicleta_id')
                    registro['dataHoraEntrada'] = registro.pop('data_hora_entrada')
                    registro['dataHoraSaida'] = registro.pop('data_hora_saida')
                    registro['pernoite'] = bool(registro['pernoite'])
                    registro['acessoRemovido'] = bool(registro.pop('acesso_removido'))
                    registro['registroOriginalId'] = registro.pop('registro_original_id')
                    registro['criadoPor'] = registro.pop('criado_por')
                    registros.append(registro)
                
                return registros
        except Exception as e:
            logger.error(f"Erro ao buscar registros: {e}", exc_info=True)
            return []
    
    # ==================== AUDITORIA ====================
    
    def log_audit(self, usuario: str, acao: str, detalhes: str = None) -> bool:
        """Registra uma ação de auditoria"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO auditoria (usuario, acao, detalhes, timestamp)
                    VALUES (?, ?, ?, ?)
                """, (usuario, acao, detalhes, datetime.now().isoformat()))
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Erro ao registrar auditoria: {e}", exc_info=True)
            return False
    
    def get_audit_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Retorna logs de auditoria"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM auditoria
                    ORDER BY timestamp DESC
                    LIMIT ?
                """, (limit,))
                rows = cursor.fetchall()
                return [dict(row) for row in rows]
        except Exception as e:
            logger.error(f"Erro ao buscar logs de auditoria: {e}", exc_info=True)
            return []
    
    # ==================== BACKUP ====================
    
    def create_backup(self, format: str = 'zip') -> Optional[str]:
        """Cria um backup do banco de dados"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            if format == 'zip':
                backup_file = os.path.join(BACKUP_DIR, f"backup_{timestamp}.zip")
                with zipfile.ZipFile(backup_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
                    zipf.write(self.db_path, os.path.basename(self.db_path))
                    
                    # Adiciona um arquivo JSON com metadados
                    metadata = {
                        'timestamp': timestamp,
                        'database': os.path.basename(self.db_path),
                        'version': '1.0'
                    }
                    zipf.writestr('metadata.json', json.dumps(metadata, indent=2))
                
                logger.info(f"Backup criado: {backup_file}")
                return backup_file
            
            elif format == 'json':
                backup_file = os.path.join(BACKUP_DIR, f"backup_{timestamp}.json")
                
                # Exporta todos os dados para JSON
                backup_data = {
                    'timestamp': timestamp,
                    'clientes': self.get_all_clientes(),
                    'registros': self.get_all_registros(),
                    'audit_logs': self.get_audit_logs(1000)
                }
                
                with open(backup_file, 'w', encoding='utf-8') as f:
                    json.dump(backup_data, f, ensure_ascii=False, indent=2)
                
                logger.info(f"Backup JSON criado: {backup_file}")
                return backup_file
            
            else:
                logger.error(f"Formato de backup não suportado: {format}")
                return None
                
        except Exception as e:
            logger.error(f"Erro ao criar backup: {e}", exc_info=True)
            return None
    
    def restore_backup(self, backup_file: str) -> bool:
        """Restaura um backup"""
        try:
            if backup_file.endswith('.zip'):
                with zipfile.ZipFile(backup_file, 'r') as zipf:
                    zipf.extractall(DB_DIR)
                logger.info(f"Backup restaurado: {backup_file}")
                return True
            
            elif backup_file.endswith('.json'):
                with open(backup_file, 'r', encoding='utf-8') as f:
                    backup_data = json.load(f)
                
                # Restaura clientes
                for cliente in backup_data.get('clientes', []):
                    self.save_cliente(cliente)
                
                # Restaura registros
                for registro in backup_data.get('registros', []):
                    self.save_registro(registro)
                
                logger.info(f"Backup JSON restaurado: {backup_file}")
                return True
            
            else:
                logger.error(f"Formato de backup não suportado: {backup_file}")
                return False
                
        except Exception as e:
            logger.error(f"Erro ao restaurar backup: {e}", exc_info=True)
            return False
    
    # ==================== SINCRONIZAÇÃO ====================
    
    def add_pending_sync(self, tipo: str, operacao: str, dados: Dict[str, Any]) -> bool:
        """Adiciona uma operação à fila de sincronização"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO sincronizacao_pendente (tipo, operacao, dados, timestamp)
                    VALUES (?, ?, ?, ?)
                """, (tipo, operacao, json.dumps(dados), datetime.now().isoformat()))
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Erro ao adicionar operação pendente: {e}", exc_info=True)
            return False
    
    def get_pending_syncs(self) -> List[Dict[str, Any]]:
        """Retorna operações pendentes de sincronização"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM sincronizacao_pendente
                    WHERE sincronizado = 0
                    ORDER BY timestamp
                """)
                rows = cursor.fetchall()
                
                syncs = []
                for row in rows:
                    sync = dict(row)
                    sync['dados'] = json.loads(sync['dados'])
                    syncs.append(sync)
                
                return syncs
        except Exception as e:
            logger.error(f"Erro ao buscar operações pendentes: {e}", exc_info=True)
            return []
    
    def mark_sync_complete(self, sync_id: int) -> bool:
        """Marca uma operação de sincronização como completa"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    UPDATE sincronizacao_pendente
                    SET sincronizado = 1
                    WHERE id = ?
                """, (sync_id,))
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Erro ao marcar sincronização como completa: {e}", exc_info=True)
            return False


# Singleton instance
_db_manager = None

def get_db_manager() -> DatabaseManager:
    """Retorna a instância singleton do DatabaseManager"""
    global _db_manager
    if _db_manager is None:
        _db_manager = DatabaseManager()
    return _db_manager


if __name__ == '__main__':
    # Teste básico
    db = get_db_manager()
    print("✅ Banco de dados inicializado com sucesso")
    
    # Cria backup de teste
    backup_file = db.create_backup('json')
    if backup_file:
        print(f"✅ Backup criado: {backup_file}")
