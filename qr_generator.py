#!/usr/bin/env python3
"""
Sistema de Geração de QR Codes
Gera QR codes para acesso ao sistema via estações/terminais
"""
import os
import io
import base64
import logging
from typing import Optional

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Tenta importar qrcode
try:
    import qrcode
    from PIL import Image
    QRCODE_AVAILABLE = True
except ImportError:
    QRCODE_AVAILABLE = False
    logger.warning("qrcode/Pillow não disponível, QR codes desabilitados")


class QRCodeGenerator:
    """Gerador de QR codes para o sistema"""
    
    def __init__(self, base_url: str = "http://localhost:5000"):
        """
        Inicializa o gerador de QR codes
        
        Args:
            base_url: URL base do sistema (onde o QR code irá direcionar)
        """
        self.base_url = base_url.rstrip('/')
        self.qr_dir = 'dados/qrcodes'
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Cria os diretórios necessários"""
        try:
            os.makedirs(self.qr_dir, exist_ok=True)
            logger.info(f"Diretório de QR codes criado/verificado: {self.qr_dir}")
        except Exception as e:
            logger.error(f"Erro ao criar diretório: {e}")
    
    def generate_login_qr(self, station_id: str = "default", token: Optional[str] = None) -> Optional[str]:
        """
        Gera QR code para login/cadastro em uma estação
        
        Args:
            station_id: ID da estação/terminal
            token: Token opcional para incluir na URL
            
        Returns:
            Caminho do arquivo QR code gerado ou None se falhar
        """
        if not QRCODE_AVAILABLE:
            logger.warning("QR code não disponível")
            return None
        
        # Constrói a URL
        url = f"{self.base_url}/login.html"
        if token:
            url += f"?station={station_id}&token={token}"
        else:
            url += f"?station={station_id}"
        
        try:
            # Cria QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(url)
            qr.make(fit=True)
            
            # Cria imagem
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Salva arquivo
            filename = f"qr_login_{station_id}.png"
            filepath = os.path.join(self.qr_dir, filename)
            img.save(filepath)
            
            logger.info(f"✅ QR code gerado: {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Erro ao gerar QR code: {e}")
            return None
    
    def generate_qr_base64(self, station_id: str = "default", token: Optional[str] = None) -> Optional[str]:
        """
        Gera QR code e retorna como string base64 para uso em HTML
        
        Args:
            station_id: ID da estação/terminal
            token: Token opcional para incluir na URL
            
        Returns:
            String base64 da imagem QR code
        """
        if not QRCODE_AVAILABLE:
            logger.warning("QR code não disponível")
            return None
        
        # Constrói a URL
        url = f"{self.base_url}/login.html"
        if token:
            url += f"?station={station_id}&token={token}"
        else:
            url += f"?station={station_id}"
        
        try:
            # Cria QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(url)
            qr.make(fit=True)
            
            # Cria imagem
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Converte para base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_str = base64.b64encode(buffer.getvalue()).decode()
            
            logger.info(f"✅ QR code gerado (base64) para estação: {station_id}")
            return f"data:image/png;base64,{img_str}"
        except Exception as e:
            logger.error(f"Erro ao gerar QR code base64: {e}")
            return None
    
    def generate_checkin_qr(self, user_id: str, token: str) -> Optional[str]:
        """
        Gera QR code para check-in rápido de um usuário específico
        
        Args:
            user_id: ID do usuário
            token: Token de autenticação do usuário
            
        Returns:
            String base64 da imagem QR code
        """
        if not QRCODE_AVAILABLE:
            logger.warning("QR code não disponível")
            return None
        
        # URL para check-in automático
        url = f"{self.base_url}/checkin.html?user={user_id}&token={token}"
        
        try:
            # Cria QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_M,
                box_size=10,
                border=4,
            )
            qr.add_data(url)
            qr.make(fit=True)
            
            # Cria imagem
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Converte para base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_str = base64.b64encode(buffer.getvalue()).decode()
            
            logger.info(f"✅ QR code de check-in gerado para usuário: {user_id}")
            return f"data:image/png;base64,{img_str}"
        except Exception as e:
            logger.error(f"Erro ao gerar QR code de check-in: {e}")
            return None


# Singleton instance
_qr_generator = None

def get_qr_generator(base_url: str = "http://localhost:5000") -> QRCodeGenerator:
    """Retorna a instância singleton do QRCodeGenerator"""
    global _qr_generator
    if _qr_generator is None:
        _qr_generator = QRCodeGenerator(base_url)
    return _qr_generator


if __name__ == '__main__':
    # Teste básico
    qr_gen = get_qr_generator()
    print("✅ Sistema de QR codes inicializado")
    
    # Testa geração de QR
    filepath = qr_gen.generate_login_qr("station1", "test-token")
    if filepath:
        print(f"✅ QR code salvo: {filepath}")
    
    # Testa geração base64
    qr_base64 = qr_gen.generate_qr_base64("station1")
    if qr_base64:
        print(f"✅ QR code base64 gerado: {qr_base64[:50]}...")
