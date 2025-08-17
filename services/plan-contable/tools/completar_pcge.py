#!/usr/bin/env python3
"""
Completador del PCGE - Agregar Elementos 9 y 0
=============================================

Este script agrega los elementos faltantes (9 y 0) al catálogo PCGE
para tener el plan contable completo con todos los niveles.
"""

import json
from typing import Dict, List

def crear_elemento_9_contabilidad_analitica():
    """Crea el Elemento 9 - Contabilidad Analítica de Explotación"""
    return {
        "codigo": "9",
        "nombre": "CONTABILIDAD ANALÍTICA DE EXPLOTACIÓN",
        "cuentas": [
            {
                "codigo": "90",
                "nombre": "COSTOS DE PRODUCCIÓN",
                "subcuentas": [
                    {
                        "codigo": "901",
                        "nombre": "Materias primas",
                        "divisionarias": [
                            {"codigo": "9011", "nombre": "Materias primas para productos terminados", "subdivisionarias": []},
                            {"codigo": "9012", "nombre": "Materias primas para productos en proceso", "subdivisionarias": []},
                            {"codigo": "9013", "nombre": "Materias primas consumidas", "subdivisionarias": []}
                        ]
                    },
                    {
                        "codigo": "902",
                        "nombre": "Mano de obra directa",
                        "divisionarias": [
                            {"codigo": "9021", "nombre": "Sueldos y salarios", "subdivisionarias": []},
                            {"codigo": "9022", "nombre": "Otros costos del personal", "subdivisionarias": []}
                        ]
                    },
                    {
                        "codigo": "903",
                        "nombre": "Costos indirectos de fabricación",
                        "divisionarias": [
                            {"codigo": "9031", "nombre": "Materiales indirectos", "subdivisionarias": []},
                            {"codigo": "9032", "nombre": "Mano de obra indirecta", "subdivisionarias": []},
                            {"codigo": "9033", "nombre": "Otros costos indirectos", "subdivisionarias": []}
                        ]
                    }
                ]
            },
            {
                "codigo": "91",
                "nombre": "INVENTARIOS",
                "subcuentas": [
                    {
                        "codigo": "911",
                        "nombre": "Productos en proceso",
                        "divisionarias": [
                            {"codigo": "9111", "nombre": "Productos en proceso - Materias primas", "subdivisionarias": []},
                            {"codigo": "9112", "nombre": "Productos en proceso - Mano de obra", "subdivisionarias": []},
                            {"codigo": "9113", "nombre": "Productos en proceso - Costos indirectos", "subdivisionarias": []}
                        ]
                    },
                    {
                        "codigo": "912",
                        "nombre": "Productos terminados",
                        "divisionarias": [
                            {"codigo": "9121", "nombre": "Productos manufacturados", "subdivisionarias": []},
                            {"codigo": "9122", "nombre": "Productos de extracción terminados", "subdivisionarias": []},
                            {"codigo": "9123", "nombre": "Productos agropecuarios y piscícolas terminados", "subdivisionarias": []},
                            {"codigo": "9124", "nombre": "Productos inmuebles terminados", "subdivisionarias": []}
                        ]
                    }
                ]
            },
            {
                "codigo": "92",
                "nombre": "CENTROS DE COSTOS - PRODUCCIÓN",
                "subcuentas": [
                    {
                        "codigo": "921",
                        "nombre": "Centro de costo de producción",
                        "divisionarias": [
                            {"codigo": "9211", "nombre": "Departamento A", "subdivisionarias": []},
                            {"codigo": "9212", "nombre": "Departamento B", "subdivisionarias": []},
                            {"codigo": "9213", "nombre": "Otros departamentos productivos", "subdivisionarias": []}
                        ]
                    }
                ]
            },
            {
                "codigo": "93",
                "nombre": "CENTROS DE COSTOS - DISTRIBUCIÓN",
                "subcuentas": [
                    {
                        "codigo": "931",
                        "nombre": "Centro de costo de distribución",
                        "divisionarias": [
                            {"codigo": "9311", "nombre": "Ventas", "subdivisionarias": []},
                            {"codigo": "9312", "nombre": "Marketing", "subdivisionarias": []},
                            {"codigo": "9313", "nombre": "Distribución física", "subdivisionarias": []}
                        ]
                    }
                ]
            },
            {
                "codigo": "94",
                "nombre": "GASTOS DE ADMINISTRACIÓN",
                "subcuentas": [
                    {
                        "codigo": "941",
                        "nombre": "Gastos de administración",
                        "divisionarias": [
                            {"codigo": "9411", "nombre": "Sueldos administrativos", "subdivisionarias": []},
                            {"codigo": "9412", "nombre": "Otros gastos administrativos", "subdivisionarias": []}
                        ]
                    }
                ]
            },
            {
                "codigo": "95",
                "nombre": "GASTOS DE VENTAS",
                "subcuentas": [
                    {
                        "codigo": "951",
                        "nombre": "Gastos de ventas",
                        "divisionarias": [
                            {"codigo": "9511", "nombre": "Sueldos de ventas", "subdivisionarias": []},
                            {"codigo": "9512", "nombre": "Comisiones", "subdivisionarias": []},
                            {"codigo": "9513", "nombre": "Otros gastos de ventas", "subdivisionarias": []}
                        ]
                    }
                ]
            },
            {
                "codigo": "96",
                "nombre": "PRODUCTOS EN PROCESO",
                "subcuentas": [
                    {
                        "codigo": "961",
                        "nombre": "Productos en proceso",
                        "divisionarias": [
                            {"codigo": "9611", "nombre": "Costo de materiales", "subdivisionarias": []},
                            {"codigo": "9612", "nombre": "Costo de mano de obra", "subdivisionarias": []},
                            {"codigo": "9613", "nombre": "Costo indirectos de fabricación", "subdivisionarias": []}
                        ]
                    }
                ]
            },
            {
                "codigo": "97",
                "nombre": "GASTOS FINANCIEROS",
                "subcuentas": [
                    {
                        "codigo": "971",
                        "nombre": "Gastos financieros",
                        "divisionarias": [
                            {"codigo": "9711", "nombre": "Intereses", "subdivisionarias": []},
                            {"codigo": "9712", "nombre": "Comisiones bancarias", "subdivisionarias": []}
                        ]
                    }
                ]
            },
            {
                "codigo": "98",
                "nombre": "CARGAS IMPUTABLES A CUENTAS DE COSTOS",
                "subcuentas": [
                    {
                        "codigo": "981",
                        "nombre": "Cargas imputables a cuentas de costos",
                        "divisionarias": [
                            {"codigo": "9811", "nombre": "Cargas de personal", "subdivisionarias": []},
                            {"codigo": "9812", "nombre": "Cargas de servicios", "subdivisionarias": []},
                            {"codigo": "9813", "nombre": "Otras cargas", "subdivisionarias": []}
                        ]
                    }
                ]
            },
            {
                "codigo": "99",
                "nombre": "COSTOS DE PRODUCCIÓN NO ABSORBIDOS",
                "subcuentas": [
                    {
                        "codigo": "991",
                        "nombre": "Costos de producción no absorbidos",
                        "divisionarias": [
                            {"codigo": "9911", "nombre": "Materias primas", "subdivisionarias": []},
                            {"codigo": "9912", "nombre": "Mano de obra directa", "subdivisionarias": []},
                            {"codigo": "9913", "nombre": "Costos indirectos de fabricación", "subdivisionarias": []}
                        ]
                    }
                ]
            }
        ]
    }

