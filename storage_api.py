#!/usr/bin/env python3
"""
API de armazenamento em arquivos para a versão web
Similar ao sistema usado na versão desktop Electron
"""
import os
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse
import threading

STORAGE_DIR = "dados/navegador"
CLIENTS_DIR = os.path.join(STORAGE_DIR, "clientes")
REGISTROS_DIR = os.path.join(STORAGE_DIR, "registros")

def ensure_directories():
    """Cria as pastas necessárias se não existirem"""
    os.makedirs(CLIENTS_DIR, exist_ok=True)
    os.makedirs(REGISTROS_DIR, exist_ok=True)

class StorageAPIHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200, content_type='application/json'):
        self.send_response(status)
        self.send_header('Content-type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers()

    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/clients':
            self.get_all_clients()
        elif parsed_path.path.startswith('/api/client/'):
            cpf = parsed_path.path.split('/')[-1]
            self.get_client(cpf)
        elif parsed_path.path == '/api/registros':
            self.get_all_registros()
        elif parsed_path.path == '/api/health':
            self._set_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode())
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode())

    def do_POST(self):
        if self.path == '/api/client':
            self.save_client()
        elif self.path == '/api/registro':
            self.save_registro()
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode())

    def do_DELETE(self):
        if self.path.startswith('/api/client/'):
            cpf = self.path.split('/')[-1]
            self.delete_client(cpf)
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode())

    def get_all_clients(self):
        """Retorna todos os clientes"""
        clients = []
        if os.path.exists(CLIENTS_DIR):
            for filename in os.listdir(CLIENTS_DIR):
                if filename.endswith('.json'):
                    filepath = os.path.join(CLIENTS_DIR, filename)
                    with open(filepath, 'r', encoding='utf-8') as f:
                        clients.append(json.load(f))
        
        self._set_headers()
        self.wfile.write(json.dumps(clients, ensure_ascii=False).encode('utf-8'))

    def get_client(self, cpf):
        """Retorna um cliente específico por CPF"""
        cpf_clean = cpf.replace('.', '').replace('-', '')
        filepath = os.path.join(CLIENTS_DIR, f"{cpf_clean}.json")
        
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                client = json.load(f)
            self._set_headers()
            self.wfile.write(json.dumps(client, ensure_ascii=False).encode('utf-8'))
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Client not found"}).encode())

    def save_client(self):
        """Salva ou atualiza um cliente"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        client = json.loads(post_data.decode('utf-8'))
        
        cpf_clean = client['cpf'].replace('.', '').replace('-', '')
        filepath = os.path.join(CLIENTS_DIR, f"{cpf_clean}.json")
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(client, f, ensure_ascii=False, indent=2)
        
        self._set_headers()
        self.wfile.write(json.dumps({"success": True, "cpf": cpf_clean}).encode())

    def delete_client(self, cpf):
        """Deleta um cliente"""
        cpf_clean = cpf.replace('.', '').replace('-', '')
        filepath = os.path.join(CLIENTS_DIR, f"{cpf_clean}.json")
        
        if os.path.exists(filepath):
            os.remove(filepath)
            self._set_headers()
            self.wfile.write(json.dumps({"success": True}).encode())
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Client not found"}).encode())

    def get_all_registros(self):
        """Retorna todos os registros organizados"""
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
                                with open(filepath, 'r', encoding='utf-8') as f:
                                    registros.append(json.load(f))
        
        self._set_headers()
        self.wfile.write(json.dumps(registros, ensure_ascii=False).encode('utf-8'))

    def save_registro(self):
        """Salva um registro de entrada/saída"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        registro = json.loads(post_data.decode('utf-8'))
        
        # Organizar por data: ano/mes/dia
        from datetime import datetime
        entrada = datetime.fromisoformat(registro['dataHoraEntrada'].replace('Z', '+00:00'))
        year = str(entrada.year)
        month = str(entrada.month).zfill(2)
        day = str(entrada.day).zfill(2)
        
        # Criar estrutura de pastas
        dir_path = os.path.join(REGISTROS_DIR, year, month, day)
        os.makedirs(dir_path, exist_ok=True)
        
        # Salvar com ID do registro
        filepath = os.path.join(dir_path, f"{registro['id']}.json")
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(registro, f, ensure_ascii=False, indent=2)
        
        self._set_headers()
        self.wfile.write(json.dumps({"success": True, "id": registro['id']}).encode())

    def log_message(self, format, *args):
        """Silencia logs HTTP padrão para evitar poluição"""
        pass

def run_storage_api(port=5001):
    """Inicia o servidor da API de armazenamento"""
    ensure_directories()
    server = HTTPServer(('localhost', port), StorageAPIHandler)
    print(f'Storage API rodando em http://localhost:{port}/')
    print(f'Dados salvos em: {os.path.abspath(STORAGE_DIR)}/')
    server.serve_forever()

if __name__ == '__main__':
    run_storage_api()
