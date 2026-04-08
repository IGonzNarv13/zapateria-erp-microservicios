import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    "dbname": "inventory_db",
    "user": "user_inv",
    "password": "password_inv",
    "host": "localhost",
    "port": "5432"
}

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)