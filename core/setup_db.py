import psycopg2
from . import db_creds


with open('setup_db.sql') as f:
    sql = f.read().strip()


# Connect to the database
conn = psycopg2.connect(host=db_creds.rds_endpoint, user=db_creds.rds_username,
                        password=db_creds.rds_password, database=db_creds.rds_database,
                        port=db_creds.rds_port)

# Open a cursor to execute SQL statements
cur = conn.cursor()

# Execute a SQL statement
# cur.execute(sql)  # uncomment me
# conn.commit()  # uncomment me


# Get the updated list of tables

sqlGetTableList = "SELECT table_schema,table_name FROM information_schema.tables where table_schema='public' ORDER BY table_schema,table_name ;"

# sqlGetTableList = "\dt"


# Retrieve all the rows from the cursor

cur.execute(sqlGetTableList)

tables = cur.fetchall()


# Print the names of the tables

for table in tables:

    print(table)

# Close the cursor and connection
cur.close()
conn.close()
