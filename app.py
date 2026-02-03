#!/usr/bin/env python3
"""
Flask Application Wrapper para Deployment
Wrapper do servidor HTTP existente para compatibilidade com Gunicorn/WSGI
"""
import os
import sys
from pathlib import Path

# Carrega variáveis de ambiente
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Configurações de ambiente
ENVIRONMENT = os.getenv('ENVIRONMENT', 'local')
PORT = int(os.getenv('PORT', 5000))
DEBUG = os.getenv('DEBUG', 'false').lower() == 'true'

print(f"🚀 Iniciando em ambiente: {ENVIRONMENT}")
print(f"📡 Porta configurada: {PORT}")

# Para desenvolvimento local, usa o servidor HTTP original
if ENVIRONMENT == 'local' and __name__ == '__main__':
    print("💻 Modo de desenvolvimento - usando servidor HTTP nativo")
    import server
    # O server.py já tem sua própria lógica de inicialização
    
# Para produção (Render/Discloud), cria app Flask
else:
    from flask import Flask, request, jsonify, send_from_directory, send_file
    from flask_cors import CORS
    import json
    import logging
    from datetime import datetime
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    logger = logging.getLogger(__name__)
    
    # Importa gerenciadores
    try:
        from db_manager import get_db_manager
        DB_MANAGER = get_db_manager()
        logger.info("✅ DatabaseManager carregado com sucesso")
    except Exception as e:
        logger.error(f"❌ Erro ao carregar DatabaseManager: {e}")
        DB_MANAGER = None
    
    try:
        from background_jobs import get_job_manager, get_import_worker
        JOB_MANAGER = get_job_manager()
        STORAGE_DIR = "dados/navegador"
        IMPORT_WORKER = get_import_worker(DB_MANAGER, STORAGE_DIR)
        logger.info("✅ Sistema de jobs carregado")
    except Exception as e:
        logger.warning(f"⚠️ Sistema de jobs não disponível: {e}")
        JOB_MANAGER = None
        IMPORT_WORKER = None
    
    # Cria aplicação Flask
    app = Flask(__name__, static_folder='.')
    CORS(app)
    
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max upload
    
    # ==================== ROTAS ESTÁTICAS ====================
    
    @app.route('/')
    def index():
        """Serve a página inicial"""
        return send_file('index.html')
    
    @app.route('/login.html')
    def login():
        return send_file('login.html')
    
    @app.route('/dashboard.html')
    def dashboard():
        return send_file('dashboard.html')
    
    @app.route('/mobile-access.html')
    def mobile_access():
        return send_file('mobile-access.html')
    
    @app.route('/admin-qr.html')
    def admin_qr():
        return send_file('admin-qr.html')
    
    @app.route('/<path:path>')
    def static_files(path):
        """Serve arquivos estáticos"""
        return send_from_directory('.', path)
    
    # ==================== API ENDPOINTS ====================
    
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check para plataformas de hospedagem"""
        db_type = "postgresql" if os.getenv('DATABASE_URL') else "sqlite"
        return jsonify({
            "status": "ok",
            "environment": ENVIRONMENT,
            "database_type": db_type,
            "database_available": DB_MANAGER is not None,
            "timestamp": datetime.now().isoformat()
        })
    
    @app.route('/api/clients', methods=['GET'])
    def get_clients():
        """Retorna todos os clientes"""
        if DB_MANAGER:
            clients = DB_MANAGER.get_all_clientes()
            return jsonify(clients)
        return jsonify([])
    
    @app.route('/api/client', methods=['POST'])
    def save_client():
        """Salva um cliente"""
        if DB_MANAGER:
            client = request.json
            success = DB_MANAGER.save_cliente(client)
            if success:
                return jsonify({"success": True, "cpf": client.get('cpf')})
        return jsonify({"success": False, "error": "Database not available"}), 500
    
    @app.route('/api/client/<cpf>', methods=['GET'])
    def get_client(cpf):
        """Retorna um cliente específico"""
        if DB_MANAGER:
            clients = DB_MANAGER.get_all_clientes()
            client = next((c for c in clients if c['cpf'] == cpf), None)
            if client:
                return jsonify(client)
        return jsonify({"error": "Client not found"}), 404
    
    @app.route('/api/registros', methods=['GET'])
    def get_registros():
        """Retorna todos os registros"""
        if DB_MANAGER:
            registros = DB_MANAGER.get_all_registros()
            return jsonify(registros)
        return jsonify([])
    
    @app.route('/api/registro', methods=['POST'])
    def save_registro():
        """Salva um registro"""
        if DB_MANAGER:
            registro = request.json
            success = DB_MANAGER.save_registro(registro)
            if success:
                return jsonify({"success": True, "id": registro.get('id')})
        return jsonify({"success": False, "error": "Database not available"}), 500
    
    @app.route('/api/audit', methods=['GET'])
    def get_audit():
        """Retorna logs de auditoria"""
        if DB_MANAGER:
            logs = DB_MANAGER.get_audit_logs(100)
            return jsonify(logs)
        return jsonify([])
    
    @app.route('/api/audit', methods=['POST'])
    def save_audit():
        """Registra log de auditoria"""
        if DB_MANAGER:
            data = request.json
            success = DB_MANAGER.log_audit(
                data.get('usuario'),
                data.get('acao'),
                data.get('detalhes')
            )
            return jsonify({"success": success})
        return jsonify({"success": False}), 500
    
    @app.route('/api/storage-mode', methods=['GET'])
    def get_storage_mode():
        """Retorna estatísticas de armazenamento"""
        if DB_MANAGER:
            stats = DB_MANAGER.get_storage_stats()
            return jsonify(stats)
        return jsonify({
            'current_mode': 'unknown',
            'db_available': False
        })
    
    # Tratamento de erros
    @app.errorhandler(404)
    def not_found(e):
        if request.path.startswith('/api/'):
            return jsonify({"error": "Not found"}), 404
        return send_file('index.html')
    
    @app.errorhandler(500)
    def internal_error(e):
        logger.error(f"Internal error: {e}")
        return jsonify({"error": "Internal server error"}), 500
    
    # Ponto de entrada para Gunicorn
    if __name__ == '__main__':
        app.run(host='0.0.0.0', port=PORT, debug=DEBUG)
