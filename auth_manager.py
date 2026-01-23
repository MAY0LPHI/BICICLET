#!/usr/bin/env python3
"""
Sistema de Autenticação Offline com Criptografia
Suporta autenticação local com bcrypt/argon2 e criptografia AES
"""
import os
import json
import base64
import hashlib
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timedelta

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Tenta importar bcrypt e cryptography
try:
    import bcrypt
    BCRYPT_AVAILABLE = True
except ImportError:
    BCRYPT_AVAILABLE = False
    logger.warning("bcrypt não disponível, usando SHA-256")

try:
    from cryptography.fernet import Fernet
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False
    logger.warning("cryptography não disponível, criptografia desabilitada")


class OfflineAuthManager:
    """Gerenciador de autenticação offline com criptografia"""
    
    def __init__(self, data_dir: str = "dados/auth"):
        self.data_dir = data_dir
        self.users_file = os.path.join(data_dir, "users.json")
        self.tokens_file = os.path.join(data_dir, "tokens.json")
        self.key_file = os.path.join(data_dir, ".key")
        
        self._ensure_directories()
        self._load_or_create_key()
        self._init_default_users()
    
    def _ensure_directories(self):
        """Cria os diretórios necessários"""
        try:
            os.makedirs(self.data_dir, exist_ok=True)
            logger.info(f"Diretório de autenticação criado/verificado: {self.data_dir}")
        except Exception as e:
            logger.error(f"Erro ao criar diretório: {e}")
    
    def _load_or_create_key(self):
        """Carrega ou cria uma chave de criptografia"""
        if not CRYPTO_AVAILABLE:
            self.cipher = None
            return
        
        try:
            if os.path.exists(self.key_file):
                with open(self.key_file, 'rb') as f:
                    key = f.read()
            else:
                # Gera nova chave
                key = Fernet.generate_key()
                with open(self.key_file, 'wb') as f:
                    f.write(key)
                # Protege o arquivo
                os.chmod(self.key_file, 0o600)
            
            self.cipher = Fernet(key)
            logger.info("✅ Chave de criptografia carregada")
        except Exception as e:
            logger.error(f"Erro ao carregar chave de criptografia: {e}")
            self.cipher = None
    
    def _hash_password(self, password: str) -> str:
        """Gera hash da senha usando bcrypt ou SHA-256"""
        if BCRYPT_AVAILABLE:
            # Usa bcrypt (mais seguro)
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
            return hashed.decode('utf-8')
        else:
            # Fallback para SHA-256 com salt
            salt = os.urandom(32)
            key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
            return base64.b64encode(salt + key).decode('utf-8')
    
    def hash_password_public(self, password: str) -> str:
        """Método público para hash de senha"""
        return self._hash_password(password)
    
    def _verify_password(self, password: str, hashed: str) -> bool:
        """Verifica a senha contra o hash"""
        try:
            if BCRYPT_AVAILABLE and hashed.startswith('$2'):
                # Verifica com bcrypt
                return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
            else:
                # Verifica com SHA-256
                decoded = base64.b64decode(hashed.encode('utf-8'))
                salt = decoded[:32]
                stored_key = decoded[32:]
                key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
                return key == stored_key
        except Exception as e:
            logger.error(f"Erro ao verificar senha: {e}")
            return False
    
    def _encrypt_data(self, data: str) -> str:
        """Criptografa dados usando AES"""
        if not self.cipher:
            return data
        
        try:
            encrypted = self.cipher.encrypt(data.encode('utf-8'))
            return base64.b64encode(encrypted).decode('utf-8')
        except Exception as e:
            logger.error(f"Erro ao criptografar dados: {e}")
            return data
    
    def _decrypt_data(self, encrypted_data: str) -> str:
        """Descriptografa dados"""
        if not self.cipher:
            return encrypted_data
        
        try:
            encrypted = base64.b64decode(encrypted_data.encode('utf-8'))
            decrypted = self.cipher.decrypt(encrypted)
            return decrypted.decode('utf-8')
        except Exception as e:
            logger.error(f"Erro ao descriptografar dados: {e}")
            return encrypted_data
    
    def _load_users(self) -> Dict[str, Any]:
        """Carrega usuários do arquivo"""
        if not os.path.exists(self.users_file):
            return {}
        
        try:
            with open(self.users_file, 'r', encoding='utf-8') as f:
                content = f.read()
                # Verifica se é conteúdo criptografado usando marcador específico
                # Formato: ENCRYPTED:<base64_data>
                if self.cipher and content.startswith('ENCRYPTED:'):
                    encrypted_content = content[10:]  # Remove 'ENCRYPTED:' prefix
                    content = self._decrypt_data(encrypted_content)
                return json.loads(content)
        except Exception as e:
            logger.error(f"Erro ao carregar usuários: {e}")
            return {}
    
    def _save_users(self, users: Dict[str, Any]):
        """Salva usuários no arquivo"""
        try:
            content = json.dumps(users, ensure_ascii=False, indent=2)
            # Criptografa se disponível e adiciona marcador
            if self.cipher:
                encrypted = self._encrypt_data(content)
                content = f'ENCRYPTED:{encrypted}'
            
            with open(self.users_file, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # Protege o arquivo
            os.chmod(self.users_file, 0o600)
        except Exception as e:
            logger.error(f"Erro ao salvar usuários: {e}")
    
    def _init_default_users(self):
        """Inicializa usuários padrão"""
        users = self._load_users()
        
        if not users:
            # Cria usuários padrão
            default_users = {
                'admin': {
                    'username': 'admin',
                    'password': self._hash_password('admin123'),
                    'nome': 'Administrador',
                    'tipo': 'admin',
                    'ativo': True,
                    'criado_em': datetime.now().isoformat()
                },
                'CELO123': {
                    'username': 'CELO123',
                    'password': self._hash_password('CELO123'),
                    'nome': 'CELO - Dono do Sistema',
                    'tipo': 'dono',
                    'ativo': True,
                    'criado_em': datetime.now().isoformat()
                }
            }
            self._save_users(default_users)
            logger.info("✅ Usuários padrão criados")
    
    def authenticate(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """Autentica um usuário offline"""
        users = self._load_users()
        
        if username not in users:
            logger.warning(f"Tentativa de login com usuário inválido: {username}")
            return None
        
        user = users[username]
        
        if not user.get('ativo', True):
            logger.warning(f"Tentativa de login com usuário inativo: {username}")
            return None
        
        if not self._verify_password(password, user['password']):
            logger.warning(f"Senha incorreta para usuário: {username}")
            return None
        
        # Autenticação bem-sucedida
        logger.info(f"✅ Usuário autenticado: {username}")
        
        # Gera token de sessão
        token = self._generate_token(username)
        
        # Remove senha da resposta
        user_data = {k: v for k, v in user.items() if k != 'password'}
        user_data['token'] = token
        
        return user_data
    
    def _generate_token(self, username: str) -> str:
        """Gera um token de sessão"""
        token_data = {
            'username': username,
            'timestamp': datetime.now().isoformat(),
            'expires': (datetime.now() + timedelta(days=7)).isoformat()
        }
        
        # Salva token
        tokens = self._load_tokens()
        token_id = hashlib.sha256(json.dumps(token_data).encode()).hexdigest()
        tokens[token_id] = token_data
        self._save_tokens(tokens)
        
        return token_id
    
    def _load_tokens(self) -> Dict[str, Any]:
        """Carrega tokens do arquivo"""
        if not os.path.exists(self.tokens_file):
            return {}
        
        try:
            with open(self.tokens_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Erro ao carregar tokens: {e}")
            return {}
    
    def _save_tokens(self, tokens: Dict[str, Any]):
        """Salva tokens no arquivo"""
        try:
            with open(self.tokens_file, 'w', encoding='utf-8') as f:
                json.dump(tokens, f, ensure_ascii=False, indent=2)
            os.chmod(self.tokens_file, 0o600)
        except Exception as e:
            logger.error(f"Erro ao salvar tokens: {e}")
    
    def validate_token(self, token: str) -> Optional[str]:
        """Valida um token de sessão"""
        tokens = self._load_tokens()
        
        if token not in tokens:
            return None
        
        token_data = tokens[token]
        expires = datetime.fromisoformat(token_data['expires'])
        
        if datetime.now() > expires:
            # Token expirado
            del tokens[token]
            self._save_tokens(tokens)
            return None
        
        return token_data['username']
    
    def create_user(self, username: str, password: str, nome: str, tipo: str = 'funcionario') -> bool:
        """Cria um novo usuário"""
        users = self._load_users()
        
        if username in users:
            logger.warning(f"Tentativa de criar usuário duplicado: {username}")
            return False
        
        users[username] = {
            'username': username,
            'password': self._hash_password(password),
            'nome': nome,
            'tipo': tipo,
            'ativo': True,
            'criado_em': datetime.now().isoformat()
        }
        
        self._save_users(users)
        logger.info(f"✅ Novo usuário criado: {username}")
        return True
    
    def change_password(self, username: str, old_password: str, new_password: str) -> bool:
        """Altera a senha de um usuário"""
        users = self._load_users()
        
        if username not in users:
            return False
        
        user = users[username]
        
        if not self._verify_password(old_password, user['password']):
            return False
        
        user['password'] = self._hash_password(new_password)
        user['senha_alterada_em'] = datetime.now().isoformat()
        
        self._save_users(users)
        logger.info(f"✅ Senha alterada para usuário: {username}")
        return True
    
    def get_all_users(self) -> list:
        """Retorna todos os usuários (sem senhas)"""
        users = self._load_users()
        return [
            {k: v for k, v in user.items() if k != 'password'}
            for user in users.values()
        ]


# Singleton instance
_auth_manager = None

def get_auth_manager() -> OfflineAuthManager:
    """Retorna a instância singleton do OfflineAuthManager"""
    global _auth_manager
    if _auth_manager is None:
        _auth_manager = OfflineAuthManager()
    return _auth_manager


if __name__ == '__main__':
    # Teste básico
    auth = get_auth_manager()
    print("✅ Sistema de autenticação inicializado")
    
    # Testa autenticação
    user = auth.authenticate('admin', 'admin123')
    if user:
        print(f"✅ Login bem-sucedido: {user['username']}")
        print(f"Token: {user['token']}")
    else:
        print("❌ Falha no login")
