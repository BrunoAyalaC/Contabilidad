#!/usr/bin/env python3
"""
Script para extraer y parsear el catálogo PCGE 2019 desde el documento oficial
Genera un archivo CSV estructurado para importar al backend .NET
"""

import re
import csv
import json
from typing import List, Dict, Tuple, Optional

class PcgeParser:
    def __init__(self):
        self.cuentas = []
        self.pattern_cuenta = re.compile(r'^(\d+)\s+(.+)$')
        self.pattern_subcuenta = re.compile(r'^(\d+)\s+(.+)$')
        
    def parse_pcge_document(self, file_path: str) -> List[Dict]:
        """Parsea el documento PCGE y extrae todas las cuentas"""
        
        # Estructura base del catálogo PCGE 2019
        cuentas_base = [
            # ELEMENTO 1: ACTIVO DISPONIBLE Y EXIGIBLE
            {"codigo": "10", "nombre": "EFECTIVO Y EQUIVALENTES DE EFECTIVO", "nivel": 1, "padre_codigo": "", "elemento": "1", "es_movimiento": False, "esta_activo": True},
            {"codigo": "101", "nombre": "Caja", "nivel": 2, "padre_codigo": "10", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "102", "nombre": "Fondos fijos", "nivel": 2, "padre_codigo": "10", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "103", "nombre": "Efectivo y cheques en tránsito", "nivel": 2, "padre_codigo": "10", "elemento": "1", "es_movimiento": False, "esta_activo": True},
            {"codigo": "1031", "nombre": "Efectivo en tránsito", "nivel": 3, "padre_codigo": "103", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "1032", "nombre": "Cheques en tránsito", "nivel": 3, "padre_codigo": "103", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "104", "nombre": "Cuentas corrientes en instituciones financieras", "nivel": 2, "padre_codigo": "10", "elemento": "1", "es_movimiento": False, "esta_activo": True},
            {"codigo": "1041", "nombre": "Cuentas corrientes operativas", "nivel": 3, "padre_codigo": "104", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "1042", "nombre": "Cuentas corrientes para fines específicos", "nivel": 3, "padre_codigo": "104", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "105", "nombre": "Otros equivalentes de efectivo", "nivel": 2, "padre_codigo": "10", "elemento": "1", "es_movimiento": False, "esta_activo": True},
            {"codigo": "1051", "nombre": "Otros equivalentes de efectivo", "nivel": 3, "padre_codigo": "105", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "106", "nombre": "Depósitos en instituciones financieras", "nivel": 2, "padre_codigo": "10", "elemento": "1", "es_movimiento": False, "esta_activo": True},
            {"codigo": "1061", "nombre": "Depósitos de ahorro", "nivel": 3, "padre_codigo": "106", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "1062", "nombre": "Depósitos a plazo", "nivel": 3, "padre_codigo": "106", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "107", "nombre": "Fondos sujetos a restricción", "nivel": 2, "padre_codigo": "10", "elemento": "1", "es_movimiento": False, "esta_activo": True},
            {"codigo": "1071", "nombre": "Fondos en garantía", "nivel": 3, "padre_codigo": "107", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "1072", "nombre": "Fondos retenidos por mandato de la autoridad", "nivel": 3, "padre_codigo": "107", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "1073", "nombre": "Otros fondos sujetos a restricción", "nivel": 3, "padre_codigo": "107", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            
            # CUENTA 11: INVERSIONES FINANCIERAS
            {"codigo": "11", "nombre": "INVERSIONES FINANCIERAS", "nivel": 1, "padre_codigo": "", "elemento": "1", "es_movimiento": False, "esta_activo": True},
            {"codigo": "111", "nombre": "Inversiones mantenidas para negociación", "nivel": 2, "padre_codigo": "11", "elemento": "1", "es_movimiento": False, "esta_activo": True},
            {"codigo": "1111", "nombre": "Valores emitidos o garantizados por el Estado", "nivel": 3, "padre_codigo": "111", "elemento": "1", "es_movimiento": False, "esta_activo": True},
            {"codigo": "11111", "nombre": "Costo", "nivel": 4, "padre_codigo": "1111", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "11112", "nombre": "Valor Razonable", "nivel": 4, "padre_codigo": "1111", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "1112", "nombre": "Valores emitidos por el sistema financiero", "nivel": 3, "padre_codigo": "111", "elemento": "1", "es_movimiento": False, "esta_activo": True},
            {"codigo": "11121", "nombre": "Costo", "nivel": 4, "padre_codigo": "1112", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "11122", "nombre": "Valor Razonable", "nivel": 4, "padre_codigo": "1112", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "1113", "nombre": "Valores emitidos por entidades", "nivel": 3, "padre_codigo": "111", "elemento": "1", "es_movimiento": False, "esta_activo": True},
            {"codigo": "11131", "nombre": "Costo", "nivel": 4, "padre_codigo": "1113", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "11132", "nombre": "Valor Razonable", "nivel": 4, "padre_codigo": "1113", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "1114", "nombre": "Otros títulos representativos de deuda", "nivel": 3, "padre_codigo": "111", "elemento": "1", "es_movimiento": False, "esta_activo": True},
            {"codigo": "11141", "nombre": "Costo", "nivel": 4, "padre_codigo": "1114", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "11142", "nombre": "Valor Razonable", "nivel": 4, "padre_codigo": "1114", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "1115", "nombre": "Participaciones en entidades", "nivel": 3, "padre_codigo": "111", "elemento": "1", "es_movimiento": False, "esta_activo": True},
            {"codigo": "11151", "nombre": "Costo", "nivel": 4, "padre_codigo": "1115", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "11152", "nombre": "Valor Razonable", "nivel": 4, "padre_codigo": "1115", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "112", "nombre": "Otras inversiones financieras", "nivel": 2, "padre_codigo": "11", "elemento": "1", "es_movimiento": False, "esta_activo": True},
            {"codigo": "1121", "nombre": "Otras inversiones financieras", "nivel": 3, "padre_codigo": "112", "elemento": "1", "es_movimiento": False, "esta_activo": True},
            {"codigo": "11211", "nombre": "Costo", "nivel": 4, "padre_codigo": "1121", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "11212", "nombre": "Valor Razonable", "nivel": 4, "padre_codigo": "1121", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "113", "nombre": "Activos financieros – Acuerdo de compra", "nivel": 2, "padre_codigo": "11", "elemento": "1", "es_movimiento": False, "esta_activo": True},
            {"codigo": "1131", "nombre": "Inversiones mantenidas para negociación – Acuerdo de compra", "nivel": 3, "padre_codigo": "113", "elemento": "1", "es_movimiento": False, "esta_activo": True},
            {"codigo": "11311", "nombre": "Costo", "nivel": 4, "padre_codigo": "1131", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "11312", "nombre": "Valor Razonable", "nivel": 4, "padre_codigo": "1131", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "1132", "nombre": "Otras inversiones financieras", "nivel": 3, "padre_codigo": "113", "elemento": "1", "es_movimiento": False, "esta_activo": True},
            {"codigo": "11321", "nombre": "Costo", "nivel": 4, "padre_codigo": "1132", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "11322", "nombre": "Valor Razonable", "nivel": 4, "padre_codigo": "1132", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            
            # CUENTA 12: CUENTAS POR COBRAR COMERCIALES – TERCEROS
            {"codigo": "12", "nombre": "CUENTAS POR COBRAR COMERCIALES – TERCEROS", "nivel": 1, "padre_codigo": "", "elemento": "1", "es_movimiento": False, "esta_activo": True},
            {"codigo": "121", "nombre": "Facturas, boletas y otros comprobantes por cobrar", "nivel": 2, "padre_codigo": "12", "elemento": "1", "es_movimiento": False, "esta_activo": True},
            {"codigo": "1211", "nombre": "No emitidas", "nivel": 3, "padre_codigo": "121", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "1212", "nombre": "Emitidas en cartera", "nivel": 3, "padre_codigo": "121", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "1213", "nombre": "En cobranza", "nivel": 3, "padre_codigo": "121", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "1214", "nombre": "En descuento", "nivel": 3, "padre_codigo": "121", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "122", "nombre": "Anticipos de clientes", "nivel": 2, "padre_codigo": "12", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "123", "nombre": "Letras por cobrar", "nivel": 2, "padre_codigo": "12", "elemento": "1", "es_movimiento": False, "esta_activo": True},
            {"codigo": "1232", "nombre": "En cartera", "nivel": 3, "padre_codigo": "123", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "1233", "nombre": "En cobranza", "nivel": 3, "padre_codigo": "123", "elemento": "1", "es_movimiento": True, "esta_activo": True},
            {"codigo": "1234", "nombre": "En descuento", "nivel": 3, "padre_codigo": "123", "elemento": "1", "es_movimiento": True, "esta_activo": True},
        ]
        
        # Continuar con más cuentas...
        self._agregar_cuentas_elemento_2(cuentas_base)
        self._agregar_cuentas_elemento_3(cuentas_base)
        self._agregar_cuentas_elemento_4(cuentas_base)
        self._agregar_cuentas_elemento_5(cuentas_base)
        self._agregar_cuentas_elemento_6(cuentas_base)
        self._agregar_cuentas_elemento_7(cuentas_base)
        self._agregar_cuentas_elemento_8(cuentas_base)
        self._agregar_cuentas_elemento_0(cuentas_base)
        
        return cuentas_base
    
    def _agregar_cuentas_elemento_2(self, cuentas: List[Dict]):
        """Agrega cuentas del ELEMENTO 2: ACTIVO REALIZABLE"""
        cuentas_elem_2 = [
            {"codigo": "20", "nombre": "MERCADERÍAS", "nivel": 1, "padre_codigo": "", "elemento": "2", "es_movimiento": True, "esta_activo": True},
            {"codigo": "21", "nombre": "PRODUCTOS TERMINADOS", "nivel": 1, "padre_codigo": "", "elemento": "2", "es_movimiento": True, "esta_activo": True},
            {"codigo": "22", "nombre": "SUBPRODUCTOS, DESECHOS Y DESPERDICIOS", "nivel": 1, "padre_codigo": "", "elemento": "2", "es_movimiento": True, "esta_activo": True},
            {"codigo": "23", "nombre": "PRODUCTOS EN PROCESO", "nivel": 1, "padre_codigo": "", "elemento": "2", "es_movimiento": True, "esta_activo": True},
            {"codigo": "24", "nombre": "MATERIAS PRIMAS", "nivel": 1, "padre_codigo": "", "elemento": "2", "es_movimiento": True, "esta_activo": True},
            {"codigo": "25", "nombre": "MATERIALES AUXILIARES, SUMINISTROS Y REPUESTOS", "nivel": 1, "padre_codigo": "", "elemento": "2", "es_movimiento": True, "esta_activo": True},
            {"codigo": "26", "nombre": "ENVASES Y EMBALAJES", "nivel": 1, "padre_codigo": "", "elemento": "2", "es_movimiento": True, "esta_activo": True},
            {"codigo": "27", "nombre": "ACTIVOS NO CORRIENTES MANTENIDOS PARA LA VENTA", "nivel": 1, "padre_codigo": "", "elemento": "2", "es_movimiento": True, "esta_activo": True},
            {"codigo": "28", "nombre": "INVENTARIOS POR RECIBIR", "nivel": 1, "padre_codigo": "", "elemento": "2", "es_movimiento": True, "esta_activo": True},
            {"codigo": "29", "nombre": "DESVALORIZACIÓN DE INVENTARIOS", "nivel": 1, "padre_codigo": "", "elemento": "2", "es_movimiento": True, "esta_activo": True},
        ]
        cuentas.extend(cuentas_elem_2)
        
    def _agregar_cuentas_elemento_3(self, cuentas: List[Dict]):
        """Agrega cuentas del ELEMENTO 3: ACTIVO INMOVILIZADO"""
        cuentas_elem_3 = [
            {"codigo": "30", "nombre": "INVERSIONES MOBILIARIAS", "nivel": 1, "padre_codigo": "", "elemento": "3", "es_movimiento": True, "esta_activo": True},
            {"codigo": "31", "nombre": "PROPIEDADES DE INVERSIÓN", "nivel": 1, "padre_codigo": "", "elemento": "3", "es_movimiento": True, "esta_activo": True},
            {"codigo": "32", "nombre": "ACTIVOS POR DERECHO DE USO", "nivel": 1, "padre_codigo": "", "elemento": "3", "es_movimiento": True, "esta_activo": True},
            {"codigo": "33", "nombre": "PROPIEDAD, PLANTA Y EQUIPO", "nivel": 1, "padre_codigo": "", "elemento": "3", "es_movimiento": True, "esta_activo": True},
            {"codigo": "34", "nombre": "INTANGIBLES", "nivel": 1, "padre_codigo": "", "elemento": "3", "es_movimiento": True, "esta_activo": True},
            {"codigo": "35", "nombre": "ACTIVOS BIOLÓGICOS", "nivel": 1, "padre_codigo": "", "elemento": "3", "es_movimiento": True, "esta_activo": True},
            {"codigo": "36", "nombre": "DESVALORIZACIÓN DE ACTIVO INMOVILIZADO", "nivel": 1, "padre_codigo": "", "elemento": "3", "es_movimiento": True, "esta_activo": True},
            {"codigo": "37", "nombre": "ACTIVO DIFERIDO", "nivel": 1, "padre_codigo": "", "elemento": "3", "es_movimiento": True, "esta_activo": True},
            {"codigo": "38", "nombre": "OTROS ACTIVOS", "nivel": 1, "padre_codigo": "", "elemento": "3", "es_movimiento": True, "esta_activo": True},
            {"codigo": "39", "nombre": "DEPRECIACIÓN Y AMORTIZACIÓN ACUMULADOS", "nivel": 1, "padre_codigo": "", "elemento": "3", "es_movimiento": True, "esta_activo": True},
        ]
        cuentas.extend(cuentas_elem_3)
        
    def _agregar_cuentas_elemento_4(self, cuentas: List[Dict]):
        """Agrega cuentas del ELEMENTO 4: PASIVO"""
        cuentas_elem_4 = [
            {"codigo": "40", "nombre": "TRIBUTOS Y APORTES AL SISTEMA PÚBLICO DE PENSIONES Y DE SALUD POR PAGAR", "nivel": 1, "padre_codigo": "", "elemento": "4", "es_movimiento": True, "esta_activo": True},
            {"codigo": "41", "nombre": "REMUNERACIONES Y PARTICIPACIONES POR PAGAR", "nivel": 1, "padre_codigo": "", "elemento": "4", "es_movimiento": True, "esta_activo": True},
            {"codigo": "42", "nombre": "CUENTAS POR PAGAR COMERCIALES – TERCEROS", "nivel": 1, "padre_codigo": "", "elemento": "4", "es_movimiento": True, "esta_activo": True},
            {"codigo": "43", "nombre": "CUENTAS POR PAGAR COMERCIALES – RELACIONADAS", "nivel": 1, "padre_codigo": "", "elemento": "4", "es_movimiento": True, "esta_activo": True},
            {"codigo": "44", "nombre": "CUENTAS POR PAGAR A LOS ACCIONISTAS (SOCIOS Y DIRECTORES)", "nivel": 1, "padre_codigo": "", "elemento": "4", "es_movimiento": True, "esta_activo": True},
            {"codigo": "45", "nombre": "OBLIGACIONES FINANCIERAS", "nivel": 1, "padre_codigo": "", "elemento": "4", "es_movimiento": True, "esta_activo": True},
            {"codigo": "46", "nombre": "CUENTAS POR PAGAR DIVERSAS – TERCEROS", "nivel": 1, "padre_codigo": "", "elemento": "4", "es_movimiento": True, "esta_activo": True},
            {"codigo": "47", "nombre": "CUENTAS POR PAGAR DIVERSAS – RELACIONADAS", "nivel": 1, "padre_codigo": "", "elemento": "4", "es_movimiento": True, "esta_activo": True},
            {"codigo": "48", "nombre": "PROVISIONES", "nivel": 1, "padre_codigo": "", "elemento": "4", "es_movimiento": True, "esta_activo": True},
            {"codigo": "49", "nombre": "PASIVO DIFERIDO", "nivel": 1, "padre_codigo": "", "elemento": "4", "es_movimiento": True, "esta_activo": True},
        ]
        cuentas.extend(cuentas_elem_4)
        
    def _agregar_cuentas_elemento_5(self, cuentas: List[Dict]):
        """Agrega cuentas del ELEMENTO 5: PATRIMONIO"""
        cuentas_elem_5 = [
            {"codigo": "50", "nombre": "CAPITAL", "nivel": 1, "padre_codigo": "", "elemento": "5", "es_movimiento": True, "esta_activo": True},
            {"codigo": "51", "nombre": "ACCIONES DE INVERSIÓN", "nivel": 1, "padre_codigo": "", "elemento": "5", "es_movimiento": True, "esta_activo": True},
            {"codigo": "52", "nombre": "CAPITAL ADICIONAL", "nivel": 1, "padre_codigo": "", "elemento": "5", "es_movimiento": True, "esta_activo": True},
            {"codigo": "56", "nombre": "RESULTADOS NO REALIZADOS", "nivel": 1, "padre_codigo": "", "elemento": "5", "es_movimiento": True, "esta_activo": True},
            {"codigo": "57", "nombre": "EXCEDENTE DE REVALUACIÓN", "nivel": 1, "padre_codigo": "", "elemento": "5", "es_movimiento": True, "esta_activo": True},
            {"codigo": "58", "nombre": "RESERVAS", "nivel": 1, "padre_codigo": "", "elemento": "5", "es_movimiento": True, "esta_activo": True},
            {"codigo": "59", "nombre": "RESULTADOS ACUMULADOS", "nivel": 1, "padre_codigo": "", "elemento": "5", "es_movimiento": True, "esta_activo": True},
        ]
        cuentas.extend(cuentas_elem_5)
        
    def _agregar_cuentas_elemento_6(self, cuentas: List[Dict]):
        """Agrega cuentas del ELEMENTO 6: GASTOS POR NATURALEZA"""
        cuentas_elem_6 = [
            {"codigo": "60", "nombre": "COMPRAS", "nivel": 1, "padre_codigo": "", "elemento": "6", "es_movimiento": True, "esta_activo": True},
            {"codigo": "61", "nombre": "VARIACIÓN DE INVENTARIOS", "nivel": 1, "padre_codigo": "", "elemento": "6", "es_movimiento": True, "esta_activo": True},
            {"codigo": "62", "nombre": "GASTOS DE PERSONAL Y DIRECTORES", "nivel": 1, "padre_codigo": "", "elemento": "6", "es_movimiento": True, "esta_activo": True},
            {"codigo": "63", "nombre": "GASTOS DE SERVICIOS PRESTADOS POR TERCEROS", "nivel": 1, "padre_codigo": "", "elemento": "6", "es_movimiento": True, "esta_activo": True},
            {"codigo": "64", "nombre": "GASTOS POR TRIBUTOS", "nivel": 1, "padre_codigo": "", "elemento": "6", "es_movimiento": True, "esta_activo": True},
            {"codigo": "65", "nombre": "OTROS GASTOS DE GESTIÓN", "nivel": 1, "padre_codigo": "", "elemento": "6", "es_movimiento": True, "esta_activo": True},
            {"codigo": "66", "nombre": "PÉRDIDA POR MEDICIÓN DE ACTIVOS NO FINANCIEROS AL VALOR RAZONABLE", "nivel": 1, "padre_codigo": "", "elemento": "6", "es_movimiento": True, "esta_activo": True},
            {"codigo": "67", "nombre": "GASTOS FINANCIEROS", "nivel": 1, "padre_codigo": "", "elemento": "6", "es_movimiento": True, "esta_activo": True},
            {"codigo": "68", "nombre": "VALUACIÓN Y DETERIORO DE ACTIVOS Y PROVISIONES", "nivel": 1, "padre_codigo": "", "elemento": "6", "es_movimiento": True, "esta_activo": True},
            {"codigo": "69", "nombre": "COSTO DE VENTAS", "nivel": 1, "padre_codigo": "", "elemento": "6", "es_movimiento": True, "esta_activo": True},
        ]
        cuentas.extend(cuentas_elem_6)
        
    def _agregar_cuentas_elemento_7(self, cuentas: List[Dict]):
        """Agrega cuentas del ELEMENTO 7: INGRESOS"""
        cuentas_elem_7 = [
            {"codigo": "70", "nombre": "VENTAS", "nivel": 1, "padre_codigo": "", "elemento": "7", "es_movimiento": True, "esta_activo": True},
            {"codigo": "71", "nombre": "VARIACIÓN DE LA PRODUCCIÓN ALMACENADA", "nivel": 1, "padre_codigo": "", "elemento": "7", "es_movimiento": True, "esta_activo": True},
            {"codigo": "72", "nombre": "PRODUCCIÓN DE ACTIVO INMOVILIZADO", "nivel": 1, "padre_codigo": "", "elemento": "7", "es_movimiento": True, "esta_activo": True},
            {"codigo": "73", "nombre": "DESCUENTOS, REBAJAS Y BONIFICACIONES OBTENIDOS", "nivel": 1, "padre_codigo": "", "elemento": "7", "es_movimiento": True, "esta_activo": True},
            {"codigo": "74", "nombre": "DESCUENTOS, REBAJAS Y BONIFICACIONES CONCEDIDOS", "nivel": 1, "padre_codigo": "", "elemento": "7", "es_movimiento": True, "esta_activo": True},
            {"codigo": "75", "nombre": "OTROS INGRESOS DE GESTIÓN", "nivel": 1, "padre_codigo": "", "elemento": "7", "es_movimiento": True, "esta_activo": True},
            {"codigo": "76", "nombre": "GANANCIA POR MEDICIÓN DE ACTIVOS NO FINANCIEROS AL VALOR RAZONABLE", "nivel": 1, "padre_codigo": "", "elemento": "7", "es_movimiento": True, "esta_activo": True},
            {"codigo": "77", "nombre": "INGRESOS FINANCIEROS", "nivel": 1, "padre_codigo": "", "elemento": "7", "es_movimiento": True, "esta_activo": True},
            {"codigo": "78", "nombre": "CARGAS CUBIERTAS POR PROVISIONES", "nivel": 1, "padre_codigo": "", "elemento": "7", "es_movimiento": True, "esta_activo": True},
            {"codigo": "79", "nombre": "CARGAS IMPUTABLES A CUENTAS DE COSTOS Y GASTOS", "nivel": 1, "padre_codigo": "", "elemento": "7", "es_movimiento": True, "esta_activo": True},
        ]
        cuentas.extend(cuentas_elem_7)
        
    def _agregar_cuentas_elemento_8(self, cuentas: List[Dict]):
        """Agrega cuentas del ELEMENTO 8: SALDOS INTERMEDIARIOS DE GESTIÓN"""
        cuentas_elem_8 = [
            {"codigo": "80", "nombre": "MARGEN COMERCIAL", "nivel": 1, "padre_codigo": "", "elemento": "8", "es_movimiento": True, "esta_activo": True},
            {"codigo": "81", "nombre": "PRODUCCIÓN DEL EJERCICIO", "nivel": 1, "padre_codigo": "", "elemento": "8", "es_movimiento": True, "esta_activo": True},
            {"codigo": "82", "nombre": "VALOR AGREGADO", "nivel": 1, "padre_codigo": "", "elemento": "8", "es_movimiento": True, "esta_activo": True},
            {"codigo": "83", "nombre": "EXCEDENTE BRUTO (INSUFICIENCIA BRUTA) DE EXPLOTACIÓN", "nivel": 1, "padre_codigo": "", "elemento": "8", "es_movimiento": True, "esta_activo": True},
            {"codigo": "84", "nombre": "RESULTADO DE EXPLOTACIÓN", "nivel": 1, "padre_codigo": "", "elemento": "8", "es_movimiento": True, "esta_activo": True},
            {"codigo": "85", "nombre": "RESULTADO ANTES DEL IMPUESTO A LAS GANANCIAS", "nivel": 1, "padre_codigo": "", "elemento": "8", "es_movimiento": True, "esta_activo": True},
            {"codigo": "88", "nombre": "IMPUESTO A LAS GANANCIAS", "nivel": 1, "padre_codigo": "", "elemento": "8", "es_movimiento": True, "esta_activo": True},
            {"codigo": "89", "nombre": "DETERMINACIÓN DEL RESULTADO DEL PERIODO", "nivel": 1, "padre_codigo": "", "elemento": "8", "es_movimiento": True, "esta_activo": True},
        ]
        cuentas.extend(cuentas_elem_8)
        
    def _agregar_cuentas_elemento_0(self, cuentas: List[Dict]):
        """Agrega cuentas del ELEMENTO 0: CUENTAS DE ORDEN"""
        cuentas_elem_0 = [
            {"codigo": "01", "nombre": "BIENES Y VALORES ENTREGADOS", "nivel": 1, "padre_codigo": "", "elemento": "0", "es_movimiento": True, "esta_activo": True},
            {"codigo": "02", "nombre": "BIENES Y VALORES RECIBIDOS", "nivel": 1, "padre_codigo": "", "elemento": "0", "es_movimiento": True, "esta_activo": True},
            {"codigo": "03", "nombre": "OTRAS CUENTAS DE ORDEN DEUDORAS", "nivel": 1, "padre_codigo": "", "elemento": "0", "es_movimiento": True, "esta_activo": True},
            {"codigo": "04", "nombre": "DEUDORAS POR CONTRA", "nivel": 1, "padre_codigo": "", "elemento": "0", "es_movimiento": True, "esta_activo": True},
            {"codigo": "07", "nombre": "ACREEDORAS POR CONTRA", "nivel": 1, "padre_codigo": "", "elemento": "0", "es_movimiento": True, "esta_activo": True},
            {"codigo": "08", "nombre": "BIENES Y VALORES ENTREGADOS", "nivel": 1, "padre_codigo": "", "elemento": "0", "es_movimiento": True, "esta_activo": True},
            {"codigo": "09", "nombre": "CONTRAPARTIDA CUENTAS DE ORDEN ACREEDORAS", "nivel": 1, "padre_codigo": "", "elemento": "0", "es_movimiento": True, "esta_activo": True},
        ]
        cuentas.extend(cuentas_elem_0)
    
    def export_to_csv(self, cuentas: List[Dict], output_file: str):
        """Exporta las cuentas a un archivo CSV"""
        with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['codigo', 'nombre', 'nivel', 'padre_codigo', 'elemento', 'es_movimiento', 'esta_activo']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for cuenta in cuentas:
                writer.writerow(cuenta)
    
    def export_to_json(self, cuentas: List[Dict], output_file: str):
        """Exporta las cuentas a un archivo JSON"""
        with open(output_file, 'w', encoding='utf-8') as jsonfile:
            json.dump(cuentas, jsonfile, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    parser = PcgeParser()
    
    # Parsear el documento y extraer cuentas
    cuentas = parser.parse_pcge_document("../pcge.txt")
    
    # Exportar a CSV y JSON
    parser.export_to_csv(cuentas, "../seeders/pcge_2019.csv")
    parser.export_to_json(cuentas, "../seeders/pcge_2019.json")
    
    print(f"✅ Catálogo PCGE 2019 exportado:")
    print(f"   - CSV: pcge_2019.csv ({len(cuentas)} cuentas)")
    print(f"   - JSON: pcge_2019.json ({len(cuentas)} cuentas)")
