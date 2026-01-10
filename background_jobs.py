import threading
import time
import uuid
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional, Callable
import logging

logger = logging.getLogger(__name__)

class JobStatus:
    PENDING = 'pending'
    RUNNING = 'running'
    COMPLETED = 'completed'
    FAILED = 'failed'

class BackgroundJobManager:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.jobs: Dict[str, Dict[str, Any]] = {}
        self.changes: Dict[str, int] = {
            'clients': 0,
            'registros': 0,
            'usuarios': 0,
            'categorias': 0
        }
        self._jobs_lock = threading.Lock()
        self._changes_lock = threading.Lock()
    
    def create_job(self, job_type: str, total_items: int, metadata: Optional[Dict] = None) -> str:
        job_id = str(uuid.uuid4())
        with self._jobs_lock:
            self.jobs[job_id] = {
                'id': job_id,
                'type': job_type,
                'status': JobStatus.PENDING,
                'progress': 0,
                'current': 0,
                'total': total_items,
                'message': 'Aguardando início...',
                'created_at': datetime.now().isoformat(),
                'started_at': None,
                'completed_at': None,
                'error': None,
                'metadata': metadata or {},
                'result': None
            }
        return job_id
    
    def start_job(self, job_id: str, message: str = 'Processando...'):
        with self._jobs_lock:
            if job_id in self.jobs:
                self.jobs[job_id]['status'] = JobStatus.RUNNING
                self.jobs[job_id]['started_at'] = datetime.now().isoformat()
                self.jobs[job_id]['message'] = message
    
    def update_progress(self, job_id: str, current: int, message: Optional[str] = None):
        with self._jobs_lock:
            if job_id in self.jobs:
                job = self.jobs[job_id]
                job['current'] = current
                job['progress'] = int((current / job['total']) * 100) if job['total'] > 0 else 0
                if message:
                    job['message'] = message
    
    def complete_job(self, job_id: str, result: Optional[Dict] = None, message: str = 'Concluído com sucesso!'):
        with self._jobs_lock:
            if job_id in self.jobs:
                self.jobs[job_id]['status'] = JobStatus.COMPLETED
                self.jobs[job_id]['completed_at'] = datetime.now().isoformat()
                self.jobs[job_id]['progress'] = 100
                self.jobs[job_id]['current'] = self.jobs[job_id]['total']
                self.jobs[job_id]['message'] = message
                self.jobs[job_id]['result'] = result
    
    def fail_job(self, job_id: str, error: str):
        with self._jobs_lock:
            if job_id in self.jobs:
                self.jobs[job_id]['status'] = JobStatus.FAILED
                self.jobs[job_id]['completed_at'] = datetime.now().isoformat()
                self.jobs[job_id]['error'] = error
                self.jobs[job_id]['message'] = f'Erro: {error}'
    
    def get_job(self, job_id: str) -> Optional[Dict]:
        with self._jobs_lock:
            return self.jobs.get(job_id, None)
    
    def get_active_jobs(self) -> list:
        with self._jobs_lock:
            return [
                job for job in self.jobs.values() 
                if job['status'] in [JobStatus.PENDING, JobStatus.RUNNING]
            ]
    
    def get_recent_jobs(self, limit: int = 10) -> list:
        with self._jobs_lock:
            sorted_jobs = sorted(
                self.jobs.values(), 
                key=lambda x: x['created_at'], 
                reverse=True
            )
            return sorted_jobs[:limit]
    
    def cleanup_old_jobs(self, max_age_hours: int = 24):
        cutoff = datetime.now().timestamp() - (max_age_hours * 3600)
        with self._jobs_lock:
            to_remove = []
            for job_id, job in self.jobs.items():
                if job['status'] in [JobStatus.COMPLETED, JobStatus.FAILED]:
                    created = datetime.fromisoformat(job['created_at']).timestamp()
                    if created < cutoff:
                        to_remove.append(job_id)
            for job_id in to_remove:
                del self.jobs[job_id]
    
    def notify_change(self, change_type: str):
        with self._changes_lock:
            if change_type in self.changes:
                self.changes[change_type] += 1
    
    def get_changes(self) -> Dict[str, int]:
        with self._changes_lock:
            return self.changes.copy()
    
    def get_changes_since(self, last_known: Dict[str, int]) -> Dict[str, bool]:
        current = self.get_changes()
        return {
            key: current.get(key, 0) > last_known.get(key, 0)
            for key in current
        }

def get_job_manager() -> BackgroundJobManager:
    return BackgroundJobManager()


