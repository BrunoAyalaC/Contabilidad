#!/usr/bin/env python3
"""
Corrector Inteligente de Caracteres Mal Codificados en PCGE JSON
==============================================================

Este script corrige específicamente los caracteres � en el archivo pcge.json
basándose en el contexto contable y términos conocidos del español.
"""

import json
import re
from typing import Dict, List, Any

class PCGECharacterFixer:
    """Corrector inteligente de caracteres mal codificados"""
    
    def __init__(self, archivo_entrada: str):
        self.archivo_entrada = archivo_entrada
        
        # Diccionario de correcciones específicas basadas en contexto contable
        self.correcciones_especificas = {
            # Guiones y conectores
            " � ": " – ",  # Guión largo en títulos
            "negociacion �": "negociación –",
            "financieros �": "financieros –",
            
            # Palabras contables comunes encontradas en el archivo
            "Pr�stamos": "Préstamos",
            "garant�a": "garantía", 
            "Dep�sitos": "Depósitos",
            "Regal�as": "Regalías",
            "regal�as": "regalías",
            "Compa��as": "Compañías",
            "p�blicos": "públicos",
            "MERCADER�AS": "MERCADERÍAS",
            "Mercader�as": "Mercaderías",
            "mercader�as": "mercaderías",
            "Energ�a": "Energía",
            "energ�a": "energía",
            "F�rmulas": "Fórmulas",
            "f�rmulas": "fórmulas",
            "dise�os": "diseños",
            "Dise�os": "Diseños",
            "Veh�culos": "Vehículos",
            "veh�culos": "vehículos",
            "inform�ticas": "informáticas",
            "Inform�ticas": "Informáticas",
            "Plusval�a": "Plusvalía",
            "plusval�a": "plusvalía",
            "F�rmulas, dise�os": "Fórmulas, diseños",
            "patrimonial �": "patrimonial –",
            
            # Términos adicionales encontrados
            "R�gimen": "Régimen",
            "r�gimen": "régimen",
            "categor�a": "categoría",
            "p�blicas": "públicas",
            "p�blicos": "públicos", 
            "espect�culos": "espectáculos",
            "PART�CIPES": "PARTÍCIPES",
            "part�cipes": "partícipes",
            "Pagar�s": "Pagarés",
            "pagar�s": "pagarés",
            "tesorer�a": "tesorería",
            "tr�mite": "trámite",
            "P�rdida": "Pérdida",
            "p�rdida": "pérdida",
            "P�rdidas": "Pérdidas",
            "p�rdidas": "pérdidas",
            "a�os": "años",
            "Asesor�a": "Asesoría",
            "asesor�a": "asesoría",
            "consultor�a": "consultoría",
            "Auditor�a": "Auditoría",
            "auditor�a": "auditoría",
            "el�ctrica": "eléctrica",
            "Tel�fono": "Teléfono",
            "tel�fono": "teléfono",
            "m�quinas": "máquinas",
            "C�nones": "Cánones",
            "c�nones": "cánones",
            "Gesti�n": "Gestión",
            "gesti�n": "gestión",
            "GESTI�N": "GESTIÓN",
            "pr�stamos": "préstamos",
            "ambiente �": "ambiente –",
            "DETERMINAci�n": "DETERMINAción",
            "transito": "tránsito",  # Esta ya está sin �, pero la mejoramos
            "especificos": "específicos",  # Esta también
            
            # Conectores específicos del PCGE
            "TERCEROS": "TERCEROS",
            "RELACIONADAS": "RELACIONADAS",
            
            # Otros términos contables
            "cr�dito": "crédito",
            "d�bito": "débito", 
            "per�odo": "período",
            "econ�mico": "económico",
            "t�tulos": "títulos",
            "p�rdida": "pérdida",
            "ganancia": "ganancia",
            "inversi�n": "inversión",
            "amortizaci�n": "amortización",
            "depreciaci�n": "depreciación",
            "revaluaci�n": "revaluación",
            "participaci�n": "participación",
            "distribuci�n": "distribución",
            "adquisici�n": "adquisición",
            "constituci�n": "constitución",
            "liquidaci�n": "liquidación",
            "reorganizaci�n": "reorganización",
            "fusión": "fusión",
            "esci�n": "escisión",
            "transformaci�n": "transformación",
            "capitalizaci�n": "capitalización",
            "valorizaci�n": "valorización",
            "desvalorizaci�n": "desvalorización",
            "deterioro": "deterioro",
            "provisi�n": "provisión",
            "estimaci�n": "estimación",
            "medici�n": "medición",
            "reconocimiento": "reconocimiento",
            "clasificaci�n": "clasificación",
            "presentaci�n": "presentación",
            "revelaci�n": "revelación",
            "conciliaci�n": "conciliación",
            "verificaci�n": "verificación",
            "autorizaci�n": "autorización",
            "aprobaci�n": "aprobación",
            "ratificaci�n": "ratificación",
            "modificaci�n": "modificación",
            "actualizaci�n": "actualización",
            "revisi�n": "revisión",
            "supervisi�n": "supervisión",
            "inspecci�n": "inspección",
            "auditoria": "auditoría",
            "fiscalizaci�n": "fiscalización",
            "regulaci�n": "regulación",
            "normalizaci�n": "normalización",
            "estandarizaci�n": "estandarización"
        }
        
        # Patrones para correcciones contextuales
        self.patrones_contextuales = [
            # Patrón: palabra + �n al final = ión
            (r'(\w+)ci�n\b', r'\1ción'),
            (r'(\w+)si�n\b', r'\1sión'),
            (r'(\w+)aci�n\b', r'\1ación'),
            
            # Patrón: � seguido de consonante = vocal acentuada más probable
            (r'garant�(\w)', r'garantí\1'),
            (r'dep�sito', r'depósito'),
            (r'cr�dito', r'crédito'),
            (r'd�bito', r'débito'),
            (r'p�blico', r'público'),
            (r't�tulo', r'título'),
            (r'per�odo', r'período'),
            (r'm�todo', r'método'),
            (r'c�digo', r'código'),
            (r'n�mero', r'número'),
            (r'�ndice', r'índice'),
            (r'b�sico', r'básico'),
            (r't�cnico', r'técnico'),
            (r'econ�mico', r'económico'),
            (r'jur�dico', r'jurídico'),
            (r'pol�tico', r'político'),
            (r'pr�ctico', r'práctico'),
            (r'te�rico', r'teórico'),
            (r'hist�rico', r'histórico'),
            (r'cl�sico', r'clásico'),
            (r'cr�tico', r'crítico'),
            (r'l�gico', r'lógico'),
            (r'm�gico', r'mágico'),
            (r'tr�gico', r'trágico'),
            (r'est�tico', r'estático'),
            (r'din�mico', r'dinámico'),
            (r'sistem�tico', r'sistemático'),
            (r'autom�tico', r'automático'),
            (r'dram�tico', r'dramático'),
            (r'problem�tico', r'problemático'),
            (r'tem�tico', r'temático'),
            (r'matem�tico', r'matemático'),
            (r'inform�tico', r'informático'),
            (r'telef�nico', r'telefónico'),
            (r'electr�nico', r'electrónico'),
            (r'mec�nico', r'mecánico'),
            (r'org�nico', r'orgánico'),
            (r'qu�mico', r'químico'),
            (r'f�sico', r'físico'),
            (r'cl�nico', r'clínico'),
            (r'm�dico', r'médico'),
            (r'g�nerico', r'genérico'),
            (r'espec�fico', r'específico'),
            (r'pac�fico', r'pacífico'),
            (r'art�stico', r'artístico'),
            (r'tur�stico', r'turístico'),
            (r'log�stico', r'logístico'),
            (r'bal�stico', r'balístico'),
            (r'pl�stico', r'plástico'),
            (r'el�stico', r'elástico'),
            (r'dr�stico', r'drástico'),
            (r'fant�stico', r'fantástico'),
            (r'dom�stico', r'doméstico'),
            (r'r�stico', r'rústico'),
            (r'ac�stico', r'acústico'),
            (r'l�quido', r'líquido'),
            (r's�lido', r'sólido'),
            (r'v�lido', r'válido'),
            (r'c�lido', r'cálido'),
            (r'p�lido', r'pálido'),
            (r'r�pido', r'rápido'),
            (r'est�pido', r'estúpido'),
            (r'c�pido', r'cúpido'),
            (r'h�medo', r'húmedo'),
            (r'c�modo', r'cómodo'),
        ]
    
    def aplicar_correcciones_especificas(self, texto: str) -> str:
        """Aplica correcciones específicas basadas en el diccionario"""
        for incorrecto, correcto in self.correcciones_especificas.items():
            texto = texto.replace(incorrecto, correcto)
        return texto
    
    def aplicar_patrones_contextuales(self, texto: str) -> str:
        """Aplica patrones de corrección contextual"""
        for patron, reemplazo in self.patrones_contextuales:
            texto = re.sub(patron, reemplazo, texto, flags=re.IGNORECASE)
        return texto
    
    def corregir_texto(self, texto: str) -> str:
        """Aplica todas las correcciones al texto"""
        # Primero aplicar correcciones específicas
        texto = self.aplicar_correcciones_especificas(texto)
        
        # Luego aplicar patrones contextuales
        texto = self.aplicar_patrones_contextuales(texto)
        
        return texto
    
    def procesar_diccionario(self, obj: Any) -> Any:
        """Procesa recursivamente un diccionario o lista corrigiendo textos"""
        if isinstance(obj, dict):
            return {clave: self.procesar_diccionario(valor) for clave, valor in obj.items()}
        elif isinstance(obj, list):
            return [self.procesar_diccionario(item) for item in obj]
        elif isinstance(obj, str):
            return self.corregir_texto(obj)
        else:
            return obj
    
    def corregir_archivo(self, archivo_salida: str) -> bool:
        """Corrige el archivo JSON completo"""
        try:
            print(f"🔧 Cargando archivo: {self.archivo_entrada}")
            
            # Probar diferentes codificaciones
            encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
            data = None
            encoding_usado = None
            
            for encoding in encodings:
                try:
                    with open(self.archivo_entrada, 'r', encoding=encoding) as file:
                        content = file.read()
                    data = json.loads(content)
                    encoding_usado = encoding
                    break
                except (UnicodeDecodeError, json.JSONDecodeError):
                    continue
            
            if data is None:
                raise Exception("No se pudo cargar el archivo con ninguna codificación")
            
            print(f"✅ Archivo cargado con codificación: {encoding_usado}")
            
            # Procesar y corregir
            print("🔄 Aplicando correcciones...")
            data_corregida = self.procesar_diccionario(data)
            
            # Guardar archivo corregido
            with open(archivo_salida, 'w', encoding='utf-8') as file:
                json.dump(data_corregida, file, ensure_ascii=False, indent=2)
            
            print(f"✅ Archivo corregido guardado: {archivo_salida}")
            return True
            
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    def generar_reporte_correcciones(self) -> None:
        """Genera un reporte de las correcciones que se aplicarán"""
        print("\n📋 CORRECCIONES QUE SE APLICARÁN:")
        print("=" * 50)
        
        print("\n🔤 Correcciones Específicas:")
        for incorrecto, correcto in list(self.correcciones_especificas.items())[:10]:
            print(f"  • {incorrecto} → {correcto}")
        
        print(f"\n📊 Total de correcciones específicas: {len(self.correcciones_especificas)}")
        print(f"📊 Total de patrones contextuales: {len(self.patrones_contextuales)}")

