#!/usr/bin/env python3
"""
Utilitário de Exportação de Logs e Relatórios Offline
Gera arquivos .csv, .txt e .pdf para auditoria offline
"""
import os
import csv
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Diretórios
LOGS_DIR = "dados/logs"
REPORTS_DIR = "dados/relatorios"


class LogExporter:
    """Exportador de logs e relatórios offline"""
    
    def __init__(self):
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Cria os diretórios necessários"""
        try:
            os.makedirs(LOGS_DIR, exist_ok=True)
            os.makedirs(REPORTS_DIR, exist_ok=True)
            logger.info(f"Diretórios criados/verificados: {LOGS_DIR}, {REPORTS_DIR}")
        except Exception as e:
            logger.error(f"Erro ao criar diretórios: {e}")
    
    def export_audit_log_csv(self, audit_logs: List[Dict[str, Any]], filename: Optional[str] = None) -> str:
        """Exporta logs de auditoria para CSV"""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"auditoria_{timestamp}.csv"
        
        filepath = os.path.join(LOGS_DIR, filename)
        
        try:
            with open(filepath, 'w', newline='', encoding='utf-8') as f:
                if not audit_logs:
                    f.write("Nenhum log de auditoria disponível\n")
                    return filepath
                
                # Define campos
                fieldnames = ['id', 'usuario', 'acao', 'detalhes', 'timestamp']
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                
                # Escreve cabeçalho
                writer.writeheader()
                
                # Escreve dados
                for log in audit_logs:
                    writer.writerow({
                        'id': log.get('id', ''),
                        'usuario': log.get('usuario', ''),
                        'acao': log.get('acao', ''),
                        'detalhes': log.get('detalhes', ''),
                        'timestamp': log.get('timestamp', '')
                    })
            
            logger.info(f"✅ Log de auditoria exportado para CSV: {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Erro ao exportar log de auditoria: {e}", exc_info=True)
            return None
    
    def export_audit_log_txt(self, audit_logs: List[Dict[str, Any]], filename: Optional[str] = None) -> str:
        """Exporta logs de auditoria para TXT"""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"auditoria_{timestamp}.txt"
        
        filepath = os.path.join(LOGS_DIR, filename)
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write("=" * 80 + "\n")
                f.write("RELATÓRIO DE AUDITORIA - SISTEMA BICICLETÁRIO\n")
                f.write("=" * 80 + "\n\n")
                f.write(f"Data de Geração: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n")
                f.write(f"Total de Registros: {len(audit_logs)}\n")
                f.write("=" * 80 + "\n\n")
                
                if not audit_logs:
                    f.write("Nenhum log de auditoria disponível.\n")
                    return filepath
                
                for i, log in enumerate(audit_logs, 1):
                    f.write(f"Registro #{i}\n")
                    f.write("-" * 40 + "\n")
                    f.write(f"ID: {log.get('id', 'N/A')}\n")
                    f.write(f"Usuário: {log.get('usuario', 'N/A')}\n")
                    f.write(f"Ação: {log.get('acao', 'N/A')}\n")
                    f.write(f"Detalhes: {log.get('detalhes', 'N/A')}\n")
                    f.write(f"Timestamp: {log.get('timestamp', 'N/A')}\n")
                    f.write("\n")
            
            logger.info(f"✅ Log de auditoria exportado para TXT: {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Erro ao exportar log de auditoria: {e}", exc_info=True)
            return None
    
    def export_clients_report_csv(self, clients: List[Dict[str, Any]], filename: Optional[str] = None) -> str:
        """Exporta relatório de clientes para CSV"""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"clientes_{timestamp}.csv"
        
        filepath = os.path.join(REPORTS_DIR, filename)
        
        try:
            with open(filepath, 'w', newline='', encoding='utf-8') as f:
                if not clients:
                    f.write("Nenhum cliente cadastrado\n")
                    return filepath
                
                # Define campos
                fieldnames = ['id', 'nome', 'cpf', 'telefone', 'categoria', 'ativo', 
                             'total_bicicletas', 'data_cadastro']
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                
                # Escreve cabeçalho
                writer.writeheader()
                
                # Escreve dados
                for client in clients:
                    bicicletas = client.get('bicicletas', [])
                    writer.writerow({
                        'id': client.get('id', ''),
                        'nome': client.get('nome', ''),
                        'cpf': client.get('cpf', ''),
                        'telefone': client.get('telefone', ''),
                        'categoria': client.get('categoria', ''),
                        'ativo': 'Sim' if client.get('ativo', True) else 'Não',
                        'total_bicicletas': len(bicicletas),
                        'data_cadastro': client.get('data_cadastro', client.get('criado_em', ''))
                    })
            
            logger.info(f"✅ Relatório de clientes exportado para CSV: {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Erro ao exportar relatório de clientes: {e}", exc_info=True)
            return None
    
    def export_registros_report_csv(self, registros: List[Dict[str, Any]], filename: Optional[str] = None) -> str:
        """Exporta relatório de registros para CSV"""
        if not filename:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"registros_{timestamp}.csv"
        
        filepath = os.path.join(REPORTS_DIR, filename)
        
        try:
            with open(filepath, 'w', newline='', encoding='utf-8') as f:
                if not registros:
                    f.write("Nenhum registro encontrado\n")
                    return filepath
                
                # Define campos
                fieldnames = ['id', 'cliente_nome', 'cliente_cpf', 'data_entrada', 
                             'data_saida', 'pernoite', 'status']
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                
                # Escreve cabeçalho
                writer.writeheader()
                
                # Escreve dados
                for registro in registros:
                    writer.writerow({
                        'id': registro.get('id', ''),
                        'cliente_nome': registro.get('cliente_nome', 'N/A'),
                        'cliente_cpf': registro.get('cliente_cpf', 'N/A'),
                        'data_entrada': registro.get('dataHoraEntrada', registro.get('data_hora_entrada', '')),
                        'data_saida': registro.get('dataHoraSaida', registro.get('data_hora_saida', '')) or 'Ainda no local',
                        'pernoite': 'Sim' if registro.get('pernoite', False) else 'Não',
                        'status': 'Removido' if registro.get('acessoRemovido', False) else 'Ativo'
                    })
            
            logger.info(f"✅ Relatório de registros exportado para CSV: {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Erro ao exportar relatório de registros: {e}", exc_info=True)
            return None
    
    def export_daily_summary_txt(self, date: str, registros: List[Dict[str, Any]], filename: Optional[str] = None) -> str:
        """Exporta resumo diário em formato TXT"""
        if not filename:
            filename = f"resumo_diario_{date.replace('-', '')}.txt"
        
        filepath = os.path.join(REPORTS_DIR, filename)
        
        try:
            # Filtra registros do dia
            registros_dia = [r for r in registros if date in r.get('dataHoraEntrada', r.get('data_hora_entrada', ''))]
            
            total_entradas = len(registros_dia)
            total_saidas = len([r for r in registros_dia if r.get('dataHoraSaida') or r.get('data_hora_saida')])
            total_pernoites = len([r for r in registros_dia if r.get('pernoite', False)])
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write("=" * 80 + "\n")
                f.write("RESUMO DIÁRIO - SISTEMA BICICLETÁRIO\n")
                f.write("=" * 80 + "\n\n")
                f.write(f"Data: {date}\n")
                f.write(f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n")
                f.write("=" * 80 + "\n\n")
                
                f.write("ESTATÍSTICAS DO DIA\n")
                f.write("-" * 40 + "\n")
                f.write(f"Total de Entradas: {total_entradas}\n")
                f.write(f"Total de Saídas: {total_saidas}\n")
                f.write(f"Bicicletas no Local: {total_entradas - total_saidas}\n")
                f.write(f"Pernoites: {total_pernoites}\n")
                f.write("\n")
                
                if registros_dia:
                    f.write("DETALHAMENTO DE REGISTROS\n")
                    f.write("-" * 40 + "\n\n")
                    
                    for i, registro in enumerate(registros_dia, 1):
                        entrada = registro.get('dataHoraEntrada', registro.get('data_hora_entrada', ''))
                        saida = registro.get('dataHoraSaida', registro.get('data_hora_saida', ''))
                        
                        f.write(f"Registro #{i}\n")
                        f.write(f"  Cliente: {registro.get('cliente_nome', 'N/A')}\n")
                        f.write(f"  CPF: {registro.get('cliente_cpf', 'N/A')}\n")
                        f.write(f"  Entrada: {entrada}\n")
                        f.write(f"  Saída: {saida or 'Ainda no local'}\n")
                        f.write(f"  Pernoite: {'Sim' if registro.get('pernoite', False) else 'Não'}\n")
                        f.write("\n")
            
            logger.info(f"✅ Resumo diário exportado para TXT: {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Erro ao exportar resumo diário: {e}", exc_info=True)
            return None
    
    def create_backup_report(self, backup_info: Dict[str, Any]) -> str:
        """Cria relatório de backup"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"relatorio_backup_{timestamp}.txt"
        filepath = os.path.join(LOGS_DIR, filename)
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write("=" * 80 + "\n")
                f.write("RELATÓRIO DE BACKUP - SISTEMA BICICLETÁRIO\n")
                f.write("=" * 80 + "\n\n")
                f.write(f"Data: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n")
                f.write("=" * 80 + "\n\n")
                
                f.write("INFORMAÇÕES DO BACKUP\n")
                f.write("-" * 40 + "\n")
                f.write(f"Arquivo: {backup_info.get('filename', 'N/A')}\n")
                f.write(f"Formato: {backup_info.get('format', 'N/A')}\n")
                f.write(f"Tamanho: {backup_info.get('size', 'N/A')}\n")
                f.write(f"Status: {backup_info.get('status', 'N/A')}\n")
                f.write("\n")
                
                f.write("CONTEÚDO DO BACKUP\n")
                f.write("-" * 40 + "\n")
                f.write(f"Clientes: {backup_info.get('total_clientes', 0)}\n")
                f.write(f"Bicicletas: {backup_info.get('total_bicicletas', 0)}\n")
                f.write(f"Registros: {backup_info.get('total_registros', 0)}\n")
                f.write(f"Usuários: {backup_info.get('total_usuarios', 0)}\n")
                f.write("\n")
            
            logger.info(f"✅ Relatório de backup criado: {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Erro ao criar relatório de backup: {e}", exc_info=True)
            return None


# Singleton instance
_log_exporter = None

def get_log_exporter() -> LogExporter:
    """Retorna a instância singleton do LogExporter"""
    global _log_exporter
    if _log_exporter is None:
        _log_exporter = LogExporter()
    return _log_exporter


if __name__ == '__main__':
    # Teste básico
    exporter = get_log_exporter()
    print("✅ Exportador de logs inicializado")
    
    # Teste de exportação
    test_logs = [
        {
            'id': 1,
            'usuario': 'admin',
            'acao': 'LOGIN',
            'detalhes': 'Login bem-sucedido',
            'timestamp': datetime.now().isoformat()
        }
    ]
    
    csv_file = exporter.export_audit_log_csv(test_logs)
    txt_file = exporter.export_audit_log_txt(test_logs)
    
    if csv_file and txt_file:
        print(f"✅ Arquivos de teste criados:")
        print(f"  - {csv_file}")
        print(f"  - {txt_file}")
