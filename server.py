#!/usr/bin/env python3
"""
Sistema de Gerenciamento de Bicicletário - Servidor Web
Servidor HTTP com headers de segurança e suporte a API de armazenamento integrada
"""
import http.server
import socketserver
import os
import json
import threading
import time
import logging
import base64
from datetime import datetime
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
SOLICITACOES_FILE = os.path.join(STORAGE_DIR, "solicitacoes.json")
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
BACKGROUND_JOBS_AVAILABLE = True

try:
    from background_jobs import get_job_manager, get_import_worker
    JOB_MANAGER = get_job_manager()
    IMPORT_WORKER = get_import_worker(DB_MANAGER, STORAGE_DIR)
    logger.info("✅ Sistema de jobs em segundo plano carregado")
except ImportError as e:
    BACKGROUND_JOBS_AVAILABLE = False
    logger.warning(f"Sistema de jobs não disponível: {e}")
except Exception as e:
    BACKGROUND_JOBS_AVAILABLE = False
    logger.warning(f"Erro ao inicializar sistema de jobs: {e}")

def use_sqlite_storage() -> bool:
    """Verifica se deve usar SQLite/Banco de Dados baseado na configuração atual"""
    # Se configurado para nuvem (PostgreSQL), sempre usa banco de dados
    if os.environ.get('DATABASE_URL'):
        return True
        
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
    
    def _load_solicitacoes(self):
        if os.path.exists(SOLICITACOES_FILE):
            try:
                with open(SOLICITACOES_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Erro ao carregar solicitações: {e}")
                return []
        return []

    def _save_solicitacoes(self, solicitacoes):
        try:
            with open(SOLICITACOES_FILE, 'w', encoding='utf-8') as f:
                json.dump(solicitacoes, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"Erro ao salvar solicitações: {e}")
            return False

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
            if not self._check_auth(parsed_path.path):
                return
            self._handle_api_get(parsed_path)
        else:
            super().do_GET()
    
    def do_POST(self):
        if self.path.startswith('/api/'):
            if not self._check_auth(self.path):
                return
            self._handle_api_post()
        else:
            self.send_error(404, "Not Found")
    
    def do_DELETE(self):
        if self.path.startswith('/api/'):
            if not self._check_auth(self.path):
                return
            self._handle_api_delete()
        else:
            self.send_error(404, "Not Found")
    
    def _check_auth(self, path):
        """Verifica se a requisição tem permissão para prosseguir"""
        # Endpoints públicos (não precisam de token)
        public_endpoints = ['/api/login', '/api/health']
        if path in public_endpoints or path.startswith('/api/mobile/'):
            return True
            
        # Se não tiver auth manager, permite tudo (modo inseguro/legado)
        if not AUTH_AVAILABLE:
            return True
            
        # Verifica header Authorization
        auth_header = self.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            self._set_api_headers(401)
            self.wfile.write(json.dumps({"error": "Token de autenticação ausente ou inválido"}).encode())
            return False
            
        token = auth_header.split(' ')[1]
        username = get_auth_manager().validate_token(token)
        
        if not username:
            self._set_api_headers(401)
            self.wfile.write(json.dumps({"error": "Token expirado ou inválido"}).encode())
            return False
            
        return True

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

        if path == '/api/solicitacoes':
            solicitacoes = self._load_solicitacoes()
            self._set_api_headers()
            self.wfile.write(json.dumps(solicitacoes).encode())
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
        
        if path == '/api/solicitacoes':
            if os.path.exists(SOLICITACOES_FILE):
                try:
                    with open(SOLICITACOES_FILE, 'r', encoding='utf-8') as f:
                        solicitacoes = json.load(f)
                    self._set_api_headers()
                    self.wfile.write(json.dumps(solicitacoes, ensure_ascii=False).encode('utf-8'))
                except Exception as e:
                    logger.error(f"Erro ao ler solicitacoes: {e}")
                    self._set_api_headers(500)
                    self.wfile.write(json.dumps({"error": "Failed to read solicitacoes"}).encode())
            else:
                self._set_api_headers()
                self.wfile.write(json.dumps([]).encode())
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
        
        # Endpoint de Identificação Mobile (Público)
        if self.path == '/api/mobile/identify':
            try:
                data = json.loads(post_data.decode('utf-8'))
                cpf = data.get('cpf', '').strip()
                
                if not cpf:
                    self._set_api_headers(400)
                    self.wfile.write(json.dumps({"error": "CPF obrigatório"}).encode())
                    return

                # Busca cliente (limita dados retornados por segurança)
                if use_sqlite_storage():
                    clients = DB_MANAGER.get_all_clientes()
                else:
                    clients = self._load_clients_from_files()

                # Normaliza CPF para busca
                cpf_clean = ''.join(filter(str.isdigit, cpf))
                
                client = None
                for c in clients:
                    c_cpf_clean = ''.join(filter(str.isdigit, c.get('cpf', '')))
                    if c_cpf_clean == cpf_clean:
                        client = c
                        break
                
                if client:
                    # Retorna apenas dados necessários
                    safe_client = {
                        'id': client['id'],
                        'nome': client['nome'],
                        'cpf': client['cpf'], # Retorna formatado como está no banco
                        'bicicletas': client.get('bicicletas', []),
                        'ativo': client.get('ativo', True)
                    }
                    self._set_api_headers(200)
                    self.wfile.write(json.dumps({"found": True, "client": safe_client}, ensure_ascii=False).encode('utf-8'))
                else:
                    self._set_api_headers(200) # 200 OK mas found=False
                    self.wfile.write(json.dumps({"found": False}).encode())
            except Exception as e:
                logger.error(f"Erro na identificação mobile: {e}")
                self._set_api_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode())
            return

        # Endpoint de Solicitação Mobile (Público)
        if self.path == '/api/mobile/request':
            try:
                data = json.loads(post_data.decode('utf-8'))
                
                # Validação básica
                if not data.get('clientId') or not data.get('bikeId'):
                    self._set_api_headers(400)
                    self.wfile.write(json.dumps({"error": "Dados incompletos"}).encode())
                    return

                # Carrega solicitações existentes
                solicitacoes = []
                if os.path.exists(SOLICITACOES_FILE):
                    try:
                        with open(SOLICITACOES_FILE, 'r', encoding='utf-8') as f:
                            solicitacoes = json.load(f)
                    except:
                        solicitacoes = []

                # Adiciona nova solicitação
                data['id'] = str(uuid.uuid4())
                data['timestamp'] = datetime.now().isoformat()
                data['status'] = 'pendente'
                data['origem'] = 'mobile'
                
                solicitacoes.append(data)
                
                # Salva
                with open(SOLICITACOES_FILE, 'w', encoding='utf-8') as f:
                    json.dump(solicitacoes, f, ensure_ascii=False, indent=2)
                
                self._set_api_headers(200)
                self.wfile.write(json.dumps({"success": True, "id": data['id']}).encode())
                
            except Exception as e:
                logger.error(f"Erro na solicitação mobile: {e}")
                self._set_api_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode())
            return

        # Endpoint de Login (Público, verificado no _check_auth)
        if self.path == '/api/login':
            try:
                data = json.loads(post_data.decode('utf-8'))
                username = data.get('username')
                password = data.get('password')
                
                if not username or not password:
                    self._set_api_headers(400)
                    self.wfile.write(json.dumps({"error": "Usuário e senha obrigatórios"}).encode())
                    return

                if AUTH_AVAILABLE:
                    user_data = get_auth_manager().authenticate(username, password)
                    if user_data:
                        self._set_api_headers(200)
                        self.wfile.write(json.dumps({"success": True, "user": user_data}).encode())
                    else:
                        self._set_api_headers(401)
                        self.wfile.write(json.dumps({"success": False, "message": "Usuário ou senha incorretos"}).encode())
                else:
                    self._set_api_headers(500)
                    self.wfile.write(json.dumps({"error": "Sistema de autenticação indisponível"}).encode())
            except Exception as e:
                logger.error(f"Erro no login: {e}")
                self._set_api_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode())
            return

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
        
        # Endpoint para atualizar status de solicitação
        if self.path == '/api/solicitacoes/update':
            try:
                data = json.loads(post_data.decode('utf-8'))
                req_id = data.get('id')
                new_status = data.get('status')
                
                if not req_id or not new_status:
                    self._set_api_headers(400)
                    self.wfile.write(json.dumps({"error": "ID e Status obrigatórios"}).encode())
                    return

                if os.path.exists(SOLICITACOES_FILE):
                    with open(SOLICITACOES_FILE, 'r', encoding='utf-8') as f:
                        solicitacoes = json.load(f)
                    
                    updated = False
                    for req in solicitacoes:
                        if req.get('id') == req_id:
                            req['status'] = new_status
                            req['updated_at'] = datetime.now().isoformat()
                            if 'processor' in data:
                                req['processor'] = data['processor']
                            updated = True
                            break
                    
                    if updated:
                        with open(SOLICITACOES_FILE, 'w', encoding='utf-8') as f:
                            json.dump(solicitacoes, f, ensure_ascii=False, indent=2)
                        
                        self._set_api_headers(200)
                        self.wfile.write(json.dumps({"success": True}).encode())
                    else:
                        self._set_api_headers(404)
                        self.wfile.write(json.dumps({"error": "Solicitação não encontrada"}).encode())
                else:
                    self._set_api_headers(404)
                    self.wfile.write(json.dumps({"error": "Arquivo de solicitações não encontrado"}).encode())
            except Exception as e:
                logger.error(f"Erro ao atualizar solicitação: {e}")
                self._set_api_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode())
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
        
            return

        if self.path == '/api/solicitacoes':
            try:
                data = json.loads(post_data.decode('utf-8'))
                
                # Basic validation
                if not data.get('clientId') or not data.get('bikeId'):
                    self._set_api_headers(400)
                    self.wfile.write(json.dumps({"error": "Missing required fields"}).encode())
                    return

                solicitacoes = self._load_solicitacoes()
                
                # Add ID and timestamp if missing
                import uuid
                new_solicitacao = {
                    "id": str(uuid.uuid4()),
                    "clientId": data.get('clientId'),
                    "bikeId": data.get('bikeId'),
                    "tipo": data.get('tipo', 'entrada'),
                    "timestamp": data.get('timestamp') or datetime.now().isoformat()
                }
                
                solicitacoes.append(new_solicitacao)
                self._save_solicitacoes(solicitacoes)

                self._set_api_headers(201)
                self.wfile.write(json.dumps({"success": True, "id": new_solicitacao["id"]}).encode())
                
            except Exception as e:
                logger.error(f"Error creating solicitacao: {e}")
                self._set_api_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode())
            return

            return

        if self.path == '/api/mobile/register-client':
            try:
                data = json.loads(post_data.decode('utf-8'))
                
                # Check if client exists
                cpf = data.get('cpf')
                
                # Manual file check to be safe
                cpf_clean = cpf.replace('.', '').replace('-', '')
                filepath = os.path.join(CLIENTS_DIR, f"{cpf_clean}.json")
                if os.path.exists(filepath):
                    self._set_api_headers(400)
                    self.wfile.write(json.dumps({"error": "CPF já cadastrado"}).encode())
                    return

                # Create Client Object
                import uuid
                new_client = {
                    "id": str(uuid.uuid4()),
                    "nome": data.get('nome').upper(), # Ensure uppercase backend side too
                    "cpf": cpf,
                    "telefone": data.get('telefone', ''),
                    "bicicletas": [],
                    "ativo": True,
                    "dataCadastro": datetime.now().isoformat()
                }

                # Save to file manually
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(new_client, f, ensure_ascii=False, indent=2)
                
                if JOB_MANAGER:
                    JOB_MANAGER.notify_change('clients')

                self._set_api_headers(201)
                self.wfile.write(json.dumps({"success": True, "client": new_client}).encode())

            except Exception as e:
                logger.error(f"Error registering client: {e}")
                self._set_api_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode())
            return

        if self.path == '/api/mobile/bike/add':
            try:
                data = json.loads(post_data.decode('utf-8'))
                client_id = data.get('clientId')
                bike_data = data.get('bike')

                if not client_id or not bike_data:
                    self._set_api_headers(400)
                    self.wfile.write(json.dumps({"error": "Dados incompletos"}).encode())
                    return

                # Find Client (Need to search all files if we don't have the filename/cpf)
                # But typically we can optimize. For now, scan dir since we don't have DB_MANAGER active for sure.
                # Actually, iterate and find by ID.
                
                target_file = None
                client = None

                if os.path.exists(CLIENTS_DIR):
                    for filename in os.listdir(CLIENTS_DIR):
                        if filename.endswith('.json'):
                            try:
                                fp = os.path.join(CLIENTS_DIR, filename)
                                with open(fp, 'r', encoding='utf-8') as f:
                                    c = json.load(f)
                                    if c.get('id') == client_id:
                                        client = c
                                        target_file = fp
                                        break
                            except:
                                continue
                
                if not client:
                    self._set_api_headers(404)
                    self.wfile.write(json.dumps({"error": "Cliente não encontrado"}).encode())
                    return

                # Handle Photo
                photo_data = bike_data.get('photo')
                photo_url = ''
                if photo_data:
                    if ',' in photo_data:
                        _, encoded = photo_data.split(',', 1)
                    else:
                        encoded = photo_data
                    
                    import uuid
                    filename = f"bike_{uuid.uuid4().hex}.jpg"
                    img_path = os.path.join(IMAGES_DIR, filename)
                    with open(img_path, "wb") as f:
                        f.write(base64.b64decode(encoded))
                    photo_url = f"/imagens/{filename}"

                # Add Bike
                import uuid
                new_bike = {
                    "id": str(uuid.uuid4()),
                    "marca": bike_data.get('marca').upper(),
                    "modelo": bike_data.get('modelo').upper(),
                    "cor": bike_data.get('cor').upper(),
                    "foto": photo_url
                }
                
                if 'bicicletas' not in client:
                    client['bicicletas'] = []
                
                client['bicicletas'].append(new_bike)

                # Save updated client
                with open(target_file, 'w', encoding='utf-8') as f:
                    json.dump(client, f, ensure_ascii=False, indent=2)

                if JOB_MANAGER:
                    JOB_MANAGER.notify_change('clients')

                self._set_api_headers(200)
                self.wfile.write(json.dumps({"success": True, "client": client}).encode())

            except Exception as e:
                logger.error(f"Error adding bike: {e}")
                self._set_api_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode())
            return

        if self.path == '/api/solicitacoes/process':
            try:
                data = json.loads(post_data.decode('utf-8'))
                solicitacao_id = data.get('id')
                action = data.get('action') # 'approve' or 'reject'

                solicitacoes = self._load_solicitacoes()
                
                # Remove from list regardless of action (approve handles logic on frontend/backend, reject just removes)
                # In a real app, backend would do the create record logic too if approved to be safe.
                # For now, frontend calls create_registro, backend just removes request.
                # Wait, the JS 'approve' calls createRegistroInternal? No, handleSolicitacaoAction does.
                # Actually, JS 'approve' calls internal create then calls this endpoint to remove.
                # So here we just remove.
                
                new_solicitacoes = [s for s in solicitacoes if s['id'] != solicitacao_id]
                self._save_solicitacoes(new_solicitacoes)

                self._set_api_headers()
                self.wfile.write(json.dumps({"success": True}).encode())
                
            except Exception as e:
                logger.error(f"Error processing solicitacao: {e}")
                self._set_api_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode())
            return
        
        if self.path == '/api/mobile/identify':
            try:
                data = json.loads(post_data.decode('utf-8'))
                cpf = data.get('cpf')
                
                # Always reload from disk in this debug context to ensure we see the new bike
                files_found = []
                if os.path.exists(CLIENTS_DIR):
                    for filename in os.listdir(CLIENTS_DIR):
                        if filename.endswith('.json'):
                            try:
                                with open(os.path.join(CLIENTS_DIR, filename), 'r', encoding='utf-8') as f:
                                    client = json.load(f)
                                    if client.get('cpf') == cpf:
                                        found_client = client
                                        break
                            except:
                                continue
                
                # Fallback to DB_MANAGER if not found via direct file (e.g. if using SQLite)
                if not found_client and use_sqlite_storage():
                     clients = DB_MANAGER.get_all_clientes()
                     found_client = next((c for c in clients if c['cpf'] == cpf), None)
                
                if found_client:
                    self._set_api_headers()
                    self.wfile.write(json.dumps({"success": True, "client": found_client}, ensure_ascii=False).encode('utf-8'))
                else:
                    self._set_api_headers() # Return 200 OK so frontend parses the error message
                    self.wfile.write(json.dumps({"success": False, "error": "Client not found"}).encode())
            except Exception as e:
                logger.error(f"Error in identify: {e}")
                self._set_api_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode())
            return

        if self.path == '/api/solicitacoes':
            solicitacao = json.loads(post_data.decode('utf-8'))
            if not solicitacao.get('id'):
                import uuid
                solicitacao['id'] = str(uuid.uuid4())
            
            try:
                solicitacoes = []
                if os.path.exists(SOLICITACOES_FILE):
                    with open(SOLICITACOES_FILE, 'r', encoding='utf-8') as f:
                        solicitacoes = json.load(f)
                
                solicitacoes.append(solicitacao)
                
                with open(SOLICITACOES_FILE, 'w', encoding='utf-8') as f:
                    json.dump(solicitacoes, f, ensure_ascii=False, indent=2)
                
                self._set_api_headers()
                self.wfile.write(json.dumps({"success": True}).encode())
            except Exception as e:
                logger.error(f"Erro ao salvar solicitacao: {e}")
                self._set_api_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode())
            return
            
        if self.path == '/api/solicitacoes/process':
            data = json.loads(post_data.decode('utf-8'))
            solicitacao_id = data.get('id')
            action = data.get('action') # 'approve' or 'reject'
            
            try:
                solicitacoes = []
                if os.path.exists(SOLICITACOES_FILE):
                    with open(SOLICITACOES_FILE, 'r', encoding='utf-8') as f:
                        solicitacoes = json.load(f)
                
                # Filter out the processed solicitation
                new_solicitacoes = [s for s in solicitacoes if s['id'] != solicitacao_id]
                
                with open(SOLICITACOES_FILE, 'w', encoding='utf-8') as f:
                    json.dump(new_solicitacoes, f, ensure_ascii=False, indent=2)
                
                self._set_api_headers()
                self.wfile.write(json.dumps({"success": True}).encode())
            except Exception as e:
                logger.error(f"Erro ao processar solicitacao: {e}")
                self._set_api_headers(500)
                self.wfile.write(json.dumps({"error": str(e)}).encode())
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

def run_scheduler():
    """Executa verificações periódicas em segundo plano"""
    logger.info("⏰ Agendador de tarefas iniciado (Verificação a cada 10 min)")
    while True:
        time.sleep(600)  # 10 minutos
        try:
            check_automatic_backup()
        except Exception as e:
            logger.error(f"Erro no agendador: {e}")


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
                
                # Iniciar agendador em segundo plano
                scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
                scheduler_thread.start()
            else:
                logger.info("📁 Usando sistema de arquivos para armazenamento")
            logger.info("Pressione Ctrl+C para parar o servidor")
            httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("\nServidor interrompido pelo usuário")
    except Exception as e:
        logger.error(f"Erro ao iniciar servidor: {e}", exc_info=True)
