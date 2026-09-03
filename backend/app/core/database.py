import os
import psycopg2
from psycopg2.extras import RealDictCursor

# Database credentials matching our docker-compose.yml
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "feeease_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_PORT = os.getenv("DB_PORT", "5432")


def get_db_connection():
    """Opens a connection to PostgreSQL and returns rows as Python dictionaries."""
    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT,
        cursor_factory=RealDictCursor,
    )
    return conn


def init_db():
    """Creates the 'students' table on application startup if it doesn't exist."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS students (
            id SERIAL PRIMARY KEY,
            student_name VARCHAR(100) NOT NULL,
            parent_name VARCHAR(100) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            grade VARCHAR(50) NOT NULL,
            tuition_fee NUMERIC(10, 2) NOT NULL,
            has_transport BOOLEAN DEFAULT FALSE,
            transport_fee NUMERIC(10, 2) DEFAULT 0.0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """
    )
    conn.commit()
    cursor.close()
    conn.close()