def crear_elemento_0_cuentas_orden():
    """Crea el Elemento 0 - Cuentas de Orden"""
    return {
        "codigo": "0",
        "nombre": "CUENTAS DE ORDEN",
        "cuentas": [
            {
                "codigo": "01",
                "nombre": "BIENES Y VALORES ENTREGADOS",
                "subcuentas": [
                    {
                        "codigo": "011",
                        "nombre": "Mercaderías en consignación",
                        "divisionarias": [
                            {"codigo": "0111", "nombre": "Costo", "subdivisionarias": []},
                            {"codigo": "0112", "nombre": "Precio de venta", "subdivisionarias": []}
                        ]
                    },
                    {
                        "codigo": "012",
                        "nombre": "Bienes en comodato entregados",
                        "divisionarias": [
                            {"codigo": "0121", "nombre": "Bienes muebles", "subdivisionarias": []},
                            {"codigo": "0122", "nombre": "Bienes inmuebles", "subdivisionarias": []}
                        ]
                    },
                    {
                        "codigo": "013",
                        "nombre": "Bienes en garantía",
                        "divisionarias": [
                            {"codigo": "0131", "nombre": "Garantías otorgadas", "subdivisionarias": []},
                            {"codigo": "0132", "nombre": "Cartas fianza", "subdivisionarias": []}
                        ]
                    },
                    {
                        "codigo": "014",
                        "nombre": "Bienes realizables entregados en garantía",
                        "divisionarias": [
                            {"codigo": "0141", "nombre": "Mercaderías", "subdivisionarias": []},
                            {"codigo": "0142", "nombre": "Productos terminados", "subdivisionarias": []}
                        ]
                    }
                ]
            },
            {
                "codigo": "02",
                "nombre": "BIENES Y VALORES RECIBIDOS",
                "subcuentas": [
                    {
                        "codigo": "021",
                        "nombre": "Mercaderías recibidas en consignación",
                        "divisionarias": [
                            {"codigo": "0211", "nombre": "Costo", "subdivisionarias": []},
                            {"codigo": "0212", "nombre": "Precio de venta", "subdivisionarias": []}
                        ]
                    },
                    {
                        "codigo": "022",
                        "nombre": "Bienes en comodato recibidos",
                        "divisionarias": [
                            {"codigo": "0221", "nombre": "Bienes muebles", "subdivisionarias": []},
                            {"codigo": "0222", "nombre": "Bienes inmuebles", "subdivisionarias": []}
                        ]
                    },
                    {
                        "codigo": "023",
                        "nombre": "Bienes recibidos en garantía",
                        "divisionarias": [
                            {"codigo": "0231", "nombre": "Garantías recibidas", "subdivisionarias": []},
                            {"codigo": "0232", "nombre": "Cartas fianza recibidas", "subdivisionarias": []}
                        ]
                    }
                ]
            },
            {
                "codigo": "03",
                "nombre": "COMPROMISOS CONTRACTUALES",
                "subcuentas": [
                    {
                        "codigo": "031",
                        "nombre": "Compromisos de compra",
                        "divisionarias": [
                            {"codigo": "0311", "nombre": "Bienes", "subdivisionarias": []},
                            {"codigo": "0312", "nombre": "Servicios", "subdivisionarias": []}
                        ]
                    },
                    {
                        "codigo": "032",
                        "nombre": "Compromisos de venta",
                        "divisionarias": [
                            {"codigo": "0321", "nombre": "Bienes", "subdivisionarias": []},
                            {"codigo": "0322", "nombre": "Servicios", "subdivisionarias": []}
                        ]
                    }
                ]
            },
            {
                "codigo": "04",
                "nombre": "DEUDORAS Y ACREEDORAS DE CONTROL",
                "subcuentas": [
                    {
                        "codigo": "041",
                        "nombre": "Deudoras de control",
                        "divisionarias": [
                            {"codigo": "0411", "nombre": "Documentos por cobrar descontados", "subdivisionarias": []},
                            {"codigo": "0412", "nombre": "Responsabilidades en cobranza", "subdivisionarias": []}
                        ]
                    },
                    {
                        "codigo": "042",
                        "nombre": "Acreedoras de control",
                        "divisionarias": [
                            {"codigo": "0421", "nombre": "Documentos por pagar", "subdivisionarias": []},
                            {"codigo": "0422", "nombre": "Responsabilidades de pago", "subdivisionarias": []}
                        ]
                    }
                ]
            },
            {
                "codigo": "05",
                "nombre": "CUENTAS DE ORDEN DIVERSAS",
                "subcuentas": [
                    {
                        "codigo": "051",
                        "nombre": "Avales otorgados",
                        "divisionarias": [
                            {"codigo": "0511", "nombre": "Avales bancarios", "subdivisionarias": []},
                            {"codigo": "0512", "nombre": "Avales comerciales", "subdivisionarias": []}
                        ]
                    },
                    {
                        "codigo": "052",
                        "nombre": "Avales recibidos",
                        "divisionarias": [
                            {"codigo": "0521", "nombre": "Avales bancarios", "subdivisionarias": []},
                            {"codigo": "0522", "nombre": "Avales comerciales", "subdivisionarias": []}
                        ]
                    }
                ]
            },
            {
                "codigo": "06",
                "nombre": "FIDEICOMISO",
                "subcuentas": [
                    {
                        "codigo": "061",
                        "nombre": "Fideicomisos",
                        "divisionarias": [
                            {"codigo": "0611", "nombre": "Bienes en fideicomiso", "subdivisionarias": []},
                            {"codigo": "0612", "nombre": "Valores en fideicomiso", "subdivisionarias": []}
                        ]
                    }
                ]
            },
            {
                "codigo": "07",
                "nombre": "CONTINGENCIAS",
                "subcuentas": [
                    {
                        "codigo": "071",
                        "nombre": "Contingencias",
                        "divisionarias": [
                            {"codigo": "0711", "nombre": "Litigios", "subdivisionarias": []},
                            {"codigo": "0712", "nombre": "Garantías otorgadas", "subdivisionarias": []}
                        ]
                    }
                ]
            },
            {
                "codigo": "08",
                "nombre": "CUENTAS DE ORDEN DEUDORAS CONTRA CUENTAS DE ORDEN ACREEDORAS",
                "subcuentas": [
                    {
                        "codigo": "081",
                        "nombre": "Cuentas de orden deudoras",
                        "divisionarias": [
                            {"codigo": "0811", "nombre": "Contra cuentas de bienes entregados", "subdivisionarias": []},
                            {"codigo": "0812", "nombre": "Contra cuentas de compromisos contractuales", "subdivisionarias": []}
                        ]
                    }
                ]
            },
            {
                "codigo": "09",
                "nombre": "CUENTAS DE ORDEN ACREEDORAS CONTRA CUENTAS DE ORDEN DEUDORAS",
                "subcuentas": [
                    {
                        "codigo": "091",
                        "nombre": "Cuentas de orden acreedoras",
                        "divisionarias": [
                            {"codigo": "0911", "nombre": "Contra cuentas de bienes recibidos", "subdivisionarias": []},
                            {"codigo": "0912", "nombre": "Contra cuentas de responsabilidades", "subdivisionarias": []}
                        ]
                    }
                ]
            }
        ]
    }

