#!/usr/bin/env python3
"""
Sistema de Gerenciamento de Tokens JWT
Fornece geração e validação de tokens JWT para autenticação segura
"""
import os
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Tenta importar PyJWT
try:
    import jwt
    JWT_AVAILABLE = True
except ImportError:
    JWT_AVAILABLE = False
    logger.warning("PyJWT não disponível, usando sistema de tokens simples")


class JWTManager:
    """Gerenciador de tokens JWT para autenticação"""
    
    def __init__(self, secret_key: Optional[str] = None, token_expiry_hours: int = 24):
        """
        Inicializa o gerenciador de JWT
        
        Args:
            secret_key: Chave secreta para assinar tokens. Se None, gera automaticamente
            token_expiry_hours: Tempo de expiração dos tokens em horas
        """
        self.token_expiry_hours = token_expiry_hours
        self.secret_key = secret_key or self._get_or_create_secret()
        
    def _get_or_create_secret(self) -> str:
        """Obtém ou cria uma chave secreta"""
        secret_file = 'dados/auth/.jwt_secret'
        
        # Cria diretório se não existe
        os.makedirs(os.path.dirname(secret_file), exist_ok=True)
        
        if os.path.exists(secret_file):
            with open(secret_file, 'r') as f:
                return f.read().strip()
        
        # Gera nova chave secreta
        import secrets
        secret = secrets.token_urlsafe(64)
        
        with open(secret_file, 'w') as f:
            f.write(secret)
        
        # Protege o arquivo
        os.chmod(secret_file, 0o600)
        logger.info("✅ Nova chave secreta JWT gerada")
        
        return secret
    
    def generate_token(self, user_data: Dict[str, Any]) -> str:
        """
        Gera um token JWT para um usuário
        
        Args:
            user_data: Dados do usuário (deve conter 'username' e 'tipo')
            
        Returns:
            Token JWT assinado
        """
        if not JWT_AVAILABLE:
            # Fallback simples sem JWT
            import hashlib
            import time
            token_data = {
                'username': user_data.get('username'),
                'tipo': user_data.get('tipo'),
                'timestamp': int(time.time())
            }
            token_str = json.dumps(token_data)
            return hashlib.sha256(token_str.encode()).hexdigest()
        
        # Cria payload do token
        expiration = datetime.utcnow() + timedelta(hours=self.token_expiry_hours)
        payload = {
            'username': user_data.get('username'),
            'nome': user_data.get('nome'),
            'tipo': user_data.get('tipo'),
            'exp': expiration,
            'iat': datetime.utcnow()
        }
        
        # Gera token
        token = jwt.encode(payload, self.secret_key, algorithm='HS256')
        logger.info(f"Token gerado para usuário: {user_data.get('username')}")
        
        return token
    
    def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Valida um token JWT
        
        Args:
            token: Token JWT a ser validado
            
        Returns:
            Dados do usuário se válido, None caso contrário
        """
        if not JWT_AVAILABLE:
            # Sem validação real no fallback
            logger.warning("JWT não disponível, token não pode ser validado adequadamente")
            return None
        
        try:
            # Decodifica e valida token
            payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
            logger.info(f"Token validado para usuário: {payload.get('username')}")
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token expirado")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Token inválido: {e}")
            return None
    
    def generate_qr_token(self, station_id: str = "default") -> str:
        """
        Gera um token especial para QR codes de estações
        
        Args:
            station_id: ID da estação/terminal
            
        Returns:
            Token único para o QR code
        """
        if not JWT_AVAILABLE:
            import hashlib
            import time
            token_data = f"{station_id}:{int(time.time())}"
            return hashlib.sha256(token_data.encode()).hexdigest()[:16]
        
        # Token de longa duração para QR codes de estação
        expiration = datetime.utcnow() + timedelta(days=365)
        payload = {
            'type': 'qr_station',
            'station_id': station_id,
            'exp': expiration,
            'iat': datetime.utcnow()
        }
        
        token = jwt.encode(payload, self.secret_key, algorithm='HS256')
        logger.info(f"Token QR gerado para estação: {station_id}")
        
        return token
    
    def validate_qr_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Valida um token de QR code
        
        Args:
            token: Token do QR code
            
        Returns:
            Dados da estação se válido, None caso contrário
        """
        if not JWT_AVAILABLE:
            # Aceita qualquer token no fallback
            return {'station_id': 'default', 'type': 'qr_station'}
        
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
            if payload.get('type') == 'qr_station':
                return payload
            return None
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return None


# Singleton instance
_jwt_manager = None

def get_jwt_manager() -> JWTManager:
    """Retorna a instância singleton do JWTManager"""
    global _jwt_manager
    if _jwt_manager is None:
        _jwt_manager = JWTManager()
    return _jwt_manager


if __name__ == '__main__':
    # Teste básico
    jwt_mgr = get_jwt_manager()
    print("✅ Sistema JWT inicializado")
    
    # Testa geração de token
    user = {'username': 'test', 'nome': 'Test User', 'tipo': 'admin'}
    token = jwt_mgr.generate_token(user)
    print(f"Token gerado: {token[:20]}...")
    
    # Testa validação
    validated = jwt_mgr.validate_token(token)
    if validated:
        print(f"✅ Token válido: {validated['username']}")
    
    # Testa token QR
    qr_token = jwt_mgr.generate_qr_token("station1")
    print(f"Token QR gerado: {qr_token[:20]}...")
