#!/usr/bin/env python3
"""
PCGE Parser - Plan Contable General Empresarial
===============================================

Parser definitivo y único para extraer las cuentas del PCGE Modificado 2019
desde el documento oficial en formato Markdown.

Autor: Sistema PCGE Backend
Fecha: 2025
Versión: 1.0.0 - Definitiva
"""

import re
import json
import csv
import os
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, asdict
import logging
from pathlib import Path

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('pcge_parser.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class CuentaPcge:
    """Clase que representa una cuenta del PCGE"""
    codigo: str
    nombre: str
    nivel: int
    padre: Optional[str] = None
    tipo: str = ""
    elemento: int = 0
    
    def __post_init__(self):
        """Procesamiento automático después de la inicialización"""
        self.nivel = len(self.codigo)
        if self.nivel > 1:
            self.padre = self.codigo[:-1]
        self.elemento = int(self.codigo[0]) if self.codigo else 0
        
        # Determinar tipo basado en el elemento
        tipo_map = {
            1: "ACTIVO_DISPONIBLE_EXIGIBLE",
            2: "ACTIVO_REALIZABLE", 
            3: "ACTIVO_INMOVILIZADO",
            4: "PASIVO",
            5: "PATRIMONIO",
            6: "GASTOS_NATURALEZA",
            7: "INGRESOS_NATURALEZA",
            8: "SALDOS_INTERMEDIARIOS",
            9: "CONTABILIDAD_ANALITICA",
            0: "CUENTAS_ORDEN"
        }
        self.tipo = tipo_map.get(self.elemento, "DESCONOCIDO")

class PCGEParser:
    """Parser principal para el PCGE"""
    
    def __init__(self, archivo_pcge: str):
        """
        Inicializa el parser
        
        Args:
            archivo_pcge: Ruta al archivo pcge.md
        """
        self.archivo_pcge = Path(archivo_pcge)
        self.cuentas: List[CuentaPcge] = []
        self.contenido = ""
        
        # Patrones regex para extraer cuentas
        self.patrones = {
            # Cuentas principales (2 dígitos) - Ej: "10 EFECTIVO Y EQUIVALENTES DE EFECTIVO"
            'cuenta_principal': re.compile(r'^(\d{2})\s+(.+)$', re.MULTILINE),
            
            # Subcuentas (3 dígitos) - Ej: "101 Caja"
            'subcuenta': re.compile(r'^(\d{3})\s+(.+)$', re.MULTILINE),
            
            # Divisionarias (4 dígitos) - Ej: "1031 Efectivo en tránsito"
            'divisionaria': re.compile(r'^(\d{4})\s+(.+)$', re.MULTILINE),
            
            # Sub-divisionarias (5 dígitos) - Ej: "11111 Costo"
            'subdivisionaria': re.compile(r'^(\d{5})\s+(.+)$', re.MULTILINE),
            
            # Elementos - Ej: "ELEMENTO 1: ACTIVO DISPONIBLE Y EXIGIBLE"
            'elemento': re.compile(r'^ELEMENTO\s+(\d+):\s*(.+)$', re.MULTILINE | re.IGNORECASE)
        }
    
    def cargar_archivo(self) -> bool:
        """Carga el contenido del archivo PCGE"""
        try:
            if not self.archivo_pcge.exists():
                logger.error(f"Archivo no encontrado: {self.archivo_pcge}")
                return False
                
            with open(self.archivo_pcge, 'r', encoding='utf-8') as file:
                self.contenido = file.read()
                
            logger.info(f"Archivo cargado: {len(self.contenido)} caracteres")
            return True
            
        except Exception as e:
            logger.error(f"Error cargando archivo: {e}")
            return False
    
    def limpiar_nombre(self, nombre: str) -> str:
        """Limpia y normaliza el nombre de una cuenta"""
        # Remover caracteres especiales del inicio/final
        nombre = nombre.strip()
        
        # Remover puntos consecutivos
        nombre = re.sub(r'\.{2,}', '', nombre)
        
        # Remover números de página y referencias
        nombre = re.sub(r'\s+\d+$', '', nombre)
        
        # Limpiar espacios múltiples
        nombre = re.sub(r'\s+', ' ', nombre)
        
        return nombre.strip()
    
    def extraer_cuentas_por_patron(self, patron_nombre: str) -> List[Tuple[str, str]]:
        """Extrae cuentas usando un patrón específico"""
        patron = self.patrones[patron_nombre]
        matches = []
        
        for match in patron.finditer(self.contenido):
            codigo = match.group(1)
            nombre = self.limpiar_nombre(match.group(2))
            
            # Filtrar nombres vacíos o muy cortos
            if len(nombre) > 2 and not nombre.isdigit():
                matches.append((codigo, nombre))
        
        return matches
    
    def extraer_todas_las_cuentas(self) -> List[CuentaPcge]:
        """Extrae todas las cuentas del documento"""
        logger.info("Iniciando extracción de cuentas...")
        
        todas_las_cuentas = []
        
        # Extraer por cada tipo de patrón
        for patron_nombre in ['cuenta_principal', 'subcuenta', 'divisionaria', 'subdivisionaria']:
            matches = self.extraer_cuentas_por_patron(patron_nombre)
            logger.info(f"Extraídas {len(matches)} cuentas con patrón '{patron_nombre}'")
            
            for codigo, nombre in matches:
                cuenta = CuentaPcge(codigo=codigo, nombre=nombre)
                todas_las_cuentas.append(cuenta)
        
        # Ordenar por código
        todas_las_cuentas.sort(key=lambda x: x.codigo)
        
        # Eliminar duplicados manteniendo el orden
        cuentas_unicas = []
        codigos_vistos = set()
        
        for cuenta in todas_las_cuentas:
            if cuenta.codigo not in codigos_vistos:
                cuentas_unicas.append(cuenta)
                codigos_vistos.add(cuenta.codigo)
        
        logger.info(f"Total de cuentas únicas extraídas: {len(cuentas_unicas)}")
        return cuentas_unicas
    
    def validar_jerarquia(self) -> bool:
        """Valida que la jerarquía de cuentas sea consistente"""
        logger.info("Validando jerarquía de cuentas...")
        
        codigos_existentes = {cuenta.codigo for cuenta in self.cuentas}
        errores = 0
        
        for cuenta in self.cuentas:
            if cuenta.padre and cuenta.padre not in codigos_existentes:
                logger.warning(f"Cuenta {cuenta.codigo} tiene padre inexistente: {cuenta.padre}")
                errores += 1
        
        if errores == 0:
            logger.info("Jerarquía válida - sin errores")
        else:
            logger.warning(f"Se encontraron {errores} errores de jerarquía")
        
        return errores == 0
    
    def generar_estadisticas(self) -> Dict:
        """Genera estadísticas del catálogo extraído"""
        stats = {
            'total_cuentas': len(self.cuentas),
            'por_nivel': {},
            'por_elemento': {},
            'por_tipo': {}
        }
        
        for cuenta in self.cuentas:
            # Por nivel
            nivel = cuenta.nivel
            stats['por_nivel'][nivel] = stats['por_nivel'].get(nivel, 0) + 1
            
            # Por elemento
            elemento = cuenta.elemento
            stats['por_elemento'][elemento] = stats['por_elemento'].get(elemento, 0) + 1
            
            # Por tipo
            tipo = cuenta.tipo
            stats['por_tipo'][tipo] = stats['por_tipo'].get(tipo, 0) + 1
        
        return stats
    
    def exportar_json(self, archivo_salida: str) -> bool:
        """Exporta las cuentas a formato JSON"""
        try:
            cuentas_dict = [asdict(cuenta) for cuenta in self.cuentas]
            
            with open(archivo_salida, 'w', encoding='utf-8') as file:
                json.dump(cuentas_dict, file, ensure_ascii=False, indent=2)
            
            logger.info(f"Exportado a JSON: {archivo_salida}")
            return True
            
        except Exception as e:
            logger.error(f"Error exportando JSON: {e}")
            return False
    
    def exportar_csv(self, archivo_salida: str) -> bool:
        """Exporta las cuentas a formato CSV"""
        try:
            with open(archivo_salida, 'w', newline='', encoding='utf-8') as file:
                writer = csv.writer(file)
                
                # Encabezados
                writer.writerow(['codigo', 'nombre', 'nivel', 'padre', 'tipo', 'elemento'])
                
                # Datos
                for cuenta in self.cuentas:
                    writer.writerow([
                        cuenta.codigo,
                        cuenta.nombre,
                        cuenta.nivel,
                        cuenta.padre or '',
                        cuenta.tipo,
                        cuenta.elemento
                    ])
            
            logger.info(f"Exportado a CSV: {archivo_salida}")
            return True
            
        except Exception as e:
            logger.error(f"Error exportando CSV: {e}")
            return False
    
    def procesar(self) -> bool:
        """Procesa el archivo PCGE completo"""
        logger.info("=== INICIANDO PROCESAMIENTO PCGE ===")
        
        # Cargar archivo
        if not self.cargar_archivo():
            return False
        
        # Extraer cuentas
        self.cuentas = self.extraer_todas_las_cuentas()
        
        if not self.cuentas:
            logger.error("No se pudieron extraer cuentas")
            return False
        
        # Validar jerarquía
        self.validar_jerarquia()
        
        # Mostrar estadísticas
        stats = self.generar_estadisticas()
        logger.info("=== ESTADÍSTICAS ===")
        logger.info(f"Total de cuentas: {stats['total_cuentas']}")
        logger.info(f"Por nivel: {stats['por_nivel']}")
        logger.info(f"Por elemento: {stats['por_elemento']}")
        
        logger.info("=== PROCESAMIENTO COMPLETADO ===")
        return True

def main():
    """Función principal"""
    print("PCGE Parser - Plan Contable General Empresarial")
    print("=" * 50)
    
    # Rutas
    base_dir = Path(__file__).parent.parent
    archivo_pcge = base_dir / "docs" / "pcge.md"
    archivo_json = base_dir / "data" / "pcge_completo.json"
    archivo_csv = base_dir / "data" / "pcge_completo.csv"
    
    # Crear directorio de salida si no existe
    archivo_json.parent.mkdir(exist_ok=True)
    
    # Procesar
    parser = PCGEParser(str(archivo_pcge))
    
    if parser.procesar():
        # Exportar resultados
        parser.exportar_json(str(archivo_json))
        parser.exportar_csv(str(archivo_csv))
        
        print(f"\n✅ Proceso completado exitosamente")
        print(f"📊 Total de cuentas extraídas: {len(parser.cuentas)}")
        print(f"📄 JSON generado: {archivo_json}")
        print(f"📄 CSV generado: {archivo_csv}")
    else:
        print("\n❌ Error en el procesamiento")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