class ImportWorker:
    def __init__(self, db_manager, storage_dir: str):
        self.db_manager = db_manager
        self.storage_dir = storage_dir
        self.job_manager = get_job_manager()
    
    def import_clients_async(self, clients: list, storage_mode: str = 'sqlite') -> str:
        total = len(clients)
        job_id = self.job_manager.create_job('import_clients', total, {
            'storage_mode': storage_mode
        })
        
        thread = threading.Thread(
            target=self._import_clients_worker,
            args=(job_id, clients, storage_mode)
        )
        thread.daemon = True
        thread.start()
        
        return job_id
    
    def _import_clients_worker(self, job_id: str, clients: list, storage_mode: str):
        try:
            self.job_manager.start_job(job_id, 'Importando clientes...')
            
            for i, client in enumerate(clients):
                if storage_mode == 'sqlite' and self.db_manager:
                    self.db_manager.save_cliente(client)
                else:
                    self._save_client_json(client)
                
                self.job_manager.update_progress(
                    job_id, i + 1, 
                    f'Salvando cliente {i + 1} de {len(clients)}...'
                )
                time.sleep(0.01)
            
            self.job_manager.complete_job(job_id, {
                'imported': len(clients)
            }, f'{len(clients)} cliente(s) importado(s) com sucesso!')
            
            self.job_manager.notify_change('clients')
            
        except Exception as e:
            logger.error(f"Erro na importação de clientes: {e}")
            self.job_manager.fail_job(job_id, str(e))
    
    def import_registros_async(self, registros: list, storage_mode: str = 'sqlite') -> str:
        total = len(registros)
        job_id = self.job_manager.create_job('import_registros', total, {
            'storage_mode': storage_mode
        })
        
        thread = threading.Thread(
            target=self._import_registros_worker,
            args=(job_id, registros, storage_mode)
        )
        thread.daemon = True
        thread.start()
        
        return job_id
    
    def _import_registros_worker(self, job_id: str, registros: list, storage_mode: str):
        try:
            self.job_manager.start_job(job_id, 'Importando registros...')
            
            for i, registro in enumerate(registros):
                if storage_mode == 'sqlite' and self.db_manager:
                    self.db_manager.save_registro(registro)
                else:
                    self._save_registro_json(registro)
                
                self.job_manager.update_progress(
                    job_id, i + 1,
                    f'Salvando registro {i + 1} de {len(registros)}...'
                )
                time.sleep(0.01)
            
            self.job_manager.complete_job(job_id, {
                'imported': len(registros)
            }, f'{len(registros)} registro(s) importado(s) com sucesso!')
            
            self.job_manager.notify_change('registros')
            
        except Exception as e:
            logger.error(f"Erro na importação de registros: {e}")
            self.job_manager.fail_job(job_id, str(e))
    
    def import_system_backup_async(self, data: Dict, storage_mode: str = 'sqlite') -> str:
        clients = data.get('clients', [])
        registros = data.get('registros', [])
        usuarios = data.get('usuarios', [])
        categorias = data.get('categorias', {})
        
        total = len(clients) + len(registros) + len(usuarios) + (1 if categorias else 0)
        
        job_id = self.job_manager.create_job('import_system_backup', total, {
            'storage_mode': storage_mode,
            'clients_count': len(clients),
            'registros_count': len(registros),
            'usuarios_count': len(usuarios),
            'has_categorias': bool(categorias)
        })
        
        thread = threading.Thread(
            target=self._import_system_backup_worker,
            args=(job_id, data, storage_mode)
        )
        thread.daemon = True
        thread.start()
        
        return job_id
    
    def _import_system_backup_worker(self, job_id: str, data: Dict, storage_mode: str):
        try:
            self.job_manager.start_job(job_id, 'Iniciando importação do backup...')
            
            clients = data.get('clients', [])
            registros = data.get('registros', [])
            usuarios = data.get('usuarios', [])
            categorias = data.get('categorias', {})
            
            current = 0
            total = len(clients) + len(registros) + len(usuarios) + (1 if categorias else 0)
            
            for i, client in enumerate(clients):
                if storage_mode == 'sqlite' and self.db_manager:
                    self.db_manager.save_cliente(client)
                else:
                    self._save_client_json(client)
                current += 1
                self.job_manager.update_progress(
                    job_id, current,
                    f'Salvando cliente {i + 1} de {len(clients)}...'
                )
                time.sleep(0.005)
            
            for i, registro in enumerate(registros):
                if storage_mode == 'sqlite' and self.db_manager:
                    self.db_manager.save_registro(registro)
                else:
                    self._save_registro_json(registro)
                current += 1
                self.job_manager.update_progress(
                    job_id, current,
                    f'Salvando registro {i + 1} de {len(registros)}...'
                )
                time.sleep(0.005)
            
            for i, usuario in enumerate(usuarios):
                current += 1
                self.job_manager.update_progress(
                    job_id, current,
                    f'Salvando usuário {i + 1} de {len(usuarios)}...'
                )
                time.sleep(0.01)
            
            if categorias:
                if storage_mode == 'sqlite' and self.db_manager:
                    self.db_manager.save_categorias(categorias)
                current += 1
                self.job_manager.update_progress(job_id, current, 'Salvando categorias...')
            
            self.job_manager.complete_job(job_id, {
                'clients_imported': len(clients),
                'registros_imported': len(registros),
                'usuarios_imported': len(usuarios),
                'categorias_imported': len(categorias) if categorias else 0
            }, f'Backup importado: {len(clients)} clientes, {len(registros)} registros, {len(usuarios)} usuários!')
            
            self.job_manager.notify_change('clients')
            self.job_manager.notify_change('registros')
            self.job_manager.notify_change('usuarios')
            if categorias:
                self.job_manager.notify_change('categorias')
            
        except Exception as e:
            logger.error(f"Erro na importação do backup: {e}")
            self.job_manager.fail_job(job_id, str(e))
    
    def _save_client_json(self, client: Dict):
        clients_dir = os.path.join(self.storage_dir, 'clientes')
        os.makedirs(clients_dir, exist_ok=True)
        
        cpf = client.get('cpf', '').replace('.', '').replace('-', '')
        if cpf:
            filepath = os.path.join(clients_dir, f'{cpf}.json')
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(client, f, ensure_ascii=False, indent=2)
    
    def _save_registro_json(self, registro: Dict):
        registros_dir = os.path.join(self.storage_dir, 'registros')
        os.makedirs(registros_dir, exist_ok=True)
        
        data = registro.get('data', 'sem_data')
        filepath = os.path.join(registros_dir, f'{data}.json')
        
        existing = []
        if os.path.exists(filepath):
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    existing = json.load(f)
            except:
                existing = []
        
        existing = [r for r in existing if r.get('id') != registro.get('id')]
        existing.append(registro)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(existing, f, ensure_ascii=False, indent=2)


def get_import_worker(db_manager, storage_dir: str) -> ImportWorker:
    return ImportWorker(db_manager, storage_dir)
