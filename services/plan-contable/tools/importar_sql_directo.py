#!/usr/bin/env python3
"""
Importador SQL Directo para PCGE Completo
=========================================
"""

import json
import psycopg2
import uuid
from datetime import datetime

def main():
    print("🚀 IMPORTADOR SQL DIRECTO - PCGE COMPLETO")
    print("=" * 60)
    
    # Conectar a PostgreSQL
    try:
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            database="plan_contable_db",
            user="postgres",
            password="royxd123"
        )
        print("✅ Conexión establecida")
        
        cursor = conn.cursor()
        
        # Limpiar tabla
        cursor.execute('TRUNCATE TABLE "CuentasContables" RESTART IDENTITY CASCADE')
        conn.commit()
        print("🧹 Tabla limpiada")
        
        # Cargar datos
        with open("pcge_completo_seeder.json", "r", encoding="utf-8") as f:
            cuentas = json.load(f)
        
        print(f"📄 {len(cuentas):,} cuentas cargadas")
        
        # Mapeo de IDs para relaciones padre-hijo
        id_map = {}
        
        # Insertar por niveles
        for nivel in range(1, 6):
            cuentas_nivel = [c for c in cuentas if c["nivel"] == nivel]
            if not cuentas_nivel:
                continue
                
            print(f"💾 Insertando nivel {nivel}: {len(cuentas_nivel)} cuentas...")
            
            for cuenta in cuentas_nivel:
                # Generar UUID
                new_id = str(uuid.uuid4())
                id_map[cuenta["id"]] = new_id
                
                # Obtener padre_id como UUID
                padre_uuid = None
                if cuenta["padre_id"] and cuenta["padre_id"] in id_map:
                    padre_uuid = id_map[cuenta["padre_id"]]
                
                # Insertar cuenta
                cursor.execute("""
                    INSERT INTO "CuentasContables" 
                    ("Id", "Codigo", "Nombre", "Descripcion", "Elemento", "Nivel", 
                     "PadreId", "EsMovimiento", "EstaActivo", "FechaCreacion", "FechaActualizacion")
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    new_id,
                    cuenta["codigo"],
                    cuenta["nombre"],
                    cuenta["descripcion"] or "",
                    cuenta["codigo"][0],  # Primer dígito como elemento
                    cuenta["nivel"],
                    padre_uuid,
                    cuenta["nivel"] >= 3,  # EsMovimiento para niveles 3+
                    cuenta["estado"],
                    datetime.utcnow(),
                    datetime.utcnow()
                ))
            
            conn.commit()
            print(f"   ✅ Nivel {nivel} completado")
        
        # Verificar
        cursor.execute('SELECT COUNT(*) FROM "CuentasContables"')
        total = cursor.fetchone()[0]
        
        cursor.execute('''
            SELECT "Nivel", COUNT(*) 
            FROM "CuentasContables" 
            GROUP BY "Nivel" 
            ORDER BY "Nivel"
        ''')
        por_nivel = cursor.fetchall()
        
        print(f"\n📊 VERIFICACIÓN:")
        print(f"   Total: {total:,} cuentas")
        for nivel, count in por_nivel:
            print(f"   Nivel {nivel}: {count:,} cuentas")
        
        print(f"\n🎉 ¡IMPORTACIÓN COMPLETADA!")
        print(f"💾 {total:,} cuentas del PCGE completo en PostgreSQL")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1
    finally:
        if 'conn' in locals():
            conn.close()
    
    return 0

if __name__ == "__main__":
    exit(main())
