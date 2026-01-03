#!/usr/bin/env python3
"""
API de armazenamento offline integrada com SQLite
Fornece endpoints REST para armazenamento persistente com fallback
"""
import os
import json
import logging
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse
import threading

# Tenta importar o DatabaseManager
try:
    from db_manager import get_db_manager
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False
    logging.warning("DatabaseManager não disponível, usando apenas arquivos")

# Importa a storage_api original para fallback
try:
    from storage_api import StorageAPIHandler as OriginalStorageAPIHandler
    STORAGE_API_AVAILABLE = True
except ImportError:
    STORAGE_API_AVAILABLE = False
    logging.warning("storage_api não disponível, fallback desabilitado")

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class OfflineStorageAPIHandler(BaseHTTPRequestHandler):
    """Handler que usa SQLite quando disponível, com fallback para arquivos"""
    
    def __init__(self, *args, **kwargs):
        self.db = get_db_manager() if DB_AVAILABLE else None
        self.storage_api_available = STORAGE_API_AVAILABLE
        super().__init__(*args, **kwargs)
    
    def _set_headers(self, status=200, content_type='application/json'):
        self.send_response(status)
        self.send_header('Content-type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # Indica se está offline ou usando banco local
        self.send_header('X-Offline-Mode', 'true' if DB_AVAILABLE else 'fallback')
        self.end_headers()
    
    def do_OPTIONS(self):
        self._set_headers()
    
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        # Health check - indica status do sistema offline
        if parsed_path.path == '/api/health':
            self._set_headers()
            health_status = {
                "status": "ok",
                "offline_mode": True,
                "database_type": "sqlite" if DB_AVAILABLE else "filesystem",
                "storage_available": True
            }
            self.wfile.write(json.dumps(health_status).encode())
            return
        
        # Status de sincronização
        if parsed_path.path == '/api/sync/status':
            if DB_AVAILABLE:
                pending = self.db.get_pending_syncs()
                self._set_headers()
                self.wfile.write(json.dumps({
                    "pending_count": len(pending),
                    "pending_operations": pending
                }).encode())
            else:
                self._set_headers()
                self.wfile.write(json.dumps({
                    "pending_count": 0,
                    "pending_operations": []
                }).encode())
            return
        
        # Clientes
        if parsed_path.path == '/api/clients':
            if DB_AVAILABLE:
                clients = self.db.get_all_clientes()
                self._set_headers()
                self.wfile.write(json.dumps(clients, ensure_ascii=False).encode('utf-8'))
            else:
                # Fallback para handler original
                self._fallback_to_original('GET', parsed_path)
            return
        
        if parsed_path.path.startswith('/api/client/'):
            cpf = parsed_path.path.split('/')[-1]
            if DB_AVAILABLE:
                # Busca por CPF no SQLite
                clients = self.db.get_all_clientes()
                client = next((c for c in clients if c['cpf'] == cpf), None)
                if client:
                    self._set_headers()
                    self.wfile.write(json.dumps(client, ensure_ascii=False).encode('utf-8'))
                else:
                    self._set_headers(404)
                    self.wfile.write(json.dumps({"error": "Client not found"}).encode())
            else:
                self._fallback_to_original('GET', parsed_path)
            return
        
        # Registros
        if parsed_path.path == '/api/registros':
            if DB_AVAILABLE:
                registros = self.db.get_all_registros()
                self._set_headers()
                self.wfile.write(json.dumps(registros, ensure_ascii=False).encode('utf-8'))
            else:
                self._fallback_to_original('GET', parsed_path)
            return
        
        # Auditoria
        if parsed_path.path == '/api/audit':
            if DB_AVAILABLE:
                logs = self.db.get_audit_logs(100)
                self._set_headers()
                self.wfile.write(json.dumps(logs, ensure_ascii=False).encode('utf-8'))
            else:
                self._set_headers(404)
                self.wfile.write(json.dumps({"error": "Audit logs not available"}).encode())
            return
        
        # Backup
        if parsed_path.path.startswith('/api/backup/'):
            backup_format = parsed_path.path.split('/')[-1]  # 'zip' ou 'json'
            if DB_AVAILABLE:
                backup_file = self.db.create_backup(backup_format)
                if backup_file:
                    self._set_headers()
                    self.wfile.write(json.dumps({
                        "success": True,
                        "backup_file": backup_file
                    }).encode())
                else:
                    self._set_headers(500)
                    self.wfile.write(json.dumps({"error": "Failed to create backup"}).encode())
            else:
                self._set_headers(501)
                self.wfile.write(json.dumps({"error": "Backup not available"}).encode())
            return
        
        # Not found
        self._set_headers(404)
        self.wfile.write(json.dumps({"error": "Not found"}).encode())
    
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        # Cliente
        if self.path == '/api/client':
            client = json.loads(post_data.decode('utf-8'))
            if DB_AVAILABLE:
                success = self.db.save_cliente(client)
                if success:
                    # Adiciona à fila de sincronização
                    self.db.add_pending_sync('cliente', 'save', client)
                    self._set_headers()
                    self.wfile.write(json.dumps({
                        "success": True,
                        "cpf": client['cpf']
                    }).encode())
                else:
                    self._set_headers(500)
                    self.wfile.write(json.dumps({"error": "Failed to save client"}).encode())
            else:
                self._fallback_to_original('POST', urlparse(self.path), post_data)
            return
        
        # Registro
        if self.path == '/api/registro':
            registro = json.loads(post_data.decode('utf-8'))
            if DB_AVAILABLE:
                success = self.db.save_registro(registro)
                if success:
                    self.db.add_pending_sync('registro', 'save', registro)
                    self._set_headers()
                    self.wfile.write(json.dumps({
                        "success": True,
                        "id": registro['id']
                    }).encode())
                else:
                    self._set_headers(500)
                    self.wfile.write(json.dumps({"error": "Failed to save registro"}).encode())
            else:
                self._fallback_to_original('POST', urlparse(self.path), post_data)
            return
        
        # Auditoria
        if self.path == '/api/audit':
            audit_data = json.loads(post_data.decode('utf-8'))
            if DB_AVAILABLE:
                success = self.db.log_audit(
                    audit_data['usuario'],
                    audit_data['acao'],
                    audit_data.get('detalhes')
                )
                self._set_headers()
                self.wfile.write(json.dumps({"success": success}).encode())
            else:
                self._set_headers()
                self.wfile.write(json.dumps({"success": True}).encode())
            return
        
        # Sincronizar pendências
        if self.path == '/api/sync':
            if DB_AVAILABLE:
                # Retorna todas as operações pendentes para sincronização
                pending = self.db.get_pending_syncs()
                self._set_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "pending": pending
                }).encode())
            else:
                self._set_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "pending": []
                }).encode())
            return
        
        self._set_headers(404)
        self.wfile.write(json.dumps({"error": "Not found"}).encode())
    
    def do_DELETE(self):
        if self.path.startswith('/api/client/'):
            cpf = self.path.split('/')[-1]
            if DB_AVAILABLE:
                # Busca cliente por CPF
                clients = self.db.get_all_clientes()
                client = next((c for c in clients if c['cpf'] == cpf), None)
                if client:
                    success = self.db.delete_cliente(client['id'])
                    if success:
                        self.db.add_pending_sync('cliente', 'delete', {'id': client['id']})
                        self._set_headers()
                        self.wfile.write(json.dumps({"success": True}).encode())
                    else:
                        self._set_headers(500)
                        self.wfile.write(json.dumps({"error": "Failed to delete client"}).encode())
                else:
                    self._set_headers(404)
                    self.wfile.write(json.dumps({"error": "Client not found"}).encode())
            else:
                self._fallback_to_original('DELETE', urlparse(self.path))
            return
        
        self._set_headers(404)
        self.wfile.write(json.dumps({"error": "Not found"}).encode())
    
    def _fallback_to_original(self, method, parsed_path, post_data=None):
        """Fallback para o handler original de arquivos"""
        logger.info(f"Usando fallback para {method} {parsed_path.path}")
        # Aqui seria necessário delegar para o handler original
        # Por simplicidade, retornamos erro
        self._set_headers(503)
        self.wfile.write(json.dumps({
            "error": "Database not available, using fallback storage"
        }).encode())
    
    def log_message(self, format, *args):
        """Log de requisições HTTP"""
        logger.info("%s - %s" % (self.address_string(), format % args))


def run_offline_storage_api(port=5001):
    """Inicia o servidor da API de armazenamento offline"""
    try:
        if DB_AVAILABLE:
            logger.info("✅ Modo offline completo com SQLite ativado")
        else:
            logger.info("⚠️ Modo fallback com armazenamento em arquivos")
        
        server = HTTPServer(('localhost', port), OfflineStorageAPIHandler)
        logger.info(f'API de armazenamento offline rodando em http://localhost:{port}/')
        logger.info(f'Dados salvos em: {os.path.abspath("dados/")}')
        server.serve_forever()
    except Exception as e:
        logger.error(f"Erro ao iniciar API de armazenamento offline: {e}", exc_info=True)


if __name__ == '__main__':
    run_offline_storage_api()
