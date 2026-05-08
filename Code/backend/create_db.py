import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
from dotenv import load_dotenv

load_dotenv()

def create_db():
    db_url = os.getenv("DATABASE_URL")
    # Parse URL: postgresql://user:pass@host/dbname
    # We need to connect to 'postgres' DB first to create the new one
    base_url = db_url.rsplit('/', 1)[0] + '/postgres'
    db_name = db_url.rsplit('/', 1)[1]
    
    try:
        conn = psycopg2.connect(base_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        cur.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{db_name}'")
        exists = cur.fetchone()
        if not exists:
            cur.execute(f"CREATE DATABASE \"{db_name}\"")
            print(f"Database {db_name} created.")
        else:
            print(f"Database {db_name} already exists.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error creating database: {e}")

if __name__ == "__main__":
    create_db()
