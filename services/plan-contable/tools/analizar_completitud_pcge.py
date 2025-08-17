#!/usr/bin/env python3
"""
Analizador Completo del PCGE - Verificación de Integridad
========================================================

Este script analiza si el archivo pcge_corregido.json contiene todas las cuentas
del Plan Contable General Empresarial según el estándar oficial.
"""

import json
from collections import defaultdict
from typing import Dict, List, Set

def analizar_completitud_pcge(archivo: str) -> None:
    """Analiza la completitud del catálogo PCGE"""
    
    print("🔍 ANÁLISIS DE COMPLETITUD DEL PCGE")
    print("=" * 60)
    
    try:
        # Cargar archivo
        with open(archivo, 'r', encoding='utf-8') as file:
            data = json.load(file)
        
        print(f"📄 Archivo analizado: {archivo}")
        
        # Verificar estructura del archivo
        if 'plan_contable' in data:
            elementos_data = data['plan_contable']
        else:
            elementos_data = data
        
        # Estructura esperada del PCGE completo
        elementos_pcge_completo = {
            1: "ACTIVO",
            2: "PASIVO", 
            3: "PATRIMONIO",
            4: "INGRESOS",
            5: "GASTOS",
            6: "GASTOS POR NATURALEZA",
            7: "INGRESOS Y GASTOS",
            8: "SALDOS INTERMEDIARIOS DE GESTIÓN",
            9: "CONTABILIDAD ANALÍTICA DE EXPLOTACIÓN",
            0: "CUENTAS DE ORDEN"
        }
        
        # Analizar estructura jerárquica
        elementos_encontrados = {}
        total_cuentas = 0
        
        for elemento_data in elementos_data:
            if 'codigo' in elemento_data:
                # El código del elemento es el primer dígito
                codigo_elemento = elemento_data['codigo']
                elemento_num = int(codigo_elemento) if codigo_elemento.isdigit() else None
                
                if elemento_num is not None:
                    nombre = elemento_data.get('nombre', '')
                    
                    if elemento_num not in elementos_encontrados:
                        elementos_encontrados[elemento_num] = {
                            'nombre': nombre,
                            'cuentas': [],
                            'clases': set(),
                            'divisionarias': set(),
                            'subdivisionarias': set(),
                            'subdiv_detalle': set()
                        }
                    
                    # Función recursiva para contar todas las cuentas
                    def procesar_cuenta(item, nivel=1, elemento_actual=elemento_num):
                        nonlocal total_cuentas
                        
                        codigo = item.get('codigo', '')
                        nombre_cuenta = item.get('nombre', '')
                        
                        # Registrar la cuenta
                        elementos_encontrados[elemento_actual]['cuentas'].append({
                            'codigo': codigo,
                            'nombre': nombre_cuenta,
                            'nivel': nivel
                        })
                        total_cuentas += 1
                        
                        # Clasificar por nivel
                        if nivel == 1:  # Clase (1-2 dígitos)
                            elementos_encontrados[elemento_actual]['clases'].add(codigo)
                        elif nivel == 2:  # Subcuenta (3 dígitos)
                            elementos_encontrados[elemento_actual]['divisionarias'].add(codigo)
                        elif nivel == 3:  # Divisionaria (4 dígitos)
                            elementos_encontrados[elemento_actual]['subdivisionarias'].add(codigo)
                        elif nivel >= 4:  # Subdiv. de detalle (5+ dígitos)
                            elementos_encontrados[elemento_actual]['subdiv_detalle'].add(codigo)
                        
                        # Procesar subcuentas
                        if 'cuentas' in item:
                            for cuenta in item['cuentas']:
                                procesar_cuenta(cuenta, nivel + 1, elemento_actual)
                        
                        # Procesar subcuentas (estructura alternativa)
                        if 'subcuentas' in item:
                            for subcuenta in item['subcuentas']:
                                procesar_cuenta(subcuenta, nivel + 1, elemento_actual)
                        
                        # Procesar divisionarias
                        if 'divisionarias' in item:
                            for divisionaria in item['divisionarias']:
                                procesar_cuenta(divisionaria, nivel + 1, elemento_actual)
                        
                        # Procesar subdivisionarias
                        if 'subdivisionarias' in item:
                            for subdivisionaria in item['subdivisionarias']:
                                procesar_cuenta(subdivisionaria, nivel + 1, elemento_actual)
                    
                    # Procesar este elemento
                    procesar_cuenta(elemento_data, 1, elemento_num)
        
        # Mostrar estadísticas por elemento
        print(f"\n📊 ESTADÍSTICAS POR ELEMENTO:")
        print("-" * 60)
        
        total_elementos_esperados = len(elementos_pcge_completo)
        total_elementos_encontrados = len(elementos_encontrados)
        
        for elemento_num in sorted(elementos_pcge_completo.keys()):
            nombre_esperado = elementos_pcge_completo[elemento_num]
            
            if elemento_num in elementos_encontrados:
                elemento_info = elementos_encontrados[elemento_num]
                print(f"✅ Elemento {elemento_num}: {elemento_info['nombre']}")
                print(f"   📋 Total cuentas: {len(elemento_info['cuentas'])}")
                print(f"   🔹 Clases (1 dígito): {len(elemento_info['clases'])}")
                print(f"   🔸 Divisionarias (2 dígitos): {len(elemento_info['divisionarias'])}")
                print(f"   🔸 Subdivisionarias (3 dígitos): {len(elemento_info['subdivisionarias'])}")
                print(f"   🔹 Subdiv. detalle (4+ dígitos): {len(elemento_info['subdiv_detalle'])}")
                
                # Mostrar algunas cuentas de ejemplo
                ejemplos = elemento_info['cuentas'][:3]
                for ej in ejemplos:
                    print(f"      ↳ {ej['codigo']} - {ej['nombre']}")
                if len(elemento_info['cuentas']) > 3:
                    print(f"      ↳ ... y {len(elemento_info['cuentas']) - 3} más")
                print()
            else:
                print(f"❌ Elemento {elemento_num}: {nombre_esperado} - NO ENCONTRADO")
                print()
        
        # Resumen general
        print("🎯 RESUMEN DE COMPLETITUD:")
        print("-" * 40)
        print(f"📊 Total de cuentas encontradas: {total_cuentas}")
        print(f"📊 Elementos esperados: {total_elementos_esperados}")
        print(f"📊 Elementos encontrados: {total_elementos_encontrados}")
        print(f"📊 Completitud: {(total_elementos_encontrados/total_elementos_esperados)*100:.1f}%")
        
        # Elementos faltantes
        elementos_faltantes = set(elementos_pcge_completo.keys()) - set(elementos_encontrados.keys())
        if elementos_faltantes:
            print(f"\n⚠️  ELEMENTOS FALTANTES:")
            for elemento in sorted(elementos_faltantes):
                print(f"   ❌ Elemento {elemento}: {elementos_pcge_completo[elemento]}")
        else:
            print(f"\n✅ ¡Todos los elementos del PCGE están presentes!")
        
        # Análisis de distribución esperada vs real
        print(f"\n📈 ANÁLISIS DE DISTRIBUCIÓN:")
        print("-" * 40)
        
        distribuciones_esperadas = {
            1: {"min": 200, "max": 400, "nombre": "ACTIVO"},
            2: {"min": 150, "max": 300, "nombre": "PASIVO"},
            3: {"min": 50, "max": 150, "nombre": "PATRIMONIO"},
            4: {"min": 200, "max": 400, "nombre": "INGRESOS"},
            5: {"min": 150, "max": 350, "nombre": "GASTOS"},
            6: {"min": 200, "max": 400, "nombre": "GASTOS POR NATURALEZA"},
            7: {"min": 100, "max": 250, "nombre": "INGRESOS Y GASTOS"},
            8: {"min": 50, "max": 150, "nombre": "SALDOS INTERMEDIARIOS"},
            9: {"min": 50, "max": 200, "nombre": "CONTABILIDAD ANALÍTICA"},
            0: {"min": 50, "max": 200, "nombre": "CUENTAS DE ORDEN"}
        }
        
        for elemento_num in sorted(elementos_encontrados.keys()):
            elemento_info = elementos_encontrados[elemento_num]
            cantidad = len(elemento_info['cuentas'])
            
            if elemento_num in distribuciones_esperadas:
                esperado = distribuciones_esperadas[elemento_num]
                estado = "✅" if esperado["min"] <= cantidad <= esperado["max"] else "⚠️"
                print(f"{estado} Elemento {elemento_num}: {cantidad} cuentas (esperado: {esperado['min']}-{esperado['max']})")
            else:
                print(f"❓ Elemento {elemento_num}: {cantidad} cuentas (sin referencia)")
        
        return elementos_encontrados, total_cuentas
        
    except Exception as e:
        print(f"❌ Error al analizar el archivo: {e}")
        return None, 0

def main():
    """Función principal"""
    archivo = "pcge_corregido.json"
    
    elementos, total = analizar_completitud_pcge(archivo)
    
    if elementos:
        print(f"\n🎉 ANÁLISIS COMPLETADO")
        print(f"📄 Se analizaron {total} cuentas contables")
        
        # Recomendaciones
        print(f"\n💡 RECOMENDACIONES:")
        elementos_faltantes = []
        for elem_num in [0, 9]:  # Elementos que suelen faltar
            if elem_num not in elementos:
                elementos_faltantes.append(elem_num)
        
        if elementos_faltantes:
            print("🔍 Considerar agregar los elementos faltantes si son requeridos para tu implementación")
            for elem in elementos_faltantes:
                if elem == 9:
                    print("   • Elemento 9: Para contabilidad analítica y de costos")
                elif elem == 0:
                    print("   • Elemento 0: Para cuentas de orden y contingentes")
        else:
            print("✅ El catálogo contiene todos los elementos estándar del PCGE")
    
    return 0

if __name__ == "__main__":
    exit(main())
