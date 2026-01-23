#!/usr/bin/env python3
"""
Sistema de Gerenciamento de Bicicletário - Servidor Web
Servidor HTTP com headers de segurança e suporte a API de armazenamento integrada
"""
import http.server
import socketserver
import os
import json
import logging
import base64
from urllib.parse import urlparse

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

PORT = 5000
DIRECTORY = "."

STORAGE_DIR = "dados/navegador"
CLIENTS_DIR = os.path.join(STORAGE_DIR, "clientes")
REGISTROS_DIR = os.path.join(STORAGE_DIR, "registros")
IMAGES_DIR = "dados/imagens"

DB_MANAGER = None
DB_AVAILABLE = False

try:
    from db_manager import get_db_manager
    DB_MANAGER = get_db_manager()
    DB_AVAILABLE = True
    logger.info("✅ DatabaseManager SQLite carregado com sucesso")
except ImportError as e:
    logger.warning(f"DatabaseManager não disponível: {e}")
except Exception as e:
    logger.warning(f"Erro ao inicializar DatabaseManager: {e}")

JOB_MANAGER = None
IMPORT_WORKER = None

try:
    from background_jobs import get_job_manager, get_import_worker
    JOB_MANAGER = get_job_manager()
    IMPORT_WORKER = get_import_worker(DB_MANAGER, STORAGE_DIR)
    logger.info("✅ Sistema de jobs em segundo plano carregado")
except ImportError as e:
    logger.warning(f"Sistema de jobs não disponível: {e}")
except Exception as e:
    logger.warning(f"Erro ao inicializar sistema de jobs: {e}")

# JWT and QR Code support
JWT_MANAGER = None
QR_GENERATOR = None
AUTH_MANAGER = None

try:
    from jwt_manager import get_jwt_manager
    JWT_MANAGER = get_jwt_manager()
    logger.info("✅ JWT Manager carregado com sucesso")
except ImportError as e:
    logger.warning(f"JWT Manager não disponível: {e}")
except Exception as e:
    logger.warning(f"Erro ao inicializar JWT Manager: {e}")

try:
    from qr_generator import get_qr_generator
    # Get base URL from environment or use default
    base_url = os.environ.get('REPL_SLUG', 'http://localhost:5000')
    if not base_url.startswith('http'):
        base_url = f'https://{base_url}.replit.dev'
    QR_GENERATOR = get_qr_generator(base_url)
    logger.info(f"✅ QR Generator carregado com sucesso (URL: {base_url})")
except ImportError as e:
    logger.warning(f"QR Generator não disponível: {e}")
except Exception as e:
    logger.warning(f"Erro ao inicializar QR Generator: {e}")

try:
    from auth_manager import get_auth_manager
    AUTH_MANAGER = get_auth_manager()
    logger.info("✅ Auth Manager carregado com sucesso")
except ImportError as e:
    logger.warning(f"Auth Manager não disponível: {e}")
except Exception as e:
    logger.warning(f"Erro ao inicializar Auth Manager: {e}")

def use_sqlite_storage() -> bool:
    """Verifica se deve usar SQLite baseado na configuração atual"""
    if not DB_AVAILABLE or DB_MANAGER is None:
        return False
    current_mode = DB_MANAGER.get_storage_mode()
    return current_mode == 'sqlite'

def ensure_directories():
    """Cria as pastas necessárias se não existirem"""
    try:
        os.makedirs(CLIENTS_DIR, exist_ok=True)
        os.makedirs(REGISTROS_DIR, exist_ok=True)
        os.makedirs(IMAGES_DIR, exist_ok=True)
        logger.info(f"Diretórios criados/verificados: {STORAGE_DIR}, {IMAGES_DIR}")
    except Exception as e:
        logger.error(f"Erro ao criar diretórios: {e}")

ensure_directories()

CONFIG_FILE = os.path.join(STORAGE_DIR, "config.json")

def load_config():
    """Carrega as configurações do sistema"""
    default_config = {
        "maxCapacity": 50,
        "longStayHours": 24
    }
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                saved_config = json.load(f)
                default_config.update(saved_config)
        except Exception as e:
            logger.error(f"Erro ao carregar config: {e}")
    return default_config

