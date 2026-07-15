import sqlite3

conn = sqlite3.connect("tarifaia.db")
cursor = conn.cursor()

# List all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [r[0] for r in cursor.fetchall()]

print("=" * 60)
print("TABLAS EN LA BASE DE DATOS")
print("=" * 60)

for table in tables:
    print(f"\n--- {table} ---")
    cursor.execute(f"PRAGMA table_info({table})")
    columns = cursor.fetchall()
    for col in columns:
        cid, name, ctype, notnull, default, pk = col
        pk_mark = " [PK]" if pk else ""
        nn_mark = " NOT NULL" if notnull else ""
        print(f"  {name} ({ctype}){pk_mark}{nn_mark}")
    
    cursor.execute(f"SELECT COUNT(*) FROM {table}")
    count = cursor.fetchone()[0]
    print(f"  >> Registros: {count}")

print("\n" + "=" * 60)
print("DATOS EN CADA TABLA")
print("=" * 60)

for table in tables:
    cursor.execute(f"SELECT COUNT(*) FROM {table}")
    count = cursor.fetchone()[0]
    if count > 0:
        print(f"\n--- {table} ({count} registros) ---")
        cursor.execute(f"SELECT * FROM {table}")
        rows = cursor.fetchall()
        cursor.execute(f"PRAGMA table_info({table})")
        col_names = [c[1] for c in cursor.fetchall()]
        print(f"  Columnas: {col_names}")
        for row in rows[:10]:
            print(f"  {row}")

conn.close()
