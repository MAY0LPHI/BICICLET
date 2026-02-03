import os
import logging
from db_manager import DatabaseManager

# Configura logging para mostrar no console
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("VERIFY")

# Simula ambiente de nuvem
print("--- TESTE: Simulando ambiente Cloud ---")
os.environ['DATABASE_URL'] = 'postgresql://user:pass@localhost:5432/db'

# Tenta inicializar. Como não temos postgres real, deve falhar no connect e cair pro SQLite
# O importante é ver o log de erro do Postgres, provando que ele TENTOU usar.
try:
    db = DatabaseManager()
    print("DatabaseManager instanciado.")
    # Se caiu pro SQLite (fallback), o arquivo deve existir
    print(f"Modo atual: {db.get_storage_mode()}")
except Exception as e:
    print(f"Erro fatal: {e}")

print("\n--- TESTE: Verificando server.py use_sqlite_storage ---")
import server
if server.use_sqlite_storage():
    print("OK: server.use_sqlite_storage() retornou True com DATABASE_URL definido.")
else:
    print("FAIL: server.use_sqlite_storage() falhou em detectar DATABASE_URL.")