def save_system_config(new_config):
    """Salva as configurações do sistema"""
    try:
        current_config = load_config()
        current_config.update(new_config)
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(current_config, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Erro ao salvar config: {e}")
        return False


class CombinedHTTPHandler(http.server.SimpleHTTPRequestHandler):
    """
    Handler HTTP que serve arquivos estáticos e também endpoints de API
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def _set_api_headers(self, status=200, content_type='application/json'):
        self.send_response(status)
        self.send_header('Content-type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.end_headers()
    
    def end_headers(self):
        """Adiciona headers de segurança e controle de cache"""
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-XSS-Protection', '1; mode=block')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "frame-ancestors *; "
            "connect-src 'self' https://*.replit.dev https://*.repl.co"
        )
        self.send_header('Content-Security-Policy', csp)
        
        super().end_headers()
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self._set_api_headers()
    
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path.startswith('/api/'):
            self._handle_api_get(parsed_path)
        else:
            super().do_GET()
    
    def do_POST(self):
        if self.path.startswith('/api/'):
            self._handle_api_post()
        else:
            self.send_error(404, "Not Found")
    
    def do_DELETE(self):
        if self.path.startswith('/api/'):
            self._handle_api_delete()
        else:
            self.send_error(404, "Not Found")
    
    def _handle_api_get(self, parsed_path):
        path = parsed_path.path
        
        if path == '/api/health':
            self._set_api_headers()
            health_status = {
                "status": "ok",
                "offline_mode": True,
                "database_type": "sqlite" if DB_AVAILABLE else "filesystem",
                "storage_available": True
            }
            self.wfile.write(json.dumps(health_status).encode())
            return
        
        if path == '/api/clients':
            if use_sqlite_storage():
                clients = DB_MANAGER.get_all_clientes()
                self._set_api_headers()
                self.wfile.write(json.dumps(clients, ensure_ascii=False).encode('utf-8'))
            else:
                self._get_all_clients_files()
            return
        
        if path.startswith('/api/client/'):
            cpf = path.split('/')[-1]
            if use_sqlite_storage():
                clients = DB_MANAGER.get_all_clientes()
                client = next((c for c in clients if c['cpf'] == cpf), None)
                if client:
                    self._set_api_headers()
                    self.wfile.write(json.dumps(client, ensure_ascii=False).encode('utf-8'))
                else:
                    self._set_api_headers(404)
                    self.wfile.write(json.dumps({"error": "Client not found"}).encode())
            else:
                self._get_client_file(cpf)
            return

        # Serve uploaded images
        if path.startswith('/imagens/'):
            image_filename = path.split('/')[-1]
            image_path = os.path.join(IMAGES_DIR, image_filename)
            if os.path.exists(image_path):
                self.send_response(200)
                self.send_header('Content-Type', 'image/jpeg') # Assuming JPEG for simplicity
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                with open(image_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_error(404, "Image Not Found")
            return
        
        if path == '/api/registros':
            if use_sqlite_storage():
                registros = DB_MANAGER.get_all_registros()
                self._set_api_headers()
                self.wfile.write(json.dumps(registros, ensure_ascii=False).encode('utf-8'))
            else:
                self._get_all_registros_files()
            return
        
        if path == '/api/audit':
            if use_sqlite_storage():
                logs = DB_MANAGER.get_audit_logs(100)
                self._set_api_headers()
                self.wfile.write(json.dumps(logs, ensure_ascii=False).encode('utf-8'))
            else:
                self._set_api_headers(404)
                self.wfile.write(json.dumps({"error": "Audit logs not available"}).encode())
            return
        
        if path == '/api/sync/status':
            if use_sqlite_storage():
                pending = DB_MANAGER.get_pending_syncs()
                self._set_api_headers()
                self.wfile.write(json.dumps({
                    "pending_count": len(pending),
                    "pending_operations": pending
                }).encode())
            else:
                self._set_api_headers()
                self.wfile.write(json.dumps({
                    "pending_count": 0,
                    "pending_operations": []
                }).encode())
            return
        
        if path == '/api/categorias':
            if use_sqlite_storage():
                categorias = DB_MANAGER.get_all_categorias()
                self._set_api_headers()
                self.wfile.write(json.dumps(categorias, ensure_ascii=False).encode('utf-8'))
            else:
                self._set_api_headers()
                self.wfile.write(json.dumps({}).encode())
            return
        
        if path == '/api/storage-mode':
            if DB_AVAILABLE and DB_MANAGER is not None:
                stats = DB_MANAGER.get_storage_stats()
                self._set_api_headers()
                self.wfile.write(json.dumps(stats, ensure_ascii=False).encode('utf-8'))
            else:
                self._set_api_headers()
                self.wfile.write(json.dumps({
                    'current_mode': 'json',
                    'sqlite': {'clientes': 0, 'bicicletas': 0, 'registros': 0, 'categorias': 0},
                    'json': {'clientes': 0, 'bicicletas': 0, 'registros': 0},
                    'last_migration': None,
                    'migration_status': 'idle',
                    'db_available': False
                }).encode())
            return
        
        if path == '/api/jobs':
            if JOB_MANAGER is not None:
                active_jobs = JOB_MANAGER.get_active_jobs()
                recent_jobs = JOB_MANAGER.get_recent_jobs(5)
                self._set_api_headers()
                self.wfile.write(json.dumps({
                    'active': active_jobs,
                    'recent': recent_jobs
                }, ensure_ascii=False).encode('utf-8'))
            else:
                self._set_api_headers()
                self.wfile.write(json.dumps({'active': [], 'recent': []}).encode())
            return
        
        if path.startswith('/api/job/'):
            job_id = path.split('/')[-1]
            if JOB_MANAGER is not None:
                job = JOB_MANAGER.get_job(job_id)
                if job:
                    self._set_api_headers()
                    self.wfile.write(json.dumps(job, ensure_ascii=False).encode('utf-8'))
                else:
                    self._set_api_headers(404)
                    self.wfile.write(json.dumps({"error": "Job not found"}).encode())
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "Job system not available"}).encode())
            return
        
        if path == '/api/changes':
            if JOB_MANAGER is not None:
                changes = JOB_MANAGER.get_changes()
                self._set_api_headers()
                self.wfile.write(json.dumps(changes).encode())
            else:
                self._set_api_headers()
                self.wfile.write(json.dumps({
                    'clients': 0, 'registros': 0, 'usuarios': 0, 'categorias': 0
                }).encode())
            return
        
        if path == '/api/system-config':
            config = load_config()
            self._set_api_headers()
            self.wfile.write(json.dumps(config).encode())
            return
        
        # ========== QR CODE ENDPOINTS ==========
        if path == '/api/qr/generate':
            """Gera QR code para estação"""
            if QR_GENERATOR and JWT_MANAGER:
                # Gera token para a estação
                station_id = parsed_path.query.get('station', 'default') if hasattr(parsed_path, 'query') else 'default'
                token = JWT_MANAGER.generate_qr_token(station_id)
                qr_base64 = QR_GENERATOR.generate_qr_base64(station_id, token)
                
                if qr_base64:
                    self._set_api_headers()
                    self.wfile.write(json.dumps({
                        "success": True,
                        "qr_code": qr_base64,
                        "station_id": station_id
                    }).encode())
                else:
                    self._set_api_headers(500)
                    self.wfile.write(json.dumps({"error": "Failed to generate QR code"}).encode())
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "QR Generator not available"}).encode())
            return
        
        if path == '/api/qr/registros':
            """Retorna registros QR"""
            if DB_AVAILABLE and DB_MANAGER:
                registros = DB_MANAGER.get_registros_qr()
                self._set_api_headers()
                self.wfile.write(json.dumps(registros, ensure_ascii=False).encode('utf-8'))
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "Database not available"}).encode())
            return
        
        if path == '/api/qr/solicitacoes':
            """Retorna solicitações de cadastro pendentes"""
            if DB_AVAILABLE and DB_MANAGER:
                solicitacoes = DB_MANAGER.get_solicitacoes_pendentes()
                self._set_api_headers()
                self.wfile.write(json.dumps(solicitacoes, ensure_ascii=False).encode('utf-8'))
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "Database not available"}).encode())
            return
        
        # ========== BACKUP ENDPOINTS ==========
        if path == '/api/backups':
            if DB_AVAILABLE and DB_MANAGER is not None:
                backups = DB_MANAGER.list_backups()
                self._set_api_headers()
                self.wfile.write(json.dumps(backups, ensure_ascii=False).encode('utf-8'))
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "Database not available"}).encode())
            return
        
        if path == '/api/backup/settings':
            if DB_AVAILABLE and DB_MANAGER is not None:
                settings = DB_MANAGER.get_backup_settings()
                self._set_api_headers()
                self.wfile.write(json.dumps(settings, ensure_ascii=False).encode('utf-8'))
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "Database not available"}).encode())
            return
        
        if path.startswith('/api/backup/download/'):
            filename = path.split('/')[-1]
            if DB_AVAILABLE and DB_MANAGER is not None:
                backup_content = DB_MANAGER.get_backup_content(filename)
                if backup_content:
                    self._set_api_headers(content_type='application/octet-stream')
                    self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
                    content = json.dumps(backup_content, ensure_ascii=False, indent=2)
                    self.wfile.write(content.encode('utf-8'))
                else:
                    self._set_api_headers(404)
                    self.wfile.write(json.dumps({"error": "Backup not found"}).encode())
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "Database not available"}).encode())
            return
        
        self._set_api_headers(404)
        self.wfile.write(json.dumps({"error": "Not found"}).encode())
    
    def _handle_api_post(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        if self.path == '/api/client':
            client = json.loads(post_data.decode('utf-8'))
            if use_sqlite_storage():
                success = DB_MANAGER.save_cliente(client)
                if success:
                    DB_MANAGER.add_pending_sync('cliente', 'save', client)
                    self._set_api_headers()
                    self.wfile.write(json.dumps({
                        "success": True,
                        "cpf": client['cpf']
                    }).encode())
                else:
                    self._set_api_headers(500)
                    self.wfile.write(json.dumps({"error": "Failed to save client"}).encode())
            else:
                self._save_client_file(client)
            return
        
        if self.path == '/api/registro':
            registro = json.loads(post_data.decode('utf-8'))
            if use_sqlite_storage():
                success = DB_MANAGER.save_registro(registro)
                if success:
                    DB_MANAGER.add_pending_sync('registro', 'save', registro)
                    self._set_api_headers()
                    self.wfile.write(json.dumps({
                        "success": True,
                        "id": registro['id']
                    }).encode())
                else:
                    self._set_api_headers(500)
                    self.wfile.write(json.dumps({"error": "Failed to save registro"}).encode())
            else:
                self._save_registro_file(registro)
            return
        
        if self.path == '/api/audit':
            audit_data = json.loads(post_data.decode('utf-8'))
            if use_sqlite_storage():
                success = DB_MANAGER.log_audit(
                    audit_data['usuario'],
                    audit_data['acao'],
                    audit_data.get('detalhes')
                )
                self._set_api_headers()
                self.wfile.write(json.dumps({"success": success}).encode())
            else:
                self._set_api_headers()
                self.wfile.write(json.dumps({"success": True}).encode())
            return
        
        if self.path == '/api/categorias':
            categorias = json.loads(post_data.decode('utf-8'))
            if use_sqlite_storage():
                success = DB_MANAGER.save_categorias(categorias)
                if success:
                    self._set_api_headers()
                    self.wfile.write(json.dumps({"success": True}).encode())
                else:
                    self._set_api_headers(500)
                    self.wfile.write(json.dumps({"error": "Failed to save categorias"}).encode())
            else:
                self._set_api_headers()
                self.wfile.write(json.dumps({"success": True}).encode())
            return
        
        if self.path == '/api/storage-mode':
            data = json.loads(post_data.decode('utf-8'))
            if DB_AVAILABLE and DB_MANAGER is not None:
                new_mode = data.get('mode')
                if new_mode in ('sqlite', 'json'):
                    success = DB_MANAGER.set_storage_mode(new_mode)
                    if success:
                        self._set_api_headers()
                        self.wfile.write(json.dumps({
                            "success": True,
                            "mode": new_mode
                        }).encode())
                    else:
                        self._set_api_headers(500)
                        self.wfile.write(json.dumps({"error": "Failed to change storage mode"}).encode())
                else:
                    self._set_api_headers(400)
                    self.wfile.write(json.dumps({"error": "Invalid mode. Use 'sqlite' or 'json'"}).encode())
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "Database not available"}).encode())
            return
        
        if self.path == '/api/migrate':
            data = json.loads(post_data.decode('utf-8'))
            if DB_AVAILABLE and DB_MANAGER is not None:
                direction = data.get('direction')
                if direction == 'json_to_sqlite':
                    result = DB_MANAGER.migrate_json_to_sqlite()
                    self._set_api_headers()
                    self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
                elif direction == 'sqlite_to_json':
                    result = DB_MANAGER.migrate_sqlite_to_json()
                    self._set_api_headers()
                    self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
                else:
                    self._set_api_headers(400)
                    self.wfile.write(json.dumps({"error": "Invalid direction. Use 'json_to_sqlite' or 'sqlite_to_json'"}).encode())
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "Database not available for migration"}).encode())
            return
        
        if self.path == '/api/import/clients':
            data = json.loads(post_data.decode('utf-8'))
            if IMPORT_WORKER is not None:
                clients = data.get('clients', [])
                storage_mode = 'sqlite' if use_sqlite_storage() else 'json'
                job_id = IMPORT_WORKER.import_clients_async(clients, storage_mode)
                self._set_api_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "job_id": job_id,
                    "message": "Importação iniciada em segundo plano"
                }).encode())
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "Import system not available"}).encode())
            return
        
        if self.path == '/api/import/registros':
            data = json.loads(post_data.decode('utf-8'))
            if IMPORT_WORKER is not None:
                registros = data.get('registros', [])
                storage_mode = 'sqlite' if use_sqlite_storage() else 'json'
                job_id = IMPORT_WORKER.import_registros_async(registros, storage_mode)
                self._set_api_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "job_id": job_id,
                    "message": "Importação iniciada em segundo plano"
                }).encode())
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "Import system not available"}).encode())
            return
        
        if self.path == '/api/import/backup':
            data = json.loads(post_data.decode('utf-8'))
            if IMPORT_WORKER is not None:
                storage_mode = 'sqlite' if use_sqlite_storage() else 'json'
                job_id = IMPORT_WORKER.import_system_backup_async(data, storage_mode)
                self._set_api_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "job_id": job_id,
                    "message": "Importação de backup iniciada em segundo plano"
                }).encode())
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "Import system not available"}).encode())
            return
        
        if self.path == '/api/notify-change':
            data = json.loads(post_data.decode('utf-8'))
            if JOB_MANAGER is not None:
                change_type = data.get('type', 'clients')
                JOB_MANAGER.notify_change(change_type)
                self._set_api_headers()
                self.wfile.write(json.dumps({"success": True}).encode())
            else:
                self._set_api_headers()
                self.wfile.write(json.dumps({"success": True}).encode())
            return

        # ========== QR CODE POST ENDPOINTS ==========
        if self.path == '/api/auth/login':
            """Autenticação de usuário"""
            data = json.loads(post_data.decode('utf-8'))
            username = data.get('username')
            password = data.get('password')
            
            if AUTH_MANAGER:
                user_data = AUTH_MANAGER.authenticate(username, password)
                if user_data:
                    # Gera JWT token
                    if JWT_MANAGER:
                        token = JWT_MANAGER.generate_token(user_data)
                        user_data['token'] = token
                    
                    self._set_api_headers()
                    self.wfile.write(json.dumps({
                        "success": True,
                        "user": user_data
                    }, ensure_ascii=False).encode('utf-8'))
                else:
                    self._set_api_headers(401)
                    self.wfile.write(json.dumps({"error": "Credenciais inválidas"}).encode())
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "Auth system not available"}).encode())
            return
        
        if self.path == '/api/auth/register':
            """Registro de novo usuário (cria solicitação pendente)"""
            data = json.loads(post_data.decode('utf-8'))
            
            if DB_AVAILABLE and DB_MANAGER and AUTH_MANAGER:
                import uuid
                # Hash da senha
                senha_hash = AUTH_MANAGER._hash_password(data.get('senha'))
                
                solicitacao = {
                    'id': str(uuid.uuid4()),
                    'nome': data.get('nome'),
                    'email': data.get('email'),
                    'cpf': data.get('cpf'),
                    'telefone': data.get('telefone', ''),
                    'senha_hash': senha_hash,
                    'status': 'pendente',
                    'station_id': data.get('station_id', 'default')
                }
                
                success = DB_MANAGER.save_solicitacao_cadastro(solicitacao)
                if success:
                    self._set_api_headers()
                    self.wfile.write(json.dumps({
                        "success": True,
                        "message": "Solicitação de cadastro enviada. Aguarde aprovação do administrador."
                    }).encode())
                else:
                    self._set_api_headers(500)
                    self.wfile.write(json.dumps({"error": "Erro ao criar solicitação"}).encode())
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "System not available"}).encode())
            return
        
        if self.path == '/api/qr/checkin':
            """Registro de entrada via QR"""
            data = json.loads(post_data.decode('utf-8'))
            
            if DB_AVAILABLE and DB_MANAGER:
                import uuid
                from datetime import datetime
                
                # Valida token se fornecido
                token = data.get('token')
                if token and JWT_MANAGER:
                    user_data = JWT_MANAGER.validate_token(token)
                    if not user_data:
                        self._set_api_headers(401)
                        self.wfile.write(json.dumps({"error": "Token inválido ou expirado"}).encode())
                        return
                
                registro = {
                    'id': str(uuid.uuid4()),
                    'cliente_id': data.get('cliente_id'),
                    'tipo': 'entrada',
                    'data_hora': datetime.now().isoformat(),
                    'station_id': data.get('station_id', 'default'),
                    'status': 'ativo',
                    'bicicleta_descricao': data.get('bicicleta_descricao', ''),
                    'observacoes': data.get('observacoes', '')
                }
                
                success = DB_MANAGER.save_registro_qr(registro)
                if success:
                    self._set_api_headers()
                    self.wfile.write(json.dumps({
                        "success": True,
                        "id": registro['id'],
                        "message": "Entrada registrada com sucesso"
                    }).encode())
                else:
                    self._set_api_headers(500)
                    self.wfile.write(json.dumps({"error": "Erro ao registrar entrada"}).encode())
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "Database not available"}).encode())
            return
        
        if self.path == '/api/qr/checkout':
            """Registro de saída via QR"""
            data = json.loads(post_data.decode('utf-8'))
            
            if DB_AVAILABLE and DB_MANAGER:
                import uuid
                from datetime import datetime
                
                # Valida token se fornecido
                token = data.get('token')
                if token and JWT_MANAGER:
                    user_data = JWT_MANAGER.validate_token(token)
                    if not user_data:
                        self._set_api_headers(401)
                        self.wfile.write(json.dumps({"error": "Token inválido ou expirado"}).encode())
                        return
                
                registro = {
                    'id': str(uuid.uuid4()),
                    'cliente_id': data.get('cliente_id'),
                    'tipo': 'saida',
                    'data_hora': datetime.now().isoformat(),
                    'station_id': data.get('station_id', 'default'),
                    'status': 'ativo',
                    'bicicleta_descricao': data.get('bicicleta_descricao', ''),
                    'observacoes': data.get('observacoes', '')
                }
                
                success = DB_MANAGER.save_registro_qr(registro)
                if success:
                    self._set_api_headers()
                    self.wfile.write(json.dumps({
                        "success": True,
                        "id": registro['id'],
                        "message": "Saída registrada com sucesso"
                    }).encode())
                else:
                    self._set_api_headers(500)
                    self.wfile.write(json.dumps({"error": "Erro ao registrar saída"}).encode())
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "Database not available"}).encode())
            return
        
        if self.path == '/api/qr/solicitacao/aprovar':
            """Aprova uma solicitação de cadastro"""
            data = json.loads(post_data.decode('utf-8'))
            
            if DB_AVAILABLE and DB_MANAGER:
                solicitacao_id = data.get('id')
                aprovado_por = data.get('aprovado_por', 'admin')
                
                success = DB_MANAGER.aprovar_solicitacao(solicitacao_id, aprovado_por)
                if success:
                    self._set_api_headers()
                    self.wfile.write(json.dumps({
                        "success": True,
                        "message": "Solicitação aprovada com sucesso"
                    }).encode())
                else:
                    self._set_api_headers(500)
                    self.wfile.write(json.dumps({"error": "Erro ao aprovar solicitação"}).encode())
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "Database not available"}).encode())
            return
        
        if self.path == '/api/qr/solicitacao/rejeitar':
            """Rejeita uma solicitação de cadastro"""
            data = json.loads(post_data.decode('utf-8'))
            
            if DB_AVAILABLE and DB_MANAGER:
                solicitacao_id = data.get('id')
                aprovado_por = data.get('aprovado_por', 'admin')
                observacoes = data.get('observacoes', '')
                
                success = DB_MANAGER.rejeitar_solicitacao(solicitacao_id, aprovado_por, observacoes)
                if success:
                    self._set_api_headers()
                    self.wfile.write(json.dumps({
                        "success": True,
                        "message": "Solicitação rejeitada"
                    }).encode())
                else:
                    self._set_api_headers(500)
                    self.wfile.write(json.dumps({"error": "Erro ao rejeitar solicitação"}).encode())
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "Database not available"}).encode())
            return

        if self.path == '/api/system-config':
            data = json.loads(post_data.decode('utf-8'))
            success = save_system_config(data)
            if success:
                self._set_api_headers()
                self.wfile.write(json.dumps({"success": True}).encode())
            else:
                self._set_api_headers(500)
                self.wfile.write(json.dumps({"error": "Failed to save config"}).encode())
            return
        
        if self.path == '/api/clear/clients':
            if use_sqlite_storage():
                result = DB_MANAGER.clear_all_clientes()
                if result['success']:
                    if JOB_MANAGER is not None:
                        JOB_MANAGER.notify_change('clients')
                    self._set_api_headers()
                    self.wfile.write(json.dumps(result).encode())
                else:
                    self._set_api_headers(500)
                    self.wfile.write(json.dumps(result).encode())
            else:
                count = 0
                try:
                    if os.path.exists(CLIENTS_DIR):
                        for filename in os.listdir(CLIENTS_DIR):
                            if filename.endswith('.json'):
                                filepath = os.path.join(CLIENTS_DIR, filename)
                                os.remove(filepath)
                                count += 1
                    if JOB_MANAGER is not None:
                        JOB_MANAGER.notify_change('clients')
                    self._set_api_headers()
                    self.wfile.write(json.dumps({"success": True, "count": count}).encode())
                except Exception as e:
                    self._set_api_headers(500)
                    self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode())
            return
        
        if self.path == '/api/clear/registros':
            if use_sqlite_storage():
                result = DB_MANAGER.clear_all_registros()
                if result['success']:
                    if JOB_MANAGER is not None:
                        JOB_MANAGER.notify_change('registros')
                    self._set_api_headers()
                    self.wfile.write(json.dumps(result).encode())
                else:
                    self._set_api_headers(500)
                    self.wfile.write(json.dumps(result).encode())
            else:
                count = 0
                try:
                    import shutil
                    if os.path.exists(REGISTROS_DIR):
                        for item in os.listdir(REGISTROS_DIR):
                            item_path = os.path.join(REGISTROS_DIR, item)
                            if os.path.isdir(item_path):
                                for root, dirs, files in os.walk(item_path):
                                    for f in files:
                                        if f.endswith('.json'):
                                            os.remove(os.path.join(root, f))
                                            count += 1
                                shutil.rmtree(item_path, ignore_errors=True)
                    if JOB_MANAGER is not None:
                        JOB_MANAGER.notify_change('registros')
                    self._set_api_headers()
                    self.wfile.write(json.dumps({"success": True, "count": count}).encode())
                except Exception as e:
                    self._set_api_headers(500)
                    self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode())
            return
        
        if self.path == '/api/clear/categorias':
            if use_sqlite_storage():
                result = DB_MANAGER.clear_all_categorias()
                if result['success']:
                    if JOB_MANAGER is not None:
                        JOB_MANAGER.notify_change('categorias')
                    self._set_api_headers()
                    self.wfile.write(json.dumps(result).encode())
                else:
                    self._set_api_headers(500)
                    self.wfile.write(json.dumps(result).encode())
            else:
                try:
                    categorias_file = os.path.join(STORAGE_DIR, "categorias.json")
                    if os.path.exists(categorias_file):
                        os.remove(categorias_file)
                    if JOB_MANAGER is not None:
                        JOB_MANAGER.notify_change('categorias')
                    self._set_api_headers()
                    self.wfile.write(json.dumps({"success": True, "count": 1}).encode())
                except Exception as e:
                    self._set_api_headers(500)
                    self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode())
            return
        
        # ========== BACKUP POST ENDPOINTS ==========
        if self.path == '/api/backup':
            if DB_AVAILABLE and DB_MANAGER is not None:
                result = DB_MANAGER.create_full_backup()
                if result and result.get('success'):
                    self._set_api_headers()
                    self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
                else:
                    self._set_api_headers(500)
                    self.wfile.write(json.dumps({"error": "Failed to create backup"}).encode())
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "Database not available"}).encode())
            return
        
        if self.path == '/api/backup/restore':
            data = json.loads(post_data.decode('utf-8'))
            if DB_AVAILABLE and DB_MANAGER is not None:
                filename = data.get('filename')
                backup_data = data.get('backup_data')
                
                # Se foi enviado um filename, carregar do arquivo
                if filename and not backup_data:
                    backup_data = DB_MANAGER.get_backup_content(filename)
                    if not backup_data:
                        self._set_api_headers(404)
                        self.wfile.write(json.dumps({"error": "Backup file not found"}).encode())
                        return
                
                if backup_data:
                    result = DB_MANAGER.restore_from_backup(backup_data)
                    if result.get('success'):
                        if JOB_MANAGER is not None:
                            JOB_MANAGER.notify_change('clients')
                            JOB_MANAGER.notify_change('registros')
                            JOB_MANAGER.notify_change('categorias')
                        self._set_api_headers()
                        self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
                    else:
                        self._set_api_headers(500)
                        self.wfile.write(json.dumps(result, ensure_ascii=False).encode('utf-8'))
                else:
                    self._set_api_headers(400)
                    self.wfile.write(json.dumps({"error": "No backup data provided"}).encode())
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "Database not available"}).encode())
            return
        
        if self.path == '/api/backup/upload':
            data = json.loads(post_data.decode('utf-8'))
            if DB_AVAILABLE and DB_MANAGER is not None:
                backup_data = data.get('backup_data')
                filename = data.get('filename')
                
                if backup_data:
                    # Validar estrutura básica
                    if 'data' not in backup_data:
                        self._set_api_headers(400)
                        self.wfile.write(json.dumps({"error": "Invalid backup structure"}).encode())
                        return
                    
                    saved_filename = DB_MANAGER.save_backup_file(backup_data, filename)
                    if saved_filename:
                        self._set_api_headers()
                        self.wfile.write(json.dumps({
                            "success": True,
                            "filename": saved_filename
                        }).encode())
                    else:
                        self._set_api_headers(500)
                        self.wfile.write(json.dumps({"error": "Failed to save backup"}).encode())
                else:
                    self._set_api_headers(400)
                    self.wfile.write(json.dumps({"error": "No backup data provided"}).encode())
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "Database not available"}).encode())
            return
        
        if self.path == '/api/upload-image':
            try:
                data = json.loads(post_data.decode('utf-8'))
                image_data = data.get('image') # Base64 string
                
                if not image_data:
                    self._set_api_headers(400)
                    self.wfile.write(json.dumps({"error": "No image data provided"}).encode())
                    return

                # Remove header if present (data:image/jpeg;base64,...)
                if ',' in image_data:
                    header, encoded = image_data.split(',', 1)
                else:
                    encoded = image_data

                import uuid
                filename = f"img_{uuid.uuid4().hex}.jpg"
                filepath = os.path.join(IMAGES_DIR, filename)

                with open(filepath, "wb") as f:
                    f.write(base64.b64decode(encoded))

                self._set_api_headers()
                self.wfile.write(json.dumps({
                    "success": True, 
                    "url": f"/imagens/{filename}",
                    "path": filename
                }).encode())
            except Exception as e:
                logger.error(f"Error uploading image: {e}")
                self._set_api_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode())
            return

        if self.path == '/api/backup/settings':
            data = json.loads(post_data.decode('utf-8'))
            if DB_AVAILABLE and DB_MANAGER is not None:
                success = DB_MANAGER.save_backup_settings(data)
                if success:
                    self._set_api_headers()
                    self.wfile.write(json.dumps({"success": True}).encode())
                else:
                    self._set_api_headers(500)
                    self.wfile.write(json.dumps({"error": "Failed to save settings"}).encode())
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "Database not available"}).encode())
            return
        
        self._set_api_headers(404)
        self.wfile.write(json.dumps({"error": "Not found"}).encode())
    
    def _handle_api_delete(self):
        if self.path.startswith('/api/client/'):
            cpf = self.path.split('/')[-1]
            if use_sqlite_storage():
                clients = DB_MANAGER.get_all_clientes()
                client = next((c for c in clients if c['cpf'] == cpf), None)
                if client:
                    success = DB_MANAGER.delete_cliente(client['id'])
                    if success:
                        DB_MANAGER.add_pending_sync('cliente', 'delete', {'id': client['id']})
                        self._set_api_headers()
                        self.wfile.write(json.dumps({"success": True}).encode())
                    else:
                        self._set_api_headers(500)
                        self.wfile.write(json.dumps({"error": "Failed to delete client"}).encode())
                else:
                    self._set_api_headers(404)
                    self.wfile.write(json.dumps({"error": "Client not found"}).encode())
            else:
                self._delete_client_file(cpf)
            return
        
        if self.path.startswith('/api/registro/'):
            registro_id = self.path.split('/')[-1]
            if use_sqlite_storage():
                success = DB_MANAGER.delete_registro(registro_id)
                if success:
                    self._set_api_headers()
                    self.wfile.write(json.dumps({"success": True}).encode())
                else:
                    self._set_api_headers(404)
                    self.wfile.write(json.dumps({"error": "Registro not found"}).encode())
            else:
                self._set_api_headers()
                self.wfile.write(json.dumps({"success": True}).encode())
            return
        
        # ========== BACKUP DELETE ENDPOINT ==========
        if self.path.startswith('/api/backup/'):
            filename = self.path.split('/')[-1]
            if DB_AVAILABLE and DB_MANAGER is not None:
                success = DB_MANAGER.delete_backup(filename)
                if success:
                    self._set_api_headers()
                    self.wfile.write(json.dumps({"success": True}).encode())
                else:
                    self._set_api_headers(404)
                    self.wfile.write(json.dumps({"error": "Backup not found"}).encode())
            else:
                self._set_api_headers(503)
                self.wfile.write(json.dumps({"error": "Database not available"}).encode())
            return
        
        self._set_api_headers(404)
        self.wfile.write(json.dumps({"error": "Not found"}).encode())
    
    def _get_all_clients_files(self):
        """Retorna todos os clientes de arquivos JSON"""
        try:
            clients = []
            if os.path.exists(CLIENTS_DIR):
                for filename in os.listdir(CLIENTS_DIR):
                    if filename.endswith('.json'):
                        filepath = os.path.join(CLIENTS_DIR, filename)
                        try:
                            with open(filepath, 'r', encoding='utf-8') as f:
                                clients.append(json.load(f))
                        except Exception as e:
                            logger.error(f"Erro ao ler {filename}: {e}")
            
            self._set_api_headers()
            self.wfile.write(json.dumps(clients, ensure_ascii=False).encode('utf-8'))
        except Exception as e:
            logger.error(f"Erro em _get_all_clients_files: {e}")
            self._set_api_headers(500)
            self.wfile.write(json.dumps({"error": "Internal server error"}).encode())
    
    def _get_client_file(self, cpf):
        """Retorna um cliente específico por CPF"""
        cpf_clean = cpf.replace('.', '').replace('-', '')
        filepath = os.path.join(CLIENTS_DIR, f"{cpf_clean}.json")
        
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                client = json.load(f)
            self._set_api_headers()
            self.wfile.write(json.dumps(client, ensure_ascii=False).encode('utf-8'))
        else:
            self._set_api_headers(404)
            self.wfile.write(json.dumps({"error": "Client not found"}).encode())
    
    def _save_client_file(self, client):
        """Salva cliente em arquivo JSON"""
        cpf_clean = client['cpf'].replace('.', '').replace('-', '')
        filepath = os.path.join(CLIENTS_DIR, f"{cpf_clean}.json")
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(client, f, ensure_ascii=False, indent=2)
        
        self._set_api_headers()
        self.wfile.write(json.dumps({"success": True, "cpf": cpf_clean}).encode())
    
    def _delete_client_file(self, cpf):
        """Deleta um cliente por arquivo"""
        cpf_clean = cpf.replace('.', '').replace('-', '')
        filepath = os.path.join(CLIENTS_DIR, f"{cpf_clean}.json")
        
        if os.path.exists(filepath):
            os.remove(filepath)
            self._set_api_headers()
            self.wfile.write(json.dumps({"success": True}).encode())
        else:
            self._set_api_headers(404)
            self.wfile.write(json.dumps({"error": "Client not found"}).encode())
    
    def _get_all_registros_files(self):
        """Retorna todos os registros de arquivos"""
        registros = []
        
        if os.path.exists(REGISTROS_DIR):
            for year in os.listdir(REGISTROS_DIR):
                year_path = os.path.join(REGISTROS_DIR, year)
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
                                filepath = os.path.join(day_path, filename)
                                try:
                                    with open(filepath, 'r', encoding='utf-8') as f:
                                        registros.append(json.load(f))
                                except Exception as e:
                                    logger.error(f"Erro ao ler registro {filepath}: {e}")
        
        self._set_api_headers()
        self.wfile.write(json.dumps(registros, ensure_ascii=False).encode('utf-8'))
    
    def _save_registro_file(self, registro):
        """Salva um registro em arquivo"""
        from datetime import datetime
        entrada = datetime.fromisoformat(registro['dataHoraEntrada'].replace('Z', '+00:00'))
        year = str(entrada.year)
        month = str(entrada.month).zfill(2)
        day = str(entrada.day).zfill(2)
        
        dir_path = os.path.join(REGISTROS_DIR, year, month, day)
        os.makedirs(dir_path, exist_ok=True)
        
        filepath = os.path.join(dir_path, f"{registro['id']}.json")
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(registro, f, ensure_ascii=False, indent=2)
        
        self._set_api_headers()
        self.wfile.write(json.dumps({"success": True, "id": registro['id']}).encode())
    
    def log_message(self, format, *args):
        """Log de requisições HTTP"""
        logger.info("%s - %s" % (self.address_string(), format % args))


def check_automatic_backup():
    """Verifica e executa backup automático se necessário"""
    if DB_AVAILABLE and DB_MANAGER is not None:
        try:
            result = DB_MANAGER.check_automatic_backup()
            if result and result.get('success'):
                logger.info(f"✅ Backup automático realizado: {result.get('filename')}")
        except Exception as e:
            logger.error(f"Erro ao verificar backup automático: {e}")


if __name__ == "__main__":
    try:
        socketserver.TCPServer.allow_reuse_address = True
        with socketserver.TCPServer(("0.0.0.0", PORT), CombinedHTTPHandler) as httpd:
            logger.info(f"🚀 Servidor BICICLETÁRIO (v2.0 Config) rodando em http://0.0.0.0:{PORT}/")
            logger.info(f"API integrada em http://0.0.0.0:{PORT}/api/")
            logger.info(f"Diretório servido: {os.path.abspath(DIRECTORY)}")
            logger.info(f"Dados serão salvos em: {os.path.abspath('dados')}/")
            if DB_AVAILABLE:
                logger.info("✅ Usando banco de dados SQLite para armazenamento")
                # Verificar backup automático na inicialização
                check_automatic_backup()
            else:
                logger.info("📁 Usando sistema de arquivos para armazenamento")
            logger.info("Pressione Ctrl+C para parar o servidor")
            httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("\nServidor interrompido pelo usuário")
    except Exception as e:
        logger.error(f"Erro ao iniciar servidor: {e}", exc_info=True)
