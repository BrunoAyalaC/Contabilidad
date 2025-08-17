#!/usr/bin/env python3
"""
Generador de Seeder para PCGE Completo
======================================

Convierte el PCGE completo con todos los elementos (0-9) y niveles (1-5)
al formato seeder para importar a PostgreSQL.
"""

import json
from typing import Dict, List

def convertir_a_seeder_completo(archivo_entrada: str, archivo_salida: str):
    """Convierte el PCGE completo al formato seeder"""
    
    print("🔄 GENERANDO SEEDER DEL PCGE COMPLETO")
    print("=" * 50)
    
    try:
        with open(archivo_entrada, 'r', encoding='utf-8') as file:
            data = json.load(file)
        
        elementos = data.get('plan_contable', [])
        seeder_data = []
        contador = 1
        
        print(f"📄 Procesando {len(elementos)} elementos...")
        
        for elemento in elementos:
            codigo_elemento = elemento.get('codigo', '')
            nombre_elemento = elemento.get('nombre', '')
            
            # Agregar elemento (Nivel 1)
            seeder_data.append({
                "id": contador,
                "codigo": codigo_elemento,
                "nombre": nombre_elemento,
                "nivel": 1,
                "padre_id": None,
                "descripcion": f"Elemento {codigo_elemento} del Plan Contable General Empresarial",
                "estado": True
            })
            elemento_id = contador
            contador += 1
            
            # Procesar cuentas (Nivel 2)
            for cuenta in elemento.get('cuentas', []):
                codigo_cuenta = cuenta.get('codigo', '')
                nombre_cuenta = cuenta.get('nombre', '')
                
                seeder_data.append({
                    "id": contador,
                    "codigo": codigo_cuenta,
                    "nombre": nombre_cuenta,
                    "nivel": 2,
                    "padre_id": elemento_id,
                    "descripcion": f"Cuenta {codigo_cuenta} del elemento {codigo_elemento}",
                    "estado": True
                })
                cuenta_id = contador
                contador += 1
                
                # Procesar subcuentas (Nivel 3)
                for subcuenta in cuenta.get('subcuentas', []):
                    codigo_subcuenta = subcuenta.get('codigo', '')
                    nombre_subcuenta = subcuenta.get('nombre', '')
                    
                    seeder_data.append({
                        "id": contador,
                        "codigo": codigo_subcuenta,
                        "nombre": nombre_subcuenta,
                        "nivel": 3,
                        "padre_id": cuenta_id,
                        "descripcion": f"Subcuenta {codigo_subcuenta} de la cuenta {codigo_cuenta}",
                        "estado": True
                    })
                    subcuenta_id = contador
                    contador += 1
                    
                    # Procesar divisionarias (Nivel 4)
                    for divisionaria in subcuenta.get('divisionarias', []):
                        codigo_divisionaria = divisionaria.get('codigo', '')
                        nombre_divisionaria = divisionaria.get('nombre', '')
                        
                        seeder_data.append({
                            "id": contador,
                            "codigo": codigo_divisionaria,
                            "nombre": nombre_divisionaria,
                            "nivel": 4,
                            "padre_id": subcuenta_id,
                            "descripcion": f"Divisionaria {codigo_divisionaria} de la subcuenta {codigo_subcuenta}",
                            "estado": True
                        })
                        divisionaria_id = contador
                        contador += 1
                        
                        # Procesar subdivisionarias (Nivel 5)
                        for subdivisionaria in divisionaria.get('subdivisionarias', []):
                            codigo_subdivisionaria = subdivisionaria.get('codigo', '')
                            nombre_subdivisionaria = subdivisionaria.get('nombre', '')
                            
                            seeder_data.append({
                                "id": contador,
                                "codigo": codigo_subdivisionaria,
                                "nombre": nombre_subdivisionaria,
                                "nivel": 5,
                                "padre_id": divisionaria_id,
                                "descripcion": f"Subdivisionaria {codigo_subdivisionaria} de la divisionaria {codigo_divisionaria}",
                                "estado": True
                            })
                            contador += 1
        
        # Guardar archivo seeder
        with open(archivo_salida, 'w', encoding='utf-8') as file:
            json.dump(seeder_data, file, ensure_ascii=False, indent=2)
        
        total_cuentas = len(seeder_data)
        print(f"✅ Seeder generado: {archivo_salida}")
        print(f"📊 Total cuentas: {total_cuentas:,}")
        
        # Mostrar resumen por nivel
        niveles = {}
        for cuenta in seeder_data:
            nivel = cuenta['nivel']
            niveles[nivel] = niveles.get(nivel, 0) + 1
        
        print(f"\n📈 DISTRIBUCIÓN POR NIVELES:")
        for nivel in sorted(niveles.keys()):
            print(f"   Nivel {nivel}: {niveles[nivel]:,} cuentas")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Función principal"""
    archivo_entrada = "pcge_completo.json"
    archivo_salida = "pcge_completo_seeder.json"
    
    if convertir_a_seeder_completo(archivo_entrada, archivo_salida):
        print(f"\n🎉 ¡SEEDER COMPLETO GENERADO!")
        print(f"📄 Archivo: {archivo_salida}")
        print(f"🎯 Listo para importar a PostgreSQL")
        print(f"💾 Contiene TODAS las cuentas de todos los niveles")
        return 0
    else:
        print(f"\n❌ Error generando el seeder")
        return 1

if __name__ == "__main__":
    exit(main())
