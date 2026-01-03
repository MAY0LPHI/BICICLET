#!/usr/bin/env python3
"""
Sistema de Gerenciamento de Bicicletário - Servidor Web
Servidor HTTP com headers de segurança e suporte a API de armazenamento
"""
import http.server
import socketserver
import os
import threading
import logging

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

PORT = 5000
DIRECTORY = "."

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """
    Handler HTTP customizado com headers de segurança
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        """Adiciona headers de segurança e controle de cache"""
        # Headers para evitar cache
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        
        # Security headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('X-XSS-Protection', '1; mode=block')
        self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
        
        # Content Security Policy
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' http://localhost:5001"
        )
        self.send_header('Content-Security-Policy', csp)
        
        super().end_headers()
    
    def log_message(self, format, *args):
        """Log de requisições HTTP"""
        logger.info("%s - %s" % (self.address_string(), format % args))

def run_storage_api():
    """Inicia a API de armazenamento offline com SQLite em background"""
    try:
        # Tenta usar a API offline aprimorada
        from offline_storage_api import run_offline_storage_api
        logger.info("Iniciando API de armazenamento offline em http://localhost:5001/")
        run_offline_storage_api(port=5001)
    except Exception as e:
        logger.warning(f"API offline não disponível, usando fallback: {e}")
        try:
            # Fallback para API original
            from storage_api import run_storage_api as run_original
            logger.info("Usando API de armazenamento em arquivos")
            run_original(port=5001)
        except Exception as e2:
            logger.warning(f"API de armazenamento não iniciada: {e2}")
            logger.info("A aplicação funcionará normalmente usando localStorage")

if __name__ == "__main__":
    try:
        # Iniciar API de armazenamento em thread separada
        api_thread = threading.Thread(target=run_storage_api, daemon=True)
        api_thread.start()
        
        # Iniciar servidor web principal com reutilização de porta
        socketserver.TCPServer.allow_reuse_address = True
        with socketserver.TCPServer(("0.0.0.0", PORT), MyHTTPRequestHandler) as httpd:
            logger.info(f"Servidor web rodando em http://0.0.0.0:{PORT}/")
            logger.info(f"Diretório servido: {os.path.abspath(DIRECTORY)}")
            logger.info(f"Dados serão salvos em: {os.path.abspath('dados')}/")
            logger.info("Pressione Ctrl+C para parar o servidor")
            httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("\nServidor interrompido pelo usuário")
    except Exception as e:
        logger.error(f"Erro ao iniciar servidor: {e}", exc_info=True)
