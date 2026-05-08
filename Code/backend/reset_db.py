import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def reset_db():
    try:
        conn = psycopg2.connect("postgresql://postgres:Mithun1701@localhost/postgres")
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # Kill all connections to SafeNav before dropping
        cur.execute("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'SafeNav' AND pid <> pg_backend_pid()")
        
        cur.execute("DROP DATABASE IF EXISTS \"SafeNav\"")
        cur.execute("CREATE DATABASE \"SafeNav\"")
        print("SafeNav database recreated.")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error resetting database: {e}")

if __name__ == "__main__":
    reset_db()
