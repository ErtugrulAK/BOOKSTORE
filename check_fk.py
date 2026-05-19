import psycopg2
conn = psycopg2.connect('host=localhost port=5432 dbname=kitapsatisdb user=postgres password=1234')
cur = conn.cursor()
cur.execute('SELECT conname, conrelid::regclass FROM pg_constraint WHERE confrelid = \'"Books"\'::regclass;')
print(cur.fetchall())
