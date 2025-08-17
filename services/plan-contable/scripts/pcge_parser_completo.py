#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parser completo del Plan Contable General Empresarial (PCGE) 2019
Extrae todas las cuentas de 2, 3, 4 y 5 dígitos del documento oficial.
"""

import re
import json
import csv
import sys
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass


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


class PCGEParserCompleto:
    """Parser completo para extraer todas las cuentas del PCGE"""
    
    def __init__(self, archivo_txt: str):
        self.archivo_txt = archivo_txt
        self.cuentas: List[CuentaPCGE] = []
        self.elementos = {
            '0': 'CUENTAS DE ORDEN',
            '1': 'ACTIVO',
            '2': 'ACTIVO',
            '3': 'ACTIVO',
            '4': 'PASIVO',
            '5': 'PATRIMONIO',
            '6': 'GASTOS',
            '7': 'INGRESOS',
            '8': 'SALDOS INTERMEDIARIOS',
            '9': 'CUENTAS ANALÍTICAS'
        }
    
    def leer_archivo(self) -> List[str]:
        """Lee el archivo PCGE y retorna las líneas"""
        try:
            with open(self.archivo_txt, 'r', encoding='utf-8') as f:
                return f.readlines()
        except UnicodeDecodeError:
            # Intentar con codificación latin-1 si utf-8 falla
            with open(self.archivo_txt, 'r', encoding='latin-1') as f:
                return f.readlines()
    
    def limpiar_codigo(self, codigo_bruto: str) -> str:
        """Limpia y normaliza el código de cuenta"""
        # Eliminar espacios extras y caracteres especiales
        codigo = re.sub(r'\s+', '', codigo_bruto.strip())
        # Asegurar que solo contenga dígitos
        codigo = re.sub(r'[^\d]', '', codigo)
        return codigo
    
    def limpiar_nombre(self, nombre_bruto: str) -> str:
        """Limpia y normaliza el nombre de la cuenta"""
        nombre = nombre_bruto.strip()
        # Eliminar caracteres de control y normalizar espacios
        nombre = re.sub(r'\s+', ' ', nombre)
        # Eliminar caracteres especiales comunes
        nombre = re.sub(r'[^\w\s\-\(\)\.,:;/]', '', nombre)
        return nombre.title()
    
    def determinar_padre(self, codigo: str, cuentas_procesadas: List[CuentaPCGE]) -> str:
        """Determina el código padre de una cuenta basado en la jerarquía"""
        if len(codigo) <= 2:
            return ""
        
        # Buscar el padre más específico (código más largo que sea padre)
        for longitud_padre in range(len(codigo) - 1, 1, -1):
            codigo_padre = codigo[:longitud_padre]
            
            # Verificar si este código padre existe en las cuentas procesadas
            for cuenta in cuentas_procesadas:
                if cuenta.codigo == codigo_padre:
                    return codigo_padre
        
        return ""
    
    def es_cuenta_movimiento(self, codigo: str, nivel: int) -> bool:
        """Determina si una cuenta es de movimiento (nivel más detallado)"""
        # Generalmente, las cuentas de nivel 4 y 5 son de movimiento
        # Las cuentas de nivel 2 y 3 suelen ser de agrupación
        if nivel >= 4:
            return True
        elif nivel == 3:
            # Nivel 3 puede ser movimiento si no tiene subcuentas de nivel 4
            return True
        else:
            return False
    
    def extraer_cuentas_desde_catalogo(self, lineas: List[str]) -> List[CuentaPCGE]:
        """Extrae las cuentas desde la sección CATÁLOGO DE CUENTAS"""
        cuentas = []
        en_catalogo = False
        elemento_actual = ""
        
        # Patrones para identificar cuentas (más flexibles)
        patron_cuenta = re.compile(r'^(\s*\d\s*\d+|\d+)\s+(.+?)(?:\s+\.{3,}.*)?$')
        patron_elemento = re.compile(r'^ELEMENTO\s+(\d):\s*(.+)$')
        patron_fin_catalogo = re.compile(r'^CAPÍTULO\s+III|^DESCRIPCIÓN\s+Y\s+DINÁMICA')
        # Excluir líneas que son claramente separadores o headers
        patron_excluir = re.compile(r'^-\s*\d+\s*-$|^PLAN\s+CONTABLE|^ELEMENTO\s+\d|^\s*$')
        
        for i, linea in enumerate(lineas):
            linea_original = linea
            linea = linea.strip()
            
            # Verificar si hemos llegado al final del catálogo
            if patron_fin_catalogo.search(linea):
                print(f"Fin del catálogo detectado en línea: {linea}")
                break
            
            # Detectar inicio del catálogo
            if "CATÁLOGO DE CUENTAS" in linea:
                en_catalogo = True
                print(f"Inicio del catálogo detectado en línea {i}: {linea}")
                continue
            
            if not en_catalogo:
                continue
            
            # Saltar líneas que no contienen cuentas
            if patron_excluir.search(linea) or len(linea) < 3:
                continue
            
            # Detectar cambio de elemento
            match_elemento = patron_elemento.search(linea)
            if match_elemento:
                elemento_actual = match_elemento.group(1)
                print(f"Elemento detectado: {elemento_actual}")
                continue
            
            # Extraer cuenta
            match_cuenta = patron_cuenta.search(linea)
            if match_cuenta:
                codigo_bruto = match_cuenta.group(1)
                nombre_bruto = match_cuenta.group(2)
                
                codigo = self.limpiar_codigo(codigo_bruto)
                nombre = self.limpiar_nombre(nombre_bruto)
                
                # Validaciones adicionales
                if (len(codigo) >= 2 and len(codigo) <= 5 and 
                    nombre and len(nombre) > 2 and elemento_actual and
                    not any(char.isdigit() for char in nombre[:3])):  # El nombre no debe empezar con números
                    
                    nivel = len(codigo)
                    padre_codigo = self.determinar_padre(codigo, cuentas)
                    es_movimiento = self.es_cuenta_movimiento(codigo, nivel)
                    
                    cuenta = CuentaPCGE(
                        codigo=codigo,
                        nombre=nombre,
                        nivel=nivel,
                        padre_codigo=padre_codigo,
                        elemento=elemento_actual,
                        es_movimiento=es_movimiento,
                        esta_activo=True
                    )
                    
                    cuentas.append(cuenta)
                    if len(cuentas) <= 20:  # Solo mostrar las primeras 20 para no saturar
                        print(f"Extraída: {codigo} - {nombre} (Nivel {nivel}, Elemento {elemento_actual})")
                    elif len(cuentas) % 100 == 0:  # Mostrar progreso cada 100
                        print(f"Procesadas {len(cuentas)} cuentas...")
        
        return cuentas
    
    def procesar_archivo(self) -> List[CuentaPCGE]:
        """Procesa el archivo completo y extrae todas las cuentas"""
        print("Leyendo archivo PCGE...")
        lineas = self.leer_archivo()
        
        print("Extrayendo cuentas desde el catálogo...")
        cuentas_catalogo = self.extraer_cuentas_desde_catalogo(lineas)
        
        self.cuentas = cuentas_catalogo
        
        print(f"\n✅ Extracción completada:")
        print(f"   Total de cuentas: {len(self.cuentas)}")
        
        # Estadísticas por nivel
        estadisticas = {}
        for cuenta in self.cuentas:
            nivel = cuenta.nivel
            if nivel not in estadisticas:
                estadisticas[nivel] = 0
            estadisticas[nivel] += 1
        
        print(f"\n📊 Distribución por nivel:")
        for nivel in sorted(estadisticas.keys()):
            print(f"   Nivel {nivel}: {estadisticas[nivel]} cuentas")
        
        # Estadísticas por elemento
        estadisticas_elemento = {}
        for cuenta in self.cuentas:
            elemento = cuenta.elemento
            if elemento not in estadisticas_elemento:
                estadisticas_elemento[elemento] = 0
            estadisticas_elemento[elemento] += 1
        
        print(f"\n📊 Distribución por elemento:")
        for elemento in sorted(estadisticas_elemento.keys()):
            nombre_elemento = self.elementos.get(elemento, "Desconocido")
            print(f"   Elemento {elemento} ({nombre_elemento}): {estadisticas_elemento[elemento]} cuentas")
        
        return self.cuentas
    
    def validar_jerarquia(self) -> List[str]:
        """Valida la consistencia jerárquica de las cuentas"""
        errores = []
        codigos_existentes = {cuenta.codigo for cuenta in self.cuentas}
        
        for cuenta in self.cuentas:
            if cuenta.padre_codigo and cuenta.padre_codigo not in codigos_existentes:
                errores.append(f"Cuenta {cuenta.codigo}: padre {cuenta.padre_codigo} no encontrado")
        
        return errores
    
    def exportar_json(self, archivo_salida: str) -> None:
        """Exporta las cuentas a formato JSON"""
        datos = []
        for cuenta in self.cuentas:
            datos.append({
                "codigo": cuenta.codigo,
                "nombre": cuenta.nombre,
                "nivel": cuenta.nivel,
                "padre_codigo": cuenta.padre_codigo,
                "elemento": cuenta.elemento,
                "es_movimiento": cuenta.es_movimiento,
                "esta_activo": cuenta.esta_activo
            })
        
        with open(archivo_salida, 'w', encoding='utf-8') as f:
            json.dump(datos, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Archivo JSON generado: {archivo_salida}")
    
    def exportar_csv(self, archivo_salida: str) -> None:
        """Exporta las cuentas a formato CSV"""
        with open(archivo_salida, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'Codigo', 'Nombre', 'Nivel', 'PadreCodigo', 
                'Elemento', 'EsMovimiento', 'EstaActivo'
            ])
            
            for cuenta in self.cuentas:
                writer.writerow([
                    cuenta.codigo,
                    cuenta.nombre,
                    cuenta.nivel,
                    cuenta.padre_codigo,
                    cuenta.elemento,
                    cuenta.es_movimiento,
                    cuenta.esta_activo
                ])
        
        print(f"✅ Archivo CSV generado: {archivo_salida}")


def main():
    """Función principal"""
    if len(sys.argv) != 2:
        print("Uso: python pcge_parser_completo.py <archivo_pcge.txt>")
        sys.exit(1)
    
    archivo_entrada = sys.argv[1]
    
    try:
        # Crear parser y procesar archivo
        parser = PCGEParserCompleto(archivo_entrada)
        cuentas = parser.procesar_archivo()
        
        if not cuentas:
            print("❌ No se encontraron cuentas en el archivo")
            sys.exit(1)
        
        # Validar jerarquía
        print("\n🔍 Validando jerarquía...")
        errores = parser.validar_jerarquia()
        if errores:
            print(f"⚠️  Encontrados {len(errores)} errores de jerarquía:")
            for error in errores[:10]:  # Mostrar solo los primeros 10
                print(f"   - {error}")
            if len(errores) > 10:
                print(f"   ... y {len(errores) - 10} errores más")
        else:
            print("✅ Jerarquía validada correctamente")
        
        # Exportar archivos
        base_name = archivo_entrada.replace('.txt', '')
        archivo_json = f"{base_name}_completo.json"
        archivo_csv = f"{base_name}_completo.csv"
        
        parser.exportar_json(archivo_json)
        parser.exportar_csv(archivo_csv)
        
        print(f"\n🎉 Proceso completado exitosamente!")
        print(f"   📄 Archivo JSON: {archivo_json}")
        print(f"   📄 Archivo CSV: {archivo_csv}")
        print(f"   📊 Total cuentas procesadas: {len(cuentas)}")
        
    except Exception as e:
        print(f"❌ Error durante el procesamiento: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
