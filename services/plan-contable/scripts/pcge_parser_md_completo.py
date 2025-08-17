#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parser completo del Plan Contable General Empresarial (PCGE) 2019
Extrae todas las cuentas del archivo .md del PCGE oficial
"""

import re
import json
import csv
import sys
from typing import List, Dict, Tuple
from dataclasses import dataclass

@dataclass
class CuentaPCGE:
    codigo: str
    nombre: str
    nivel: int
    padre_codigo: str
    elemento: str
    es_movimiento: bool
    esta_activo: bool = True

class PCGEParserCompleto:
    def __init__(self):
        self.cuentas = []
        self.elementos_info = {
            '0': 'Cuentas de orden',
            '1': 'Activo disponible y exigible',
            '2': 'Activo realizable', 
            '3': 'Activo inmovilizado',
            '4': 'Pasivo',
            '5': 'Patrimonio',
            '6': 'Gastos por naturaleza',
            '7': 'Ingresos',
            '8': 'Saldos intermediarios',
            '9': 'Cuentas analíticas'
        }
    
    def determinar_nivel(self, codigo: str) -> int:
        """Determina el nivel jerárquico según la longitud del código"""
        return len(codigo.strip())
    
    def determinar_padre(self, codigo: str) -> str:
        """Determina el código padre según la jerarquía"""
        codigo = codigo.strip()
        if len(codigo) <= 1:
            return ""
        return codigo[:-1]
    
    def es_cuenta_movimiento(self, codigo: str, contexto: str = "") -> bool:
        """
        Determina si una cuenta es de movimiento basado en el nivel y contexto
        Generalmente las cuentas de mayor detalle (4-5 dígitos) son de movimiento
        """
        nivel = self.determinar_nivel(codigo)
        
        # Las cuentas de 1-2 dígitos generalmente no son de movimiento
        if nivel <= 2:
            return False
        
        # Las cuentas de 4-5 dígitos generalmente son de movimiento
        if nivel >= 4:
            return True
        
        # Para cuentas de 3 dígitos, depende del contexto
        # Si tiene subcuentas, no es de movimiento
        return nivel == 3  # Por defecto, las de 3 dígitos pueden ser de movimiento
    
    def extraer_cuentas_del_texto(self, contenido: str) -> List[CuentaPCGE]:
        """Extrae todas las cuentas del contenido del archivo PCGE"""
        cuentas = []
        lineas = contenido.split('\n')
        
        # Patrón mejorado para detectar cuentas
        # Busca: código numérico (1-5 dígitos) seguido de espacios y descripción
        patron_cuenta = re.compile(r'^(\d{1,5})\s+(.+?)(?:\s+\.\.\.\.*\s*\d+)?$', re.MULTILINE)
        
        # También buscar patrones en líneas individuales
        patron_linea = re.compile(r'^(\d{1,5})\s+(.+)', re.IGNORECASE)
        
        print(f"Procesando {len(lineas)} líneas del archivo...")
        
        cuentas_encontradas = set()  # Para evitar duplicados
        
        for i, linea in enumerate(lineas):
            linea = linea.strip()
            
            # Saltar líneas vacías o de encabezados
            if not linea or linea.startswith('-') or linea.startswith('ELEMENTO') or 'CAPÍTULO' in linea:
                continue
            
            # Buscar patrón de cuenta en la línea
            match = patron_linea.match(linea)
            if match:
                codigo = match.group(1).strip()
                nombre = match.group(2).strip()
                
                # Limpiar el nombre
                nombre = re.sub(r'\s+\.\.\.*\s*\d+$', '', nombre)  # Quitar puntos y números de página
                nombre = re.sub(r'\s+', ' ', nombre)  # Normalizar espacios
                nombre = nombre.strip()
                
                # Validar que no sea una línea de índice o encabezado
                if not nombre or len(nombre) < 3:
                    continue
                    
                # Validar que el código no sea parte de una fecha o número de página
                if len(codigo) > 5:
                    continue
                
                # Evitar duplicados
                if codigo in cuentas_encontradas:
                    continue
                
                cuentas_encontradas.add(codigo)
                
                # Determinar propiedades de la cuenta
                nivel = self.determinar_nivel(codigo)
                padre_codigo = self.determinar_padre(codigo)
                elemento = codigo[0] if codigo else "0"
                es_movimiento = self.es_cuenta_movimiento(codigo)
                
                cuenta = CuentaPCGE(
                    codigo=codigo,
                    nombre=nombre,
                    nivel=nivel,
                    padre_codigo=padre_codigo,
                    elemento=elemento,
                    es_movimiento=es_movimiento,
                    esta_activo=True
                )
                
                cuentas.append(cuenta)
                
                if len(cuentas) % 100 == 0:
                    print(f"Extraídas {len(cuentas)} cuentas...")
        
        print(f"Total de cuentas extraídas: {len(cuentas)}")
        return cuentas
    
    def validar_jerarquia(self, cuentas: List[CuentaPCGE]) -> List[str]:
        """Valida que todas las cuentas padre existan"""
        errores = []
        codigos_existentes = {cuenta.codigo for cuenta in cuentas}
        
        for cuenta in cuentas:
            if cuenta.padre_codigo and cuenta.padre_codigo not in codigos_existentes:
                errores.append(f"Cuenta {cuenta.codigo}: padre {cuenta.padre_codigo} no encontrado")
        
        return errores
    
    def corregir_es_movimiento(self, cuentas: List[CuentaPCGE]):
        """Corrige la propiedad es_movimiento basado en si tiene hijos"""
        codigos_con_hijos = set()
        
        # Identificar qué cuentas tienen hijos
        for cuenta in cuentas:
            if cuenta.padre_codigo:
                codigos_con_hijos.add(cuenta.padre_codigo)
        
        # Corregir la propiedad es_movimiento
        for cuenta in cuentas:
            if cuenta.codigo in codigos_con_hijos:
                cuenta.es_movimiento = False  # Las cuentas padre no son de movimiento
            else:
                # Las cuentas hoja (sin hijos) son de movimiento si tienen 3+ dígitos
                cuenta.es_movimiento = len(cuenta.codigo) >= 3
    
    def procesar_archivo(self, ruta_archivo: str) -> Tuple[List[CuentaPCGE], List[str]]:
        """Procesa el archivo PCGE y extrae todas las cuentas"""
        try:
            print(f"Procesando archivo: {ruta_archivo}")
            
            with open(ruta_archivo, 'r', encoding='utf-8') as file:
                contenido = file.read()
            
            print(f"Archivo leído: {len(contenido)} caracteres")
            
            # Extraer cuentas
            cuentas = self.extraer_cuentas_del_texto(contenido)
            
            if not cuentas:
                return [], ["No se encontraron cuentas en el archivo"]
            
            # Ordenar por código
            cuentas.sort(key=lambda x: x.codigo)
            
            # Corregir propiedades de movimiento
            self.corregir_es_movimiento(cuentas)
            
            # Validar jerarquía
            errores = self.validar_jerarquia(cuentas)
            
            # Estadísticas
            print("\n=== ESTADÍSTICAS DE EXTRACCIÓN ===")
            print(f"Total de cuentas extraídas: {len(cuentas)}")
            
            por_nivel = {}
            por_elemento = {}
            
            for cuenta in cuentas:
                # Por nivel
                nivel = cuenta.nivel
                por_nivel[nivel] = por_nivel.get(nivel, 0) + 1
                
                # Por elemento
                elemento = cuenta.elemento
                por_elemento[elemento] = por_elemento.get(elemento, 0) + 1
            
            print("\nPor nivel:")
            for nivel in sorted(por_nivel.keys()):
                print(f"  Nivel {nivel}: {por_nivel[nivel]} cuentas")
            
            print("\nPor elemento:")
            for elemento in sorted(por_elemento.keys()):
                nombre_elemento = self.elementos_info.get(elemento, f"Elemento {elemento}")
                print(f"  Elemento {elemento} ({nombre_elemento}): {por_elemento[elemento]} cuentas")
            
            if errores:
                print(f"\n⚠️  Se encontraron {len(errores)} errores de jerarquía")
                for error in errores[:10]:  # Mostrar solo los primeros 10
                    print(f"  - {error}")
                if len(errores) > 10:
                    print(f"  ... y {len(errores) - 10} errores más")
            
            return cuentas, errores
            
        except Exception as e:
            return [], [f"Error procesando archivo: {str(e)}"]
    
    def exportar_a_json(self, cuentas: List[CuentaPCGE], archivo_salida: str):
        """Exporta las cuentas a formato JSON"""
        datos = []
        for cuenta in cuentas:
            datos.append({
                "codigo": cuenta.codigo,
                "nombre": cuenta.nombre,
                "nivel": cuenta.nivel,
                "padre_codigo": cuenta.padre_codigo,
                "elemento": cuenta.elemento,
                "es_movimiento": cuenta.es_movimiento,
                "esta_activo": cuenta.esta_activo
            })
        
        with open(archivo_salida, 'w', encoding='utf-8') as file:
            json.dump(datos, file, ensure_ascii=False, indent=2)
        
        print(f"✅ Archivo JSON exportado: {archivo_salida}")
    
    def exportar_a_csv(self, cuentas: List[CuentaPCGE], archivo_salida: str):
        """Exporta las cuentas a formato CSV"""
        with open(archivo_salida, 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(['codigo', 'nombre', 'nivel', 'padre_codigo', 'elemento', 'es_movimiento', 'esta_activo'])
            
            for cuenta in cuentas:
                writer.writerow([
                    cuenta.codigo,
                    cuenta.nombre,
                    cuenta.nivel,
                    cuenta.padre_codigo,
                    cuenta.elemento,
                    cuenta.es_movimiento,
                    cuenta.esta_activo
                ])
        
        print(f"✅ Archivo CSV exportado: {archivo_salida}")

def main():
    if len(sys.argv) != 2:
        print("Uso: python pcge_parser_md_completo.py <ruta_archivo_pcge.md>")
        sys.exit(1)
    
    ruta_archivo = sys.argv[1]
    parser = PCGEParserCompleto()
    
    # Procesar archivo
    cuentas, errores = parser.procesar_archivo(ruta_archivo)
    
    if not cuentas:
        print("❌ No se pudieron extraer cuentas del archivo")
        for error in errores:
            print(f"  - {error}")
        sys.exit(1)
    
    # Exportar resultados
    base_nombre = ruta_archivo.replace('.md', '').replace('.txt', '')
    archivo_json = f"{base_nombre}_completo.json"
    archivo_csv = f"{base_nombre}_completo.csv"
    
    parser.exportar_a_json(cuentas, archivo_json)
    parser.exportar_a_csv(cuentas, archivo_csv)
    
    print(f"\n🎉 Procesamiento completado exitosamente!")
    print(f"📊 {len(cuentas)} cuentas extraídas del PCGE")
    
    if errores:
        print(f"⚠️  {len(errores)} errores de jerarquía encontrados")

if __name__ == "__main__":
    main()