def main():
    """Función principal"""
    print("🔧 Corrector Inteligente de Caracteres PCGE")
    print("=" * 50)
    
    # Rutas
    archivo_entrada = "pcge.json"
    archivo_salida = "pcge_corregido.json"
    
    # Crear corrector
    corrector = PCGECharacterFixer(archivo_entrada)
    
    # Mostrar reporte de correcciones
    corrector.generar_reporte_correcciones()
    
    # Aplicar correcciones
    if corrector.corregir_archivo(archivo_salida):
        print(f"\n🎉 ¡Corrección completada exitosamente!")
        print(f"📄 Archivo original: {archivo_entrada}")
        print(f"📄 Archivo corregido: {archivo_salida}")
        
        # Contar caracteres � restantes
        try:
            with open(archivo_salida, 'r', encoding='utf-8') as file:
                contenido = file.read()
                caracteres_restantes = contenido.count('�')
                print(f"📊 Caracteres � restantes: {caracteres_restantes}")
                
                if caracteres_restantes == 0:
                    print("✅ ¡Todos los caracteres � fueron corregidos!")
                else:
                    print("⚠️  Algunos caracteres � necesitan revisión manual")
        except Exception as e:
            print(f"❌ Error verificando resultado: {e}")
        
        return 0
    else:
        print("\n❌ Error en la corrección")
        return 1

if __name__ == "__main__":
    exit(main())
