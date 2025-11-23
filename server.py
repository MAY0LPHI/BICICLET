#!/usr/bin/env python3
import http.server
import socketserver
import os
import threading

PORT = 5000
DIRECTORY = "."

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Headers para evitar cache
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def run_storage_api():
    """Inicia a API de armazenamento em arquivos em background"""
    try:
        from storage_api import run_storage_api
        run_storage_api(port=5001)
    except Exception as e:
        print(f"Nota: API de armazenamento não iniciada: {e}")
        print("A aplicação funcionará normalmente usando localStorage")

if __name__ == "__main__":
    # Iniciar API de armazenamento em thread separada
    api_thread = threading.Thread(target=run_storage_api, daemon=True)
    api_thread.start()
    
    # Iniciar servidor web principal com reutilização de porta
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", PORT), MyHTTPRequestHandler) as httpd:
        print(f"Servidor web rodando em http://0.0.0.0:{PORT}/")
        print(f"API de armazenamento em arquivos em http://localhost:5001/")
        print(f"Os dados serão salvos na pasta: {os.path.abspath('dados')}/")
        httpd.serve_forever()
