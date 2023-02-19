import psycopg2
from . import db_creds

with open('write_to_db.sql') as f:
    sql = f.read().strip()

# Connect to the database
conn = psycopg2.connect(host=db_creds.rds_endpoint, user=db_creds.rds_username,
                        password=db_creds.rds_password, database=db_creds.rds_database,
                        port=db_creds.rds_port)
# Open a cursor to execute SQL statements
cur = conn.cursor()

# Execute a SQL statement
cur.execute(sql)
conn.commit()


sql = "SELECT * FROM subreddit_search"

cur.execute(sql)
results = cur.fetchall()

for result in results:
    print(result)
