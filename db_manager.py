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
                
                # Tabela de configurações do sistema
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS configuracoes (
                        chave TEXT PRIMARY KEY,
                        valor TEXT NOT NULL,
                        atualizado_em TEXT NOT NULL
                    )
                """)
                
                # Tabela de categorias
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS categorias (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        nome TEXT UNIQUE NOT NULL,
                        emoji TEXT NOT NULL,
                        criada_em TEXT NOT NULL,
                        atualizada_em TEXT NOT NULL
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
                
                # Extrai bicicletas do cliente para salvar separadamente
                bicicletas = cliente.pop('bicicletas', []) if isinstance(cliente.get('bicicletas'), list) else []
                
                # Garante que comentarios seja string
                comentarios = cliente.get('comentarios', '')
                if isinstance(comentarios, list):
                    comentarios = json.dumps(comentarios)
                elif not isinstance(comentarios, str):
                    comentarios = str(comentarios) if comentarios else ''
                
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
                        cliente.get('categoria', ''), comentarios,
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
                        comentarios, 1 if cliente.get('ativo', True) else 0,
                        cliente.get('dataCadastro', now), now, now
                    ))
                
                conn.commit()
                logger.debug(f"Cliente salvo: {cliente['id']}")
                
                # Salva as bicicletas separadamente
                for bike in bicicletas:
                    if isinstance(bike, dict) and bike.get('id'):
                        bike_data = {
                            'id': bike['id'],
                            'clienteId': cliente['id'],
                            'descricao': f"{bike.get('marca', '')} {bike.get('modelo', '')}".strip(),
                            'marca': bike.get('marca', ''),
                            'modelo': bike.get('modelo', ''),
                            'cor': bike.get('cor', ''),
                            'aro': bike.get('aro', ''),
                            'ativa': bike.get('ativa', True)
                        }
                        self.save_bicicleta(bike_data)
                
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
    
    def get_all_bicicletas(self) -> List[Dict[str, Any]]:
        """Retorna todas as bicicletas do banco"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM bicicletas ORDER BY cliente_id, descricao")
                rows = cursor.fetchall()
                
                bicicletas = []
                for row in rows:
                    bicicleta = dict(row)
                    bicicleta['clienteId'] = bicicleta.pop('cliente_id')
                    bicicleta['ativa'] = bool(bicicleta['ativa'])
                    bicicletas.append(bicicleta)
                
                return bicicletas
        except Exception as e:
            logger.error(f"Erro ao buscar todas bicicletas: {e}", exc_info=True)
            return []
    
    # ==================== REGISTROS ====================
    
    def save_registro(self, registro: Dict[str, Any]) -> bool:
        """Salva ou atualiza um registro"""
        try:
            # Normaliza campos: frontend usa clientId/bikeId, banco usa clienteId/bicicletaId
            if 'clientId' in registro and 'clienteId' not in registro:
                registro['clienteId'] = registro['clientId']
            if 'bikeId' in registro and 'bicicletaId' not in registro:
                registro['bicicletaId'] = registro['bikeId']
            
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
    
    def log_audit(self, usuario: str, acao: str, detalhes: Optional[str] = None) -> bool:
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
    
    # ==================== CATEGORIAS ====================
    
    def save_categorias(self, categorias: Dict[str, str]) -> bool:
        """Salva todas as categorias (substitui as existentes)"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                now = datetime.now().isoformat()
                
                # Remove todas as categorias existentes
                cursor.execute("DELETE FROM categorias")
                
                # Insere as novas categorias
                for nome, emoji in categorias.items():
                    cursor.execute("""
                        INSERT INTO categorias (nome, emoji, criada_em, atualizada_em)
                        VALUES (?, ?, ?, ?)
                    """, (nome, emoji, now, now))
                
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Erro ao salvar categorias: {e}", exc_info=True)
            return False
    
    def get_all_categorias(self) -> Dict[str, str]:
        """Retorna todas as categorias como dicionário {nome: emoji}"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT nome, emoji FROM categorias")
                rows = cursor.fetchall()
                return {row['nome']: row['emoji'] for row in rows}
        except Exception as e:
            logger.error(f"Erro ao buscar categorias: {e}", exc_info=True)
            return {}
    
    def delete_registro(self, registro_id: str) -> bool:
        """Deleta um registro pelo ID"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM registros WHERE id = ?", (registro_id,))
                conn.commit()
                return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"Erro ao deletar registro: {e}", exc_info=True)
            return False
    
    # ==================== LIMPAR TODOS OS DADOS ====================
    
    def clear_all_clientes(self) -> Dict[str, Any]:
        """Limpa todos os clientes e suas bicicletas"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) as count FROM clientes")
                count = cursor.fetchone()['count']
                cursor.execute("DELETE FROM bicicletas")
                cursor.execute("DELETE FROM clientes")
                conn.commit()
                logger.info(f"Todos os {count} clientes foram removidos")
                return {'success': True, 'deleted': count}
        except Exception as e:
            logger.error(f"Erro ao limpar clientes: {e}", exc_info=True)
            return {'success': False, 'error': str(e)}
    
    def clear_all_registros(self) -> Dict[str, Any]:
        """Limpa todos os registros de entrada/saída"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) as count FROM registros")
                count = cursor.fetchone()['count']
                cursor.execute("DELETE FROM registros")
                conn.commit()
                logger.info(f"Todos os {count} registros foram removidos")
                return {'success': True, 'deleted': count}
        except Exception as e:
            logger.error(f"Erro ao limpar registros: {e}", exc_info=True)
            return {'success': False, 'error': str(e)}
    
    def clear_all_bicicletas(self) -> Dict[str, Any]:
        """Limpa todas as bicicletas"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) as count FROM bicicletas")
                count = cursor.fetchone()['count']
                cursor.execute("DELETE FROM bicicletas")
                conn.commit()
                logger.info(f"Todas as {count} bicicletas foram removidas")
                return {'success': True, 'deleted': count}
        except Exception as e:
            logger.error(f"Erro ao limpar bicicletas: {e}", exc_info=True)
            return {'success': False, 'error': str(e)}
    
    def clear_all_categorias(self) -> Dict[str, Any]:
        """Limpa todas as categorias"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) as count FROM categorias")
                count = cursor.fetchone()['count']
                cursor.execute("DELETE FROM categorias")
                conn.commit()
                logger.info(f"Todas as {count} categorias foram removidas")
                return {'success': True, 'deleted': count}
        except Exception as e:
            logger.error(f"Erro ao limpar categorias: {e}", exc_info=True)
            return {'success': False, 'error': str(e)}
    
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
    
    # ==================== CONFIGURAÇÕES ====================
    
    def get_config(self, chave: str, default: Optional[str] = None) -> Optional[str]:
        """Obtém uma configuração do sistema"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT valor FROM configuracoes WHERE chave = ?", (chave,))
                row = cursor.fetchone()
                return row['valor'] if row else default
        except Exception as e:
            logger.error(f"Erro ao obter configuração: {e}", exc_info=True)
            return default
    
    def set_config(self, chave: str, valor: str) -> bool:
        """Define uma configuração do sistema"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                now = datetime.now().isoformat()
                cursor.execute("""
                    INSERT OR REPLACE INTO configuracoes (chave, valor, atualizado_em)
                    VALUES (?, ?, ?)
                """, (chave, valor, now))
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Erro ao definir configuração: {e}", exc_info=True)
            return False
    
    def get_storage_mode(self) -> str:
        """Retorna o modo de armazenamento atual"""
        return self.get_config('storage_mode', 'sqlite') or 'sqlite'
    
    def set_storage_mode(self, mode: str) -> bool:
        """Define o modo de armazenamento (sqlite ou json)"""
        if mode not in ('sqlite', 'json'):
            return False
        return self.set_config('storage_mode', mode)
    
    def get_storage_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas de armazenamento para ambos os modos"""
        stats = {
            'current_mode': self.get_storage_mode(),
            'sqlite': {'clientes': 0, 'bicicletas': 0, 'registros': 0, 'categorias': 0},
            'json': {'clientes': 0, 'bicicletas': 0, 'registros': 0},
            'last_migration': self.get_config('last_migration_date'),
            'migration_status': self.get_config('migration_status', 'idle')
        }
        
        # Estatísticas SQLite
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) as count FROM clientes")
                stats['sqlite']['clientes'] = cursor.fetchone()['count']
                cursor.execute("SELECT COUNT(*) as count FROM bicicletas")
                stats['sqlite']['bicicletas'] = cursor.fetchone()['count']
                cursor.execute("SELECT COUNT(*) as count FROM registros")
                stats['sqlite']['registros'] = cursor.fetchone()['count']
                cursor.execute("SELECT COUNT(*) as count FROM categorias")
                stats['sqlite']['categorias'] = cursor.fetchone()['count']
        except Exception as e:
            logger.error(f"Erro ao obter estatísticas SQLite: {e}")
        
        # Estatísticas JSON
        try:
            json_clients_dir = "dados/navegador/clientes"
            bicicletas_count = 0
            if os.path.exists(json_clients_dir):
                client_files = [f for f in os.listdir(json_clients_dir) if f.endswith('.json')]
                stats['json']['clientes'] = len(client_files)
                
                for filename in client_files:
                    try:
                        filepath = os.path.join(json_clients_dir, filename)
                        with open(filepath, 'r', encoding='utf-8') as f:
                            client_data = json.load(f)
                            if 'bicicletas' in client_data and isinstance(client_data['bicicletas'], list):
                                bicicletas_count += len(client_data['bicicletas'])
                    except:
                        pass
            
            stats['json']['bicicletas'] = bicicletas_count
            
            json_registros_dir = "dados/navegador/registros"
            if os.path.exists(json_registros_dir):
                count = 0
                for year in os.listdir(json_registros_dir):
                    year_path = os.path.join(json_registros_dir, year)
                    if os.path.isdir(year_path):
                        for month in os.listdir(year_path):
                            month_path = os.path.join(year_path, month)
                            if os.path.isdir(month_path):
                                for day in os.listdir(month_path):
                                    day_path = os.path.join(month_path, day)
                                    if os.path.isdir(day_path):
                                        count += len([f for f in os.listdir(day_path) if f.endswith('.json')])
                stats['json']['registros'] = count
        except Exception as e:
            logger.error(f"Erro ao obter estatísticas JSON: {e}")
        
        return stats
    
    # ==================== MIGRAÇÃO DE DADOS ====================
    
    def migrate_json_to_sqlite(self) -> Dict[str, Any]:
        """Migra dados de arquivos JSON para SQLite"""
        result = {'success': False, 'migrated': {'clientes': 0, 'bicicletas': 0, 'registros': 0}, 'errors': []}
        
        try:
            self.set_config('migration_status', 'running')
            
            # Cria backup antes da migração
            self.create_backup('json')
            
            # Migra clientes (inclui bicicletas embutidas)
            json_clients_dir = "dados/navegador/clientes"
            if os.path.exists(json_clients_dir):
                for filename in os.listdir(json_clients_dir):
                    if filename.endswith('.json'):
                        try:
                            filepath = os.path.join(json_clients_dir, filename)
                            with open(filepath, 'r', encoding='utf-8') as f:
                                client = json.load(f)
                            if self.save_cliente(client):
                                result['migrated']['clientes'] += 1
                                # Conta bicicletas embutidas no cliente
                                result['migrated']['bicicletas'] += len(client.get('bicicletas', []))
                        except Exception as e:
                            result['errors'].append(f"Cliente {filename}: {str(e)}")
            
            # Migra registros
            json_registros_dir = "dados/navegador/registros"
            if os.path.exists(json_registros_dir):
                for year in os.listdir(json_registros_dir):
                    year_path = os.path.join(json_registros_dir, year)
                    if not os.path.isdir(year_path):
                        continue
                    for month in os.listdir(year_path):
                        month_path = os.path.join(year_path, month)
                        if not os.path.isdir(month_path):
                            continue
                        for day in os.listdir(month_path):
                            day_path = os.path.join(month_path, day)
                            if not os.path.isdir(day_path):
                                continue
                            for filename in os.listdir(day_path):
                                if filename.endswith('.json'):
                                    try:
                                        filepath = os.path.join(day_path, filename)
                                        with open(filepath, 'r', encoding='utf-8') as f:
                                            registro = json.load(f)
                                        if self.save_registro(registro):
                                            result['migrated']['registros'] += 1
                                    except Exception as e:
                                        result['errors'].append(f"Registro {filename}: {str(e)}")
            
            result['success'] = len(result['errors']) == 0
            self.set_config('migration_status', 'completed' if result['success'] else 'completed_with_errors')
            self.set_config('last_migration_date', datetime.now().isoformat())
            self.set_config('last_migration_direction', 'json_to_sqlite')
            
        except Exception as e:
            logger.error(f"Erro na migração JSON→SQLite: {e}", exc_info=True)
            result['errors'].append(str(e))
            self.set_config('migration_status', 'failed')
        
        return result
    
    def migrate_sqlite_to_json(self) -> Dict[str, Any]:
        """Migra dados de SQLite para arquivos JSON"""
        result = {'success': False, 'migrated': {'clientes': 0, 'bicicletas': 0, 'registros': 0}, 'errors': []}
        
        try:
            self.set_config('migration_status', 'running')
            
            # Cria backup antes da migração
            self.create_backup('json')
            
            json_clients_dir = "dados/navegador/clientes"
            json_bicicletas_dir = "dados/navegador/bicicletas"
            json_registros_dir = "dados/navegador/registros"
            os.makedirs(json_clients_dir, exist_ok=True)
            os.makedirs(json_bicicletas_dir, exist_ok=True)
            os.makedirs(json_registros_dir, exist_ok=True)
            
            # Exporta clientes (já incluem bicicletas no objeto)
            clientes = self.get_all_clientes()
            for cliente in clientes:
                try:
                    filename = f"{cliente['cpf'].replace('.', '').replace('-', '')}.json"
                    filepath = os.path.join(json_clients_dir, filename)
                    with open(filepath, 'w', encoding='utf-8') as f:
                        json.dump(cliente, f, ensure_ascii=False, indent=2)
                    result['migrated']['clientes'] += 1
                    # Conta bicicletas embutidas no cliente
                    result['migrated']['bicicletas'] += len(cliente.get('bicicletas', []))
                except Exception as e:
                    result['errors'].append(f"Cliente {cliente.get('cpf', 'unknown')}: {str(e)}")
            
            # Exporta registros
            registros = self.get_all_registros()
            for registro in registros:
                try:
                    dt = datetime.fromisoformat(registro['dataHoraEntrada'].replace('Z', '+00:00'))
                    year = str(dt.year)
                    month = str(dt.month).zfill(2)
                    day = str(dt.day).zfill(2)
                    
                    day_dir = os.path.join(json_registros_dir, year, month, day)
                    os.makedirs(day_dir, exist_ok=True)
                    
                    filename = f"{registro['id']}.json"
                    filepath = os.path.join(day_dir, filename)
                    with open(filepath, 'w', encoding='utf-8') as f:
                        json.dump(registro, f, ensure_ascii=False, indent=2)
                    result['migrated']['registros'] += 1
                except Exception as e:
                    result['errors'].append(f"Registro {registro.get('id', 'unknown')}: {str(e)}")
            
            result['success'] = len(result['errors']) == 0
            self.set_config('migration_status', 'completed' if result['success'] else 'completed_with_errors')
            self.set_config('last_migration_date', datetime.now().isoformat())
            self.set_config('last_migration_direction', 'sqlite_to_json')
            
        except Exception as e:
            logger.error(f"Erro na migração SQLite→JSON: {e}", exc_info=True)
            result['errors'].append(str(e))
            self.set_config('migration_status', 'failed')
        
        return result
    
    # ==================== BACKUP COMPLETO ====================
    
    def list_backups(self) -> List[Dict[str, Any]]:
        """Lista todos os arquivos de backup disponíveis"""
        try:
            backups = []
            if os.path.exists(BACKUP_DIR):
                for filename in os.listdir(BACKUP_DIR):
                    if filename.endswith('.json') and filename.startswith('backup_'):
                        filepath = os.path.join(BACKUP_DIR, filename)
                        stat = os.stat(filepath)
                        
                        # Extrai data do nome do arquivo (backup_YYYYMMDD_HHMMSS.json)
                        try:
                            date_str = filename.replace('backup_', '').replace('.json', '')
                            dt = datetime.strptime(date_str, '%Y%m%d_%H%M%S')
                            created_at = dt.isoformat()
                        except:
                            created_at = datetime.fromtimestamp(stat.st_mtime).isoformat()
                        
                        backups.append({
                            'filename': filename,
                            'filepath': filepath,
                            'size': stat.st_size,
                            'size_formatted': self._format_size(stat.st_size),
                            'created_at': created_at,
                            'type': 'json'
                        })
            
            # Ordena por data de criação (mais recente primeiro)
            backups.sort(key=lambda x: x['created_at'], reverse=True)
            return backups
        except Exception as e:
            logger.error(f"Erro ao listar backups: {e}", exc_info=True)
            return []
    
    def _format_size(self, size_bytes: int) -> str:
        """Formata tamanho de arquivo em formato legível"""
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.1f} KB"
        else:
            return f"{size_bytes / (1024 * 1024):.1f} MB"
    
    def create_full_backup(self) -> Optional[Dict[str, Any]]:
        """Cria um backup completo do sistema e retorna os dados do backup"""
        try:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_filename = f"backup_{timestamp}.json"
            backup_filepath = os.path.join(BACKUP_DIR, backup_filename)
            
            # Coleta todos os dados do sistema
            clientes = self.get_all_clientes()
            registros = self.get_all_registros()
            categorias = self.get_all_categorias()
            usuarios = self.get_all_usuarios()
            
            # Estrutura do backup
            backup_data = {
                'version': '1.0',
                'created_at': datetime.now().isoformat(),
                'system': 'bicicletario',
                'data': {
                    'clientes': clientes,
                    'registros': registros,
                    'categorias': categorias,
                    'usuarios': usuarios
                },
                'stats': {
                    'clientes': len(clientes),
                    'registros': len(registros),
                    'categorias': len(categorias),
                    'usuarios': len(usuarios)
                }
            }
            
            # Salva o arquivo de backup
            os.makedirs(BACKUP_DIR, exist_ok=True)
            with open(backup_filepath, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Backup completo criado: {backup_filename}")
            
            # Limpar backups antigos conforme configuração
            self._cleanup_old_backups()
            
            return {
                'success': True,
                'filename': backup_filename,
                'filepath': backup_filepath,
                'size': os.path.getsize(backup_filepath),
                'created_at': backup_data['created_at'],
                'stats': backup_data['stats']
            }
        except Exception as e:
            logger.error(f"Erro ao criar backup completo: {e}", exc_info=True)
            return None
    
    def get_backup_content(self, filename: str) -> Optional[Dict[str, Any]]:
        """Retorna o conteúdo de um arquivo de backup"""
        try:
            filepath = os.path.join(BACKUP_DIR, filename)
            if not os.path.exists(filepath):
                return None
            
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Erro ao ler backup {filename}: {e}", exc_info=True)
            return None
    
    def restore_from_backup(self, backup_data: Dict[str, Any]) -> Dict[str, Any]:
        """Restaura dados de um backup"""
        result = {'success': False, 'restored': {'clientes': 0, 'registros': 0, 'categorias': 0, 'usuarios': 0}, 'errors': []}
        
        try:
            # Validar estrutura do backup
            if 'data' not in backup_data:
                result['errors'].append('Estrutura de backup inválida: campo "data" não encontrado')
                return result
            
            data = backup_data['data']
            
            # Restaurar categorias primeiro (são referenciadas por clientes)
            if 'categorias' in data and isinstance(data['categorias'], dict):
                try:
                    self.save_categorias(data['categorias'])
                    result['restored']['categorias'] = len(data['categorias'])
                except Exception as e:
                    result['errors'].append(f"Erro ao restaurar categorias: {str(e)}")
            
            # Restaurar clientes (inclui bicicletas)
            if 'clientes' in data:
                for cliente in data['clientes']:
                    try:
                        if self.save_cliente(cliente):
                            result['restored']['clientes'] += 1
                    except Exception as e:
                        result['errors'].append(f"Erro ao restaurar cliente {cliente.get('cpf', 'unknown')}: {str(e)}")
            
            # Restaurar registros
            if 'registros' in data:
                for registro in data['registros']:
                    try:
                        if self.save_registro(registro):
                            result['restored']['registros'] += 1
                    except Exception as e:
                        result['errors'].append(f"Erro ao restaurar registro {registro.get('id', 'unknown')}: {str(e)}")
            
            # Restaurar usuários
            if 'usuarios' in data:
                for usuario in data['usuarios']:
                    try:
                        if self.save_usuario(usuario):
                            result['restored']['usuarios'] += 1
                    except Exception as e:
                        result['errors'].append(f"Erro ao restaurar usuário {usuario.get('username', 'unknown')}: {str(e)}")
            
            result['success'] = len(result['errors']) == 0
            logger.info(f"Backup restaurado: {result['restored']}")
            
        except Exception as e:
            logger.error(f"Erro ao restaurar backup: {e}", exc_info=True)
            result['errors'].append(str(e))
        
        return result
    
    def delete_backup(self, filename: str) -> bool:
        """Remove um arquivo de backup"""
        try:
            filepath = os.path.join(BACKUP_DIR, filename)
            if os.path.exists(filepath):
                os.remove(filepath)
                logger.info(f"Backup removido: {filename}")
                return True
            return False
        except Exception as e:
            logger.error(f"Erro ao remover backup {filename}: {e}", exc_info=True)
            return False
    
    def save_backup_file(self, backup_data: Dict[str, Any], filename: Optional[str] = None) -> Optional[str]:
        """Salva um backup enviado por upload"""
        try:
            # Validar estrutura básica
            if 'data' not in backup_data:
                raise ValueError("Estrutura de backup inválida")
            
            # Gerar nome do arquivo se não fornecido
            if not filename:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"backup_{timestamp}.json"
            
            # Garantir que tem extensão .json
            if not filename.endswith('.json'):
                filename += '.json'
            
            filepath = os.path.join(BACKUP_DIR, filename)
            os.makedirs(BACKUP_DIR, exist_ok=True)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Backup salvo: {filename}")
            return filename
        except Exception as e:
            logger.error(f"Erro ao salvar backup: {e}", exc_info=True)
            return None
    
    def get_backup_settings(self) -> Dict[str, Any]:
        """Retorna as configurações de backup automático"""
        settings_json = self.get_config('backup_settings', '{}')
        try:
            settings = json.loads(settings_json)
        except:
            settings = {}
        
        # Valores padrão
        default_settings = {
            'enabled': False,
            'interval': 'daily',  # 'daily', 'weekly', 'monthly'
            'max_backups': 10,
            'last_backup': None
        }
        
        return {**default_settings, **settings}
    
    def save_backup_settings(self, settings: Dict[str, Any]) -> bool:
        """Salva as configurações de backup automático"""
        try:
            return self.set_config('backup_settings', json.dumps(settings))
        except Exception as e:
            logger.error(f"Erro ao salvar configurações de backup: {e}", exc_info=True)
            return False
    
    def _cleanup_old_backups(self):
        """Remove backups antigos conforme configuração de max_backups"""
        try:
            settings = self.get_backup_settings()
            max_backups = settings.get('max_backups', 10)
            
            backups = self.list_backups()
            
            # Se há mais backups que o permitido, remove os mais antigos
            if len(backups) > max_backups:
                backups_to_delete = backups[max_backups:]
                for backup in backups_to_delete:
                    self.delete_backup(backup['filename'])
                    logger.info(f"Backup antigo removido: {backup['filename']}")
        except Exception as e:
            logger.error(f"Erro ao limpar backups antigos: {e}", exc_info=True)
    
    def check_automatic_backup(self) -> Optional[Dict[str, Any]]:
        """Verifica se é hora de fazer backup automático e executa se necessário"""
        try:
            settings = self.get_backup_settings()
            
            if not settings.get('enabled', False):
                return None
            
            last_backup = settings.get('last_backup')
            interval = settings.get('interval', 'daily')
            
            should_backup = False
            
            if not last_backup:
                should_backup = True
            else:
                last_dt = datetime.fromisoformat(last_backup)
                now = datetime.now()
                
                if interval == 'daily':
                    should_backup = (now - last_dt).days >= 1
                elif interval == 'weekly':
                    should_backup = (now - last_dt).days >= 7
                elif interval == 'monthly':
                    should_backup = (now - last_dt).days >= 30
            
            if should_backup:
                result = self.create_full_backup()
                if result and result.get('success'):
                    settings['last_backup'] = datetime.now().isoformat()
                    self.save_backup_settings(settings)
                    logger.info("Backup automático realizado com sucesso")
                    return result
            
            return None
        except Exception as e:
            logger.error(f"Erro no backup automático: {e}", exc_info=True)
            return None
    
    # ==================== USUÁRIOS ====================
    
    def get_all_usuarios(self) -> List[Dict[str, Any]]:
        """Retorna todos os usuários"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM usuarios ORDER BY username")
                rows = cursor.fetchall()
                
                usuarios = []
                for row in rows:
                    usuario = dict(row)
                    usuario['ativo'] = bool(usuario.get('ativo', 1))
                    if usuario.get('permissoes'):
                        try:
                            usuario['permissoes'] = json.loads(usuario['permissoes'])
                        except:
                            pass
                    usuarios.append(usuario)
                
                return usuarios
        except Exception as e:
            logger.error(f"Erro ao buscar usuários: {e}", exc_info=True)
            return []
    
    def save_usuario(self, usuario: Dict[str, Any]) -> bool:
        """Salva ou atualiza um usuário"""
        try:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                now = datetime.now().isoformat()
                
                permissoes = usuario.get('permissoes', {})
                if isinstance(permissoes, dict):
                    permissoes = json.dumps(permissoes)
                
                cursor.execute("SELECT id FROM usuarios WHERE id = ?", (usuario['id'],))
                exists = cursor.fetchone()
                
                if exists:
                    cursor.execute("""
                        UPDATE usuarios SET
                            username = ?, password_hash = ?, nome = ?, tipo = ?,
                            ativo = ?, permissoes = ?, atualizado_em = ?
                        WHERE id = ?
                    """, (
                        usuario['username'], usuario.get('password_hash', ''),
                        usuario.get('nome', ''), usuario.get('tipo', 'operador'),
                        1 if usuario.get('ativo', True) else 0, permissoes,
                        now, usuario['id']
                    ))
                else:
                    cursor.execute("""
                        INSERT INTO usuarios (
                            id, username, password_hash, nome, tipo,
                            ativo, permissoes, criado_em, atualizado_em
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        usuario['id'], usuario['username'],
                        usuario.get('password_hash', ''), usuario.get('nome', ''),
                        usuario.get('tipo', 'operador'),
                        1 if usuario.get('ativo', True) else 0,
                        permissoes, now, now
                    ))
                
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Erro ao salvar usuário: {e}", exc_info=True)
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
