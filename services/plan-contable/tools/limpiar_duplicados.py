#!/usr/bin/env python3
"""
Limpiador de Duplicados en Archivo Seeder PCGE
==============================================

Este script elimina cuentas duplicadas del archivo seeder basándose en el código único.
"""

import json
from typing import List, Dict, Any, Set
from collections import defaultdict

def limpiar_duplicados_seeder(archivo_entrada: str, archivo_salida: str) -> bool:
    """Limpia duplicados del archivo seeder manteniendo la primera ocurrencia"""
    try:
        print(f"🔧 Cargando archivo: {archivo_entrada}")
        
        with open(archivo_entrada, 'r', encoding='utf-8') as file:
            cuentas = json.load(file)
        
        print(f"📊 Total de cuentas cargadas: {len(cuentas)}")
        
        # Detectar duplicados
        codigos_vistos = set()
        cuentas_limpias = []
        duplicados = defaultdict(list)
        
        for i, cuenta in enumerate(cuentas):
            codigo = cuenta.get('codigo', '')
            
            if codigo in codigos_vistos:
                duplicados[codigo].append(i)
                print(f"⚠️  Duplicado encontrado: {codigo} en posición {i}")
            else:
                codigos_vistos.add(codigo)
                cuentas_limpias.append(cuenta)
        
        print(f"\n📋 RESUMEN DE LIMPIEZA:")
        print(f"  • Cuentas originales: {len(cuentas)}")
        print(f"  • Cuentas únicas: {len(cuentas_limpias)}")
        print(f"  • Duplicados eliminados: {len(cuentas) - len(cuentas_limpias)}")
        
        if duplicados:
            print(f"\n🔍 CÓDIGOS DUPLICADOS ELIMINADOS:")
            for codigo, posiciones in duplicados.items():
                print(f"  • {codigo}: {len(posiciones)} duplicados")
        
        # Guardar archivo limpio
        with open(archivo_salida, 'w', encoding='utf-8') as file:
            json.dump(cuentas_limpias, file, ensure_ascii=False, indent=2)
        
        print(f"\n✅ Archivo limpio guardado: {archivo_salida}")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Función principal"""
    print("🧹 Limpiador de Duplicados PCGE Seeder")
    print("=" * 50)
    
    archivo_entrada = "pcge_seeder.json"
    archivo_salida = "pcge_seeder_limpio.json"
    
    if limpiar_duplicados_seeder(archivo_entrada, archivo_salida):
        print(f"\n🎉 ¡Limpieza completada exitosamente!")
        print(f"📄 Archivo original: {archivo_entrada}")
        print(f"📄 Archivo limpio: {archivo_salida}")
        return 0
    else:
        print("\n❌ Error en la limpieza")
        return 1

if __name__ == "__main__":
    exit(main())
