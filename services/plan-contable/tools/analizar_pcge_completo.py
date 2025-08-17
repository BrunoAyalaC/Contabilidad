#!/usr/bin/env python3
"""
Analizador del PCGE Completo
============================

Analiza el catálogo PCGE completo con todos los elementos (0-9)
y cuenta todas las cuentas por niveles.
"""

import json
from typing import Dict, List

def analizar_pcge_completo(archivo: str):
    """Analiza el PCGE completo"""
    
    print("📊 ANÁLISIS DEL PCGE COMPLETO")
    print("=" * 60)
    
    try:
        with open(archivo, 'r', encoding='utf-8') as file:
            data = json.load(file)
        
        elementos = data.get('plan_contable', [])
        
        # Contadores por nivel
        nivel_1 = 0  # Elementos (1 dígito)
        nivel_2 = 0  # Cuentas (2 dígitos) 
        nivel_3 = 0  # Subcuentas (3 dígitos)
        nivel_4 = 0  # Divisionarias (4 dígitos)
        nivel_5 = 0  # Subdivisionarias (5 dígitos)
        
        # Análisis por elemento
        resumen_elementos = {}
        
        for elemento in elementos:
            codigo_elem = elemento.get('codigo', '')
            nombre_elem = elemento.get('nombre', '')
            
            nivel_1 += 1  # Contar elemento
            
            cuentas_elem = 0
            subcuentas_elem = 0
            divisionarias_elem = 0
            subdivisionarias_elem = 0
            
            # Procesar cuentas (nivel 2)
            for cuenta in elemento.get('cuentas', []):
                nivel_2 += 1
                cuentas_elem += 1
                
                # Procesar subcuentas (nivel 3)
                for subcuenta in cuenta.get('subcuentas', []):
                    nivel_3 += 1
                    subcuentas_elem += 1
                    
                    # Procesar divisionarias (nivel 4)
                    for divisionaria in subcuenta.get('divisionarias', []):
                        nivel_4 += 1
                        divisionarias_elem += 1
                        
                        # Procesar subdivisionarias (nivel 5)
                        for subdivisionaria in divisionaria.get('subdivisionarias', []):
                            nivel_5 += 1
                            subdivisionarias_elem += 1
            
            # Guardar resumen del elemento
            total_elem = cuentas_elem + subcuentas_elem + divisionarias_elem + subdivisionarias_elem
            resumen_elementos[codigo_elem] = {
                'nombre': nombre_elem,
                'cuentas': cuentas_elem,
                'subcuentas': subcuentas_elem, 
                'divisionarias': divisionarias_elem,
                'subdivisionarias': subdivisionarias_elem,
                'total': total_elem
            }
        
        # Mostrar resultados
        print(f"🏷️  RESUMEN POR NIVELES:")
        print(f"   📁 Nivel 1 (Elementos):      {nivel_1:,}")
        print(f"   📂 Nivel 2 (Cuentas):        {nivel_2:,}")
        print(f"   📄 Nivel 3 (Subcuentas):     {nivel_3:,}")
        print(f"   📋 Nivel 4 (Divisionarias):  {nivel_4:,}")
        print(f"   📌 Nivel 5 (Subdivisionarias): {nivel_5:,}")
        
        total_cuentas = nivel_1 + nivel_2 + nivel_3 + nivel_4 + nivel_5
        print(f"\n🎯 TOTAL DE CUENTAS: {total_cuentas:,}")
        
        print(f"\n📊 DETALLE POR ELEMENTO:")
        print("   " + "="*50)
        
        for codigo in sorted(resumen_elementos.keys(), key=lambda x: int(x) if x.isdigit() else 999):
            elem = resumen_elementos[codigo]
            print(f"   📁 Elemento {codigo}: {elem['nombre']}")
            print(f"      • Cuentas (N2): {elem['cuentas']}")
            print(f"      • Subcuentas (N3): {elem['subcuentas']}")
            print(f"      • Divisionarias (N4): {elem['divisionarias']}")
            print(f"      • Subdivisionarias (N5): {elem['subdivisionarias']}")
            print(f"      📊 Subtotal: {elem['total']} cuentas")
            print()
        
        # Verificar completitud
        elementos_esperados = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
        elementos_presentes = set(resumen_elementos.keys())
        elementos_faltantes = set(elementos_esperados) - elementos_presentes
        
        print(f"✅ COMPLETITUD DEL PCGE:")
        print(f"   📈 Elementos presentes: {len(elementos_presentes)}/10")
        
        if elementos_faltantes:
            print(f"   ❌ Elementos faltantes: {', '.join(sorted(elementos_faltantes))}")
        else:
            print(f"   🎉 ¡PCGE 100% COMPLETO! Todos los elementos presentes")
        
        return {
            'total_cuentas': total_cuentas,
            'por_nivel': {
                'nivel_1': nivel_1,
                'nivel_2': nivel_2,
                'nivel_3': nivel_3,
                'nivel_4': nivel_4,
                'nivel_5': nivel_5
            },
            'por_elemento': resumen_elementos,
            'completo': len(elementos_faltantes) == 0
        }
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def main():
    """Función principal"""
    archivo = "pcge_completo.json"
    
    resultado = analizar_pcge_completo(archivo)
    
    if resultado:
        print(f"\n🎊 ¡ANÁLISIS COMPLETADO!")
        print(f"📄 Archivo: {archivo}")
        print(f"🎯 Total cuentas: {resultado['total_cuentas']:,}")
        if resultado['completo']:
            print(f"✅ PCGE 100% completo con todos los niveles")
        return 0
    else:
        print(f"\n❌ Error en el análisis")
        return 1

if __name__ == "__main__":
    exit(main())