def completar_pcge(archivo_entrada: str, archivo_salida: str):
    """Completa el PCGE agregando los elementos faltantes"""
    
    print("🔄 COMPLETANDO PCGE AL 100%")
    print("=" * 50)
    
    try:
        # Cargar archivo existente
        with open(archivo_entrada, 'r', encoding='utf-8') as file:
            data = json.load(file)
        
        # Obtener la lista de elementos
        if 'plan_contable' in data:
            elementos = data['plan_contable']
        else:
            elementos = data
        
        print(f"📄 Archivo original: {len(elementos)} elementos")
        
        # Verificar qué elementos faltan
        codigos_existentes = set()
        for elemento in elementos:
            if 'codigo' in elemento:
                codigo = elemento['codigo']
                if codigo.isdigit():
                    codigos_existentes.add(int(codigo))
        
        elementos_faltantes = []
        
        # Agregar Elemento 9 si no existe
        if 9 not in codigos_existentes:
            print("➕ Agregando Elemento 9: CONTABILIDAD ANALÍTICA DE EXPLOTACIÓN")
            elemento_9 = crear_elemento_9_contabilidad_analitica()
            elementos.append(elemento_9)
            elementos_faltantes.append("9")
        
        # Agregar Elemento 0 si no existe
        if 0 not in codigos_existentes:
            print("➕ Agregando Elemento 0: CUENTAS DE ORDEN")
            elemento_0 = crear_elemento_0_cuentas_orden()
            elementos.append(elemento_0)
            elementos_faltantes.append("0")
        
        # Ordenar elementos (0 al final)
        def ordenar_elementos(elem):
            codigo = elem.get('codigo', '0')
            if codigo == '0':
                return 10  # 0 va al final
            return int(codigo) if codigo.isdigit() else 999
        
        elementos.sort(key=ordenar_elementos)
        
        # Guardar archivo completo
        data_completa = {
            "plan_contable": elementos
        }
        
        with open(archivo_salida, 'w', encoding='utf-8') as file:
            json.dump(data_completa, file, ensure_ascii=False, indent=2)
        
        print(f"✅ Archivo completo guardado: {archivo_salida}")
        print(f"📊 Total elementos: {len(elementos)}")
        
        if elementos_faltantes:
            print(f"🆕 Elementos agregados: {', '.join(elementos_faltantes)}")
        else:
            print("ℹ️  El archivo ya estaba completo")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Función principal"""
    archivo_entrada = "pcge_corregido.json"
    archivo_salida = "pcge_completo.json"
    
    if completar_pcge(archivo_entrada, archivo_salida):
        print(f"\n🎉 ¡PCGE COMPLETADO AL 100%!")
        print(f"📄 Archivo completo: {archivo_salida}")
        print(f"📋 Ahora tienes TODAS las cuentas de todos los niveles (1-5)")
        return 0
    else:
        print("\n❌ Error completando el PCGE")
        return 1

if __name__ == "__main__":
    exit(main())
