#!/usr/bin/env python3
"""
PCGE Parser Final - Plan Contable General Empresarial
====================================================

Parser definitivo para extraer todas las cuentas del PCGE desde cualquier formato
y generar un archivo JSON limpio para importar en el sistema.

Autor: Sistema Contable
Fecha: Agosto 2025
Versión: 1.0.0
"""

import re
import json
import csv
from pathlib import Path
from typing import Dict, List, Set
from dataclasses import dataclass, asdict


@dataclass
class CuentaPCGE:
    """Representa una cuenta del PCGE"""
    codigo: str
    nombre: str
    nivel: int
    padre_codigo: str
    elemento: str
    es_movimiento: bool
    esta_activo: bool
    descripcion: str = ""


class PCGEParserFinal:
    """Parser definitivo para el PCGE"""
    
    def __init__(self, archivo_pcge: str):
        self.archivo_pcge = Path(archivo_pcge)
        self.cuentas: Dict[str, CuentaPCGE] = {}
        self.cuentas_encontradas: Set[str] = set()
        
    def parsear_archivo(self) -> List[CuentaPCGE]:
        """Parsea el archivo PCGE y extrae todas las cuentas"""
        print(f"📖 Parseando archivo: {self.archivo_pcge}")
        
        if not self.archivo_pcge.exists():
            raise FileNotFoundError(f"Archivo no encontrado: {self.archivo_pcge}")
        
        contenido = self.archivo_pcge.read_text(encoding='utf-8')
        self._extraer_cuentas(contenido)
        self._generar_cuentas_padre()
        self._validar_jerarquia()
        
        cuentas_lista = list(self.cuentas.values())
        cuentas_lista.sort(key=lambda x: x.codigo)
        
        print(f"✅ Total de cuentas extraídas: {len(cuentas_lista)}")
        return cuentas_lista
    
    def _extraer_cuentas(self, contenido: str):
        """Extrae todas las cuentas del contenido"""
        print("🔍 Extrayendo cuentas del documento...")
        
        # Patrón para detectar cuentas con código numérico
        patron = r'^(\d{1,5})\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s,\.\-\(\)]+?)(?:\s*\.\.\.|$)'
        
        lineas = contenido.split('\n')
        
        for linea in lineas:
            linea = linea.strip()
            if not linea:
                continue
                
            match = re.match(patron, linea)
            if match:
                codigo = match.group(1).strip()
                nombre = match.group(2).strip()
                
                # Filtrar códigos no válidos
                if self._es_codigo_valido(codigo, nombre):
                    cuenta = self._crear_cuenta(codigo, nombre)
                    if cuenta:
                        self.cuentas[codigo] = cuenta
                        self.cuentas_encontradas.add(codigo)
        
        print(f"🔢 Cuentas extraídas del documento: {len(self.cuentas)}")
    
    def _es_codigo_valido(self, codigo: str, nombre: str) -> bool:
        """Valida si el código es una cuenta válida del PCGE"""
        # Filtrar códigos no válidos
        filtros = [
            len(codigo) > 5,  # Más de 5 dígitos
            codigo.startswith('20191'),  # Año
            codigo.startswith('2019'),   # Año
            'página' in nombre.lower(),
            'capítulo' in nombre.lower(),
            'elemento' in nombre.lower() and len(codigo) > 1,
            len(nombre) < 3,  # Nombres muy cortos
            any(char.isdigit() for char in nombre) and 'cuenta' not in nombre.lower()
        ]
        
        return not any(filtros)
    
    def _crear_cuenta(self, codigo: str, nombre: str) -> CuentaPCGE:
        """Crea una cuenta PCGE a partir del código y nombre"""
        # Evitar duplicados
        if codigo in self.cuentas:
            return None
        
        nivel = len(codigo)
        elemento = codigo[0]
        
        # Determinar cuenta padre
        padre_codigo = ""
        if nivel > 1:
            padre_codigo = codigo[:-1]
        
        # Determinar si es cuenta de movimiento (típicamente niveles 3, 4, 5)
        es_movimiento = nivel >= 3
        
        return CuentaPCGE(
            codigo=codigo,
            nombre=nombre.title(),
            nivel=nivel,
            padre_codigo=padre_codigo,
            elemento=elemento,
            es_movimiento=es_movimiento,
            esta_activo=True
        )
    
    def _generar_cuentas_padre(self):
        """Genera automáticamente las cuentas padre faltantes"""
        print("🔧 Generando cuentas padre faltantes...")
        
        cuentas_padre_necesarias = set()
        
        # Identificar cuentas padre necesarias
        for cuenta in self.cuentas.values():
            if cuenta.padre_codigo and cuenta.padre_codigo not in self.cuentas:
                cuentas_padre_necesarias.add(cuenta.padre_codigo)
        
        # Crear cuentas padre faltantes
        for codigo_padre in cuentas_padre_necesarias:
            if codigo_padre not in self.cuentas:
                nombre_padre = self._generar_nombre_padre(codigo_padre)
                cuenta_padre = CuentaPCGE(
                    codigo=codigo_padre,
                    nombre=nombre_padre,
                    nivel=len(codigo_padre),
                    padre_codigo=codigo_padre[:-1] if len(codigo_padre) > 1 else "",
                    elemento=codigo_padre[0],
                    es_movimiento=False,  # Las cuentas padre generalmente no son de movimiento
                    esta_activo=True
                )
                self.cuentas[codigo_padre] = cuenta_padre
        
        print(f"➕ Cuentas padre generadas: {len(cuentas_padre_necesarias)}")
    
    def _generar_nombre_padre(self, codigo: str) -> str:
        """Genera un nombre descriptivo para cuentas padre"""
        nombres_elemento = {
            '0': 'Cuentas de Orden',
            '1': 'Activo Disponible y Exigible',
            '2': 'Activo Realizable',
            '3': 'Activo Inmovilizado',
            '4': 'Pasivo',
            '5': 'Patrimonio',
            '6': 'Gastos por Naturaleza',
            '7': 'Ingresos',
            '8': 'Saldos Intermediarios',
            '9': 'Cuentas Analíticas'
        }
        
        elemento = codigo[0]
        if len(codigo) == 1:
            return nombres_elemento.get(elemento, f"Elemento {elemento}")
        else:
            return f"Grupo {codigo} - {nombres_elemento.get(elemento, 'Otros')}"
    
    def _validar_jerarquia(self):
        """Valida que todas las relaciones padre-hijo sean correctas"""
        print("🔍 Validando jerarquía...")
        
        errores = []
        for cuenta in self.cuentas.values():
            if cuenta.padre_codigo and cuenta.padre_codigo not in self.cuentas:
                errores.append(f"Cuenta {cuenta.codigo}: padre {cuenta.padre_codigo} no encontrado")
        
        if errores:
            print(f"❌ Errores de jerarquía encontrados: {len(errores)}")
            for error in errores[:10]:  # Mostrar solo los primeros 10
                print(f"  - {error}")
            if len(errores) > 10:
                print(f"  ... y {len(errores) - 10} errores más")
        else:
            print("✅ Jerarquía validada sin errores")
    
    def generar_json(self, archivo_salida: str) -> str:
        """Genera archivo JSON con todas las cuentas"""
        cuentas_lista = self.parsear_archivo()
        
        datos_json = [asdict(cuenta) for cuenta in cuentas_lista]
        
        archivo_json = Path(archivo_salida)
        with open(archivo_json, 'w', encoding='utf-8') as f:
            json.dump(datos_json, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Archivo JSON generado: {archivo_json}")
        print(f"📊 Total de cuentas: {len(datos_json)}")
        
        # Estadísticas
        self._mostrar_estadisticas(cuentas_lista)
        
        return str(archivo_json)
    
    def generar_csv(self, archivo_salida: str) -> str:
        """Genera archivo CSV con todas las cuentas"""
        cuentas_lista = self.parsear_archivo()
        
        archivo_csv = Path(archivo_salida)
        with open(archivo_csv, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=[
                'codigo', 'nombre', 'nivel', 'padre_codigo', 
                'elemento', 'es_movimiento', 'esta_activo', 'descripcion'
            ])
            writer.writeheader()
            for cuenta in cuentas_lista:
                writer.writerow(asdict(cuenta))
        
        print(f"💾 Archivo CSV generado: {archivo_csv}")
        return str(archivo_csv)
    
    def _mostrar_estadisticas(self, cuentas: List[CuentaPCGE]):
        """Muestra estadísticas del catálogo extraído"""
        print("\n📊 ESTADÍSTICAS DEL PCGE:")
        print("=" * 50)
        
        # Por nivel
        niveles = {}
        for cuenta in cuentas:
            niveles[cuenta.nivel] = niveles.get(cuenta.nivel, 0) + 1
        
        print("Por Nivel:")
        for nivel in sorted(niveles.keys()):
            print(f"  Nivel {nivel}: {niveles[nivel]:,} cuentas")
        
        # Por elemento
        elementos = {}
        for cuenta in cuentas:
            elementos[cuenta.elemento] = elementos.get(cuenta.elemento, 0) + 1
        
        print("\nPor Elemento:")
        for elemento in sorted(elementos.keys()):
            print(f"  Elemento {elemento}: {elementos[elemento]:,} cuentas")
        
        # Cuentas de movimiento
        movimiento = sum(1 for c in cuentas if c.es_movimiento)
        print(f"\nCuentas de movimiento: {movimiento:,}")
        print(f"Cuentas de agrupación: {len(cuentas) - movimiento:,}")
        print(f"\n✅ TOTAL: {len(cuentas):,} cuentas")


def main():
    """Función principal"""
    print("🚀 PCGE Parser Final - Iniciando...")
    print("=" * 60)
    
    # Configuración
    base_dir = Path(__file__).parent.parent
    archivo_pcge = base_dir / "docs" / "pcge.txt"  # o pcge.md
    archivo_json = base_dir / "data" / "pcge_completo.json"
    archivo_csv = base_dir / "data" / "pcge_completo.csv"
    
    # Crear directorios si no existen
    archivo_json.parent.mkdir(parents=True, exist_ok=True)
    
    try:
        # Crear parser
        parser = PCGEParserFinal(str(archivo_pcge))
        
        # Generar archivos
        parser.generar_json(str(archivo_json))
        parser.generar_csv(str(archivo_csv))
        
        print(f"\n🎉 ¡Proceso completado exitosamente!")
        print(f"📁 Archivos generados en: {archivo_json.parent}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
