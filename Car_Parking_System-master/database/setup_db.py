import mysql.connector
import os

# Simple .env loader
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                k, v = line.split('=', 1)
                os.environ[k.strip()] = v.strip()

db_config_no_db = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', '') # Loaded from .env
}

def setup_database():
    try:
        # Connect without DB to create it
        conn = mysql.connector.connect(**db_config_no_db)
        cursor = conn.cursor()
        
        # Read schema.sql
        schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
        with open(schema_path, 'r') as f:
            sql_file = f.read()

        # Execute SQL statements
        sql_commands = sql_file.split(';')
        for command in sql_commands:
            if command.strip() != '':
                cursor.execute(command)
        
        # Commit to ensure DB creation
        conn.commit()
        print("Database schema created successfully.")
        
        # Reconnect with DB selected
        db_config_no_db['database'] = 'campus_parking'
        conn = mysql.connector.connect(**db_config_no_db)
        cursor = conn.cursor()
        
        # Seed an admin user and a regular user
        users = [
            ("admin", "admin123", "admin", "admin@campus.edu", "1234567890"),
            ("student1", "pass123", "user", "student1@campus.edu", "0987654321")
        ]
        
        cursor.execute("SELECT COUNT(*) FROM User")
        if cursor.fetchone()[0] == 0:
            cursor.executemany(
                "INSERT INTO User (username, password, role, email, contact_no) VALUES (%s, %s, %s, %s, %s)",
                users
            )
            print("Users seeded.")
            
        # Seed parking zones (5 zones, total 500 capacity)
        zones = [
            ("North Lot", 100, "General"),
            ("South Garage", 100, "Premium"),
            ("East Lot", 100, "General"),
            ("West Deck", 100, "Covered"),
            ("Main Hub", 100, "General")
        ]
        cursor.execute("SELECT COUNT(*) FROM ParkingZone")
        if cursor.fetchone()[0] == 0:
            cursor.executemany(
                "INSERT INTO ParkingZone (zone_name, capacity, zone_type) VALUES (%s, %s, %s)",
                zones
            )
            # Fetch zone IDs
            cursor.execute("SELECT zone_id FROM ParkingZone")
            zone_ids = [row[0] for row in cursor.fetchall()]
            
            # Seed parking slots
            slots = []
            for z_id in zone_ids:
                for i in range(100):
                    slot_type = 'Compact' if i < 30 else 'Standard' if i < 80 else 'Oversized'
                    slots.append((slot_type, 'Available', z_id))
            
            cursor.executemany(
                "INSERT INTO ParkingSlot (slot_type, slot_status, zone_id) VALUES (%s, %s, %s)",
                slots
            )
            print("Zones and slots seeded.")

        # Seed vehicles
        cursor.execute("SELECT COUNT(*) FROM Vehicle")
        if cursor.fetchone()[0] == 0:
            vehicles = [
                ("AB12CD3456", "Car", "Black", "FASTAG-1001", 2) # seed for student1
            ]
            cursor.executemany(
                "INSERT INTO Vehicle (vehicle_number, vehicle_type, color, fastag_id, user_id) VALUES (%s, %s, %s, %s, %s)",
                vehicles
            )
            print("Vehicles seeded.")
            
        conn.commit()
        print("Database setup complete.")
        
    except Exception as e:
        print(f"Error setting up database: {e}")
    finally:
        if 'cursor' in locals() and cursor: cursor.close()
        if 'conn' in locals() and conn and conn.is_connected(): conn.close()

if __name__ == '__main__':
    setup_database()
