#!/usr/bin/env python3
"""
Conversor de PCGE JSON jerárquico a formato plano
=================================================

Convierte el archivo pcge.json (formato jerárquico) al formato plano
que usa nuestro sistema PCGE backend.
"""

import json
import os
from typing import List, Dict, Any
import unicodedata
import re

class PCGEConverter:
    """Conversor de PCGE jerárquico a plano"""
    
    def __init__(self, archivo_entrada: str):
        self.archivo_entrada = archivo_entrada
        self.cuentas_planas: List[Dict] = []
        
    def limpiar_texto(self, texto: str) -> str:
        """Limpia y corrige el texto"""
        # Corregir caracteres mal codificados comunes
        correcciones = {
            'tr�nsito': 'tránsito',
            'Dep�sitos': 'Depósitos', 
            'espec�ficos': 'específicos',
            'garant�a': 'garantía',
            'restricci�n': 'restricción',
            'compa��a': 'compañía',
            'Otro equivalentes': 'Otros equivalentes'
        }
        
        for incorrecto, correcto in correcciones.items():
            texto = texto.replace(incorrecto, correcto)
        
        # Normalizar unicode
        texto = unicodedata.normalize('NFKC', texto)
        
        # Limpiar espacios múltiples
        texto = re.sub(r'\s+', ' ', texto).strip()
        
        return texto
    
    def determinar_tipo(self, elemento: int) -> str:
        """Determina el tipo de cuenta basado en el elemento"""
        tipos = {
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
        return tipos.get(elemento, "DESCONOCIDO")
    
    def procesar_subdivisionarias(self, subdivisionarias: List[Dict], padre: str, elemento: int):
        """Procesa las subdivisionarias (5 dígitos)"""
        for subdiv in subdivisionarias:
            codigo = subdiv.get('codigo', '')
            nombre = self.limpiar_texto(subdiv.get('nombre', ''))
            
            if codigo and nombre:
                cuenta = {
                    "codigo": codigo,
                    "nombre": nombre,
                    "nivel": len(codigo),
                    "padre": padre,
                    "elemento": elemento,
                    "tipo": self.determinar_tipo(elemento)
                }
                self.cuentas_planas.append(cuenta)
    
    def procesar_divisionarias(self, divisionarias: List[Dict], padre: str, elemento: int):
        """Procesa las divisionarias (4 dígitos)"""
        for div in divisionarias:
            codigo = div.get('codigo', '')
            nombre = self.limpiar_texto(div.get('nombre', ''))
            subdivisionarias = div.get('subdivisionarias', [])
            
            if codigo and nombre:
                cuenta = {
                    "codigo": codigo,
                    "nombre": nombre,
                    "nivel": len(codigo),
                    "padre": padre,
                    "elemento": elemento,
                    "tipo": self.determinar_tipo(elemento)
                }
                self.cuentas_planas.append(cuenta)
                
                # Procesar subdivisionarias
                self.procesar_subdivisionarias(subdivisionarias, codigo, elemento)
    
    def procesar_subcuentas(self, subcuentas: List[Dict], padre: str, elemento: int):
        """Procesa las subcuentas (3 dígitos)"""
        for sub in subcuentas:
            codigo = sub.get('codigo', '')
            nombre = self.limpiar_texto(sub.get('nombre', ''))
            divisionarias = sub.get('divisionarias', [])
            
            if codigo and nombre:
                cuenta = {
                    "codigo": codigo,
                    "nombre": nombre,
                    "nivel": len(codigo),
                    "padre": padre,
                    "elemento": elemento,
                    "tipo": self.determinar_tipo(elemento)
                }
                self.cuentas_planas.append(cuenta)
                
                # Procesar divisionarias
                self.procesar_divisionarias(divisionarias, codigo, elemento)
    
    def procesar_cuentas(self, cuentas: List[Dict], padre: str, elemento: int):
        """Procesa las cuentas principales (2 dígitos)"""
        for cuenta in cuentas:
            codigo = cuenta.get('codigo', '')
            nombre = self.limpiar_texto(cuenta.get('nombre', ''))
            subcuentas = cuenta.get('subcuentas', [])
            
            if codigo and nombre:
                cuenta_obj = {
                    "codigo": codigo,
                    "nombre": nombre,
                    "nivel": len(codigo),
                    "padre": padre,
                    "elemento": elemento,
                    "tipo": self.determinar_tipo(elemento)
                }
                self.cuentas_planas.append(cuenta_obj)
                
                # Procesar subcuentas
                self.procesar_subcuentas(subcuentas, codigo, elemento)
    
    def convertir(self) -> bool:
        """Convierte el archivo jerárquico a formato plano"""
        try:
            print(f"Cargando archivo: {self.archivo_entrada}")
            
            # Probar diferentes codificaciones
            encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
            data = None
            
            for encoding in encodings:
                try:
                    with open(self.archivo_entrada, 'r', encoding=encoding) as file:
                        data = json.load(file)
                    print(f"Archivo cargado con codificación: {encoding}")
                    break
                except (UnicodeDecodeError, json.JSONDecodeError):
                    continue
            
            if data is None:
                raise Exception("No se pudo cargar el archivo con ninguna codificación")
            
            plan_contable = data.get('plan_contable', [])
            print(f"Elementos encontrados: {len(plan_contable)}")
            
            # Procesar cada elemento
            for elemento_data in plan_contable:
                codigo_elemento = elemento_data.get('codigo', '')
                nombre_elemento = self.limpiar_texto(elemento_data.get('nombre', ''))
                cuentas = elemento_data.get('cuentas', [])
                
                if codigo_elemento and nombre_elemento:
                    elemento_num = int(codigo_elemento)
                    
                    # Agregar el elemento como cuenta raíz
                    elemento_cuenta = {
                        "codigo": codigo_elemento,
                        "nombre": nombre_elemento,
                        "nivel": len(codigo_elemento),
                        "padre": None,
                        "elemento": elemento_num,
                        "tipo": self.determinar_tipo(elemento_num)
                    }
                    self.cuentas_planas.append(elemento_cuenta)
                    
                    # Procesar cuentas del elemento
                    self.procesar_cuentas(cuentas, codigo_elemento, elemento_num)
            
            print(f"Total de cuentas procesadas: {len(self.cuentas_planas)}")
            return True
            
        except Exception as e:
            print(f"Error durante la conversión: {e}")
            return False
    
    def exportar_json(self, archivo_salida: str) -> bool:
        """Exporta las cuentas a formato JSON plano"""
        try:
            with open(archivo_salida, 'w', encoding='utf-8') as file:
                json.dump(self.cuentas_planas, file, ensure_ascii=False, indent=2)
            
            print(f"Exportado a JSON: {archivo_salida}")
            return True
            
        except Exception as e:
            print(f"Error exportando JSON: {e}")
            return False
    
    def exportar_csv(self, archivo_salida: str) -> bool:
        """Exporta las cuentas a formato CSV"""
        try:
            import csv
            
            with open(archivo_salida, 'w', newline='', encoding='utf-8') as file:
                writer = csv.writer(file)
                
                # Encabezados
                writer.writerow(['codigo', 'nombre', 'nivel', 'padre', 'elemento', 'tipo'])
                
                # Datos
                for cuenta in self.cuentas_planas:
                    writer.writerow([
                        cuenta['codigo'],
                        cuenta['nombre'],
                        cuenta['nivel'],
                        cuenta['padre'] or '',
                        cuenta['elemento'],
                        cuenta['tipo']
                    ])
            
            print(f"Exportado a CSV: {archivo_salida}")
            return True
            
        except Exception as e:
            print(f"Error exportando CSV: {e}")
            return False
    
    def generar_estadisticas(self) -> Dict:
        """Genera estadísticas del catálogo convertido"""
        stats = {
            'total_cuentas': len(self.cuentas_planas),
            'por_nivel': {},
            'por_elemento': {},
            'por_tipo': {}
        }
        
        for cuenta in self.cuentas_planas:
            # Por nivel
            nivel = cuenta['nivel']
            stats['por_nivel'][nivel] = stats['por_nivel'].get(nivel, 0) + 1
            
            # Por elemento
            elemento = cuenta['elemento']
            stats['por_elemento'][elemento] = stats['por_elemento'].get(elemento, 0) + 1
            
            # Por tipo
            tipo = cuenta['tipo']
            stats['por_tipo'][tipo] = stats['por_tipo'].get(tipo, 0) + 1
        
        return stats

def main():
    """Función principal"""
    print("🔄 Conversor PCGE - Jerárquico a Plano")
    print("=" * 50)
    
    # Rutas de archivos
    archivo_entrada = "pcge.json"
    archivo_json_salida = "services/plan-contable/data/pcge_convertido.json"
    archivo_csv_salida = "services/plan-contable/data/pcge_convertido.csv"
    
    # Verificar que existe el archivo de entrada
    if not os.path.exists(archivo_entrada):
        print(f"❌ Error: No se encuentra el archivo {archivo_entrada}")
        return 1
    
    # Crear directorio de salida si no existe
    os.makedirs(os.path.dirname(archivo_json_salida), exist_ok=True)
    
    # Convertir
    converter = PCGEConverter(archivo_entrada)
    
    if converter.convertir():
        # Exportar resultados
        converter.exportar_json(archivo_json_salida)
        converter.exportar_csv(archivo_csv_salida)
        
        # Mostrar estadísticas
        stats = converter.generar_estadisticas()
        print("\n📊 ESTADÍSTICAS:")
        print(f"Total de cuentas: {stats['total_cuentas']}")
        print(f"Por nivel: {stats['por_nivel']}")
        print(f"Por elemento: {stats['por_elemento']}")
        
        print(f"\n✅ Conversión completada exitosamente")
        print(f"📄 JSON generado: {archivo_json_salida}")
        print(f"📄 CSV generado: {archivo_csv_salida}")
        
        return 0
    else:
        print("\n❌ Error en la conversión")
        return 1

if __name__ == "__main__":
    exit(main())
