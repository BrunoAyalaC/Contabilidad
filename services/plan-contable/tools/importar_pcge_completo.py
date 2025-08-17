#!/usr/bin/env python3
"""
Importador Directo a PostgreSQL
===============================

Importa el catálogo PCGE completo directamente a PostgreSQL
sin usar Entity Framework.
"""

import json
import psycopg2
from psycopg2.extras import RealDictCursor
import sys

def conectar_db():
    """Conecta a la base de datos PostgreSQL"""
    try:
        connection = psycopg2.connect(
            host="localhost",
            port=5432,
            database="plan_contable_db",
            user="postgres",
            password="royxd123"
        )
        return connection
    except Exception as e:
        print(f"❌ Error conectando a PostgreSQL: {e}")
        return None

def limpiar_tablas(connection):
    """Limpia las tablas antes de importar"""
    try:
        cursor = connection.cursor()
        
        # Truncar tabla con CASCADE para resetear IDs
        cursor.execute("TRUNCATE TABLE \"CuentasContables\" RESTART IDENTITY CASCADE")
        connection.commit()
        
        print("🧹 Tablas limpiadas")
        return True
        
    except Exception as e:
        print(f"❌ Error limpiando tablas: {e}")
        return False

def importar_cuentas(connection, archivo_seeder):
    """Importa las cuentas desde el archivo seeder"""
    
    print(f"📂 Cargando archivo: {archivo_seeder}")
    
    try:
        with open(archivo_seeder, 'r', encoding='utf-8') as file:
            cuentas = json.load(file)
        
        print(f"📄 {len(cuentas):,} cuentas cargadas desde JSON")
        
        cursor = connection.cursor()
        
        # Preparar consulta de inserción
        insert_query = """
        INSERT INTO "CuentasContables" 
        ("Id", "Codigo", "Nombre", "Nivel", "PadreId", "Descripcion", "Estado", "FechaCreacion", "FechaModificacion")
        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        """
        
        # Contador por niveles
        contadores = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        
        print("💾 Insertando cuentas...")
        
        for i, cuenta in enumerate(cuentas, 1):
            
            # Mostrar progreso cada 100 cuentas
            if i % 100 == 0:
                print(f"   📝 Procesando cuenta {i:,} de {len(cuentas):,}")
            
            # Preparar datos
            cuenta_data = (
                cuenta["id"],
                cuenta["codigo"],
                cuenta["nombre"],
                cuenta["nivel"],
                cuenta["padre_id"],
                cuenta["descripcion"],
                cuenta["estado"]
            )
            
            # Ejecutar inserción
            cursor.execute(insert_query, cuenta_data)
            
            # Contar por nivel
            nivel = cuenta["nivel"]
            contadores[nivel] = contadores.get(nivel, 0) + 1
        
        # Confirmar transacción
        connection.commit()
        
        print(f"✅ {len(cuentas):,} cuentas importadas exitosamente!")
        
        # Mostrar distribución por niveles
        print(f"\n📊 DISTRIBUCIÓN POR NIVELES:")
        for nivel in sorted(contadores.keys()):
            print(f"   Nivel {nivel}: {contadores[nivel]:,} cuentas")
        
        return True
        
    except Exception as e:
        print(f"❌ Error importando cuentas: {e}")
        connection.rollback()
        return False

def verificar_importacion(connection):
    """Verifica que la importación fue exitosa"""
    try:
        cursor = connection.cursor(cursor_factory=RealDictCursor)
        
        # Contar total de cuentas
        cursor.execute('SELECT COUNT(*) as total FROM "CuentasContables"')
        total = cursor.fetchone()['total']
        
        # Contar por niveles
        cursor.execute('''
            SELECT "Nivel", COUNT(*) as cantidad 
            FROM "CuentasContables" 
            GROUP BY "Nivel" 
            ORDER BY "Nivel"
        ''')
        por_nivel = cursor.fetchall()
        
        # Verificar elementos (nivel 1)
        cursor.execute('''
            SELECT "Codigo", "Nombre" 
            FROM "CuentasContables" 
            WHERE "Nivel" = 1 
            ORDER BY CAST("Codigo" AS INTEGER)
        ''')
        elementos = cursor.fetchall()
        
        print(f"\n🔍 VERIFICACIÓN DE IMPORTACIÓN:")
        print(f"   📊 Total cuentas: {total:,}")
        
        print(f"\n📈 Por niveles:")
        for registro in por_nivel:
            print(f"   Nivel {registro['nivel']}: {registro['cantidad']:,} cuentas")
        
        print(f"\n📁 Elementos (Nivel 1):")
        for elemento in elementos:
            print(f"   {elemento['codigo']}: {elemento['nombre']}")
        
        return total > 0
        
    except Exception as e:
        print(f"❌ Error verificando importación: {e}")
        return False

def main():
    """Función principal"""
    archivo_seeder = "pcge_completo_seeder.json"
    
    print("🚀 IMPORTADOR DIRECTO DEL PCGE COMPLETO")
    print("=" * 60)
    
    # Conectar a la base de datos
    connection = conectar_db()
    if not connection:
        return 1
    
    try:
        # Limpiar tablas
        if not limpiar_tablas(connection):
            return 1
        
        # Importar cuentas
        if not importar_cuentas(connection, archivo_seeder):
            return 1
        
        # Verificar importación
        if not verificar_importacion(connection):
            return 1
        
        print(f"\n🎉 ¡IMPORTACIÓN COMPLETADA CON ÉXITO!")
        print(f"💾 Todas las cuentas del PCGE completo están en PostgreSQL")
        print(f"🎯 Base de datos lista para usar con todos los niveles")
        
        return 0
        
    finally:
        connection.close()

if __name__ == "__main__":
    exit(main())
