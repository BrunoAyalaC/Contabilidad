#!/usr/bin/env python3
"""
Convertidor de PCGE Jerárquico a Formato Seeder
==============================================

Convierte el pcge_corregido.json (formato jerárquico) al formato plano
que espera el seeder de .NET con las propiedades requeridas.
"""

import json
from typing import Dict, List, Any, Optional

class PcgeToSeederConverter:
    """Convertidor de PCGE jerárquico a formato seeder"""
    
    def __init__(self, archivo_entrada: str):
        self.archivo_entrada = archivo_entrada
        self.cuentas_planas = []
        
    def procesar_elemento(self, elemento: Dict[str, Any]) -> None:
        """Procesa un elemento del catálogo PCGE"""
        self._agregar_cuenta(
            codigo=elemento["codigo"],
            nombre=elemento["nombre"],
            elemento=elemento["codigo"],
            nivel=1,
            es_movimiento=not bool(elemento.get("cuentas", [])),
            padre_codigo=None
        )
        
        # Procesar cuentas del elemento
        for cuenta in elemento.get("cuentas", []):
            self._procesar_cuenta(cuenta, elemento["codigo"])
    
    def _procesar_cuenta(self, cuenta: Dict[str, Any], elemento: str, padre_codigo: Optional[str] = None) -> None:
        """Procesa una cuenta y sus subcuentas recursivamente"""
        nivel = self._calcular_nivel(cuenta["codigo"])
        
        self._agregar_cuenta(
            codigo=cuenta["codigo"],
            nombre=cuenta["nombre"],
            elemento=elemento,
            nivel=nivel,
            es_movimiento=not bool(cuenta.get("subcuentas", [])),
            padre_codigo=padre_codigo
        )
        
        # Procesar subcuentas
        for subcuenta in cuenta.get("subcuentas", []):
            self._procesar_subcuenta(subcuenta, elemento, cuenta["codigo"])
    
    def _procesar_subcuenta(self, subcuenta: Dict[str, Any], elemento: str, padre_codigo: str) -> None:
        """Procesa una subcuenta y sus divisionarias"""
        nivel = self._calcular_nivel(subcuenta["codigo"])
        
        self._agregar_cuenta(
            codigo=subcuenta["codigo"],
            nombre=subcuenta["nombre"],
            elemento=elemento,
            nivel=nivel,
            es_movimiento=not bool(subcuenta.get("divisionarias", [])),
            padre_codigo=padre_codigo
        )
        
        # Procesar divisionarias
        for divisionaria in subcuenta.get("divisionarias", []):
            self._procesar_divisionaria(divisionaria, elemento, subcuenta["codigo"])
    
    def _procesar_divisionaria(self, divisionaria: Dict[str, Any], elemento: str, padre_codigo: str) -> None:
        """Procesa una divisionaria y sus subdivisionarias"""
        nivel = self._calcular_nivel(divisionaria["codigo"])
        
        self._agregar_cuenta(
            codigo=divisionaria["codigo"],
            nombre=divisionaria["nombre"],
            elemento=elemento,
            nivel=nivel,
            es_movimiento=not bool(divisionaria.get("subdivisionarias", [])),
            padre_codigo=padre_codigo
        )
        
        # Procesar subdivisionarias
        for subdivisionaria in divisionaria.get("subdivisionarias", []):
            self._procesar_subdivisionaria(subdivisionaria, elemento, divisionaria["codigo"])
    
    def _procesar_subdivisionaria(self, subdivisionaria: Dict[str, Any], elemento: str, padre_codigo: str) -> None:
        """Procesa una subdivisionaria (nivel más profundo)"""
        nivel = self._calcular_nivel(subdivisionaria["codigo"])
        
        self._agregar_cuenta(
            codigo=subdivisionaria["codigo"],
            nombre=subdivisionaria["nombre"],
            elemento=elemento,
            nivel=nivel,
            es_movimiento=True,  # Las subdivisionarias siempre son de movimiento
            padre_codigo=padre_codigo
        )
    
    def _calcular_nivel(self, codigo: str) -> int:
        """Calcula el nivel jerárquico basado en la longitud del código"""
        return len(codigo)
    
    def _agregar_cuenta(self, codigo: str, nombre: str, elemento: str, nivel: int, 
                       es_movimiento: bool, padre_codigo: Optional[str]) -> None:
        """Agrega una cuenta al listado plano"""
        cuenta = {
            "codigo": codigo,
            "nombre": nombre,
            "descripcion": f"Cuenta del elemento {elemento} - {nombre}",
            "elemento": elemento,
            "nivel": nivel,
            "padre_codigo": padre_codigo,
            "es_movimiento": es_movimiento,
            "esta_activo": True
        }
        
        self.cuentas_planas.append(cuenta)
    
    def convertir(self, archivo_salida: str) -> bool:
        """Convierte el archivo jerárquico al formato seeder"""
        try:
            print(f"🔄 Cargando archivo jerárquico: {self.archivo_entrada}")
            
            # Cargar archivo jerárquico
            with open(self.archivo_entrada, 'r', encoding='utf-8') as file:
                data = json.load(file)
            
            print(f"✅ Archivo cargado correctamente")
            
            # Procesar cada elemento del plan contable
            elementos = data.get("plan_contable", [])
            print(f"📊 Procesando {len(elementos)} elementos del PCGE...")
            
            for elemento in elementos:
                self.procesar_elemento(elemento)
            
            # Ordenar por código para facilitar la importación
            self.cuentas_planas.sort(key=lambda x: x["codigo"])
            
            # Guardar en formato seeder
            with open(archivo_salida, 'w', encoding='utf-8') as file:
                json.dump(self.cuentas_planas, file, ensure_ascii=False, indent=2)
            
            print(f"✅ Archivo convertido guardado: {archivo_salida}")
            print(f"📊 Total de cuentas procesadas: {len(self.cuentas_planas)}")
            
            # Mostrar estadísticas por nivel
            self._mostrar_estadisticas()
            
            return True
            
        except Exception as e:
            print(f"❌ Error durante la conversión: {e}")
            return False
    
    def _mostrar_estadisticas(self) -> None:
        """Muestra estadísticas de la conversión"""
        print("\n📊 ESTADÍSTICAS DE CONVERSIÓN:")
        print("=" * 40)
        
        # Contar por nivel
        por_nivel = {}
        for cuenta in self.cuentas_planas:
            nivel = cuenta["nivel"]
            por_nivel[nivel] = por_nivel.get(nivel, 0) + 1
        
        for nivel in sorted(por_nivel.keys()):
            print(f"  Nivel {nivel}: {por_nivel[nivel]} cuentas")
        
        # Contar por elemento
        por_elemento = {}
        for cuenta in self.cuentas_planas:
            elemento = cuenta["elemento"]
            por_elemento[elemento] = por_elemento.get(elemento, 0) + 1
        
        print(f"\n📈 Distribución por elemento:")
        for elemento in sorted(por_elemento.keys()):
            print(f"  Elemento {elemento}: {por_elemento[elemento]} cuentas")
        
        # Contar cuentas de movimiento vs. agrupación
        movimiento = sum(1 for c in self.cuentas_planas if c["es_movimiento"])
        agrupacion = len(self.cuentas_planas) - movimiento
        
        print(f"\n🏷️  Tipos de cuenta:")
        print(f"  • Movimiento: {movimiento}")
        print(f"  • Agrupación: {agrupacion}")

def main():
    """Función principal"""
    print("🔄 Convertidor PCGE Jerárquico → Formato Seeder")
    print("=" * 50)
    
    # Archivos
    archivo_entrada = "pcge_corregido.json"
    archivo_salida = "pcge_seeder.json"
    
    # Convertir
    convertidor = PcgeToSeederConverter(archivo_entrada)
    
    if convertidor.convertir(archivo_salida):
        print(f"\n🎉 ¡Conversión completada exitosamente!")
        print(f"📄 Archivo de entrada: {archivo_entrada}")
        print(f"📄 Archivo de salida: {archivo_salida}")
        print(f"\n🚀 Listo para importar con el seeder de .NET")
        return 0
    else:
        print(f"\n❌ Error en la conversión")
        return 1

if __name__ == "__main__":
    exit(main())
