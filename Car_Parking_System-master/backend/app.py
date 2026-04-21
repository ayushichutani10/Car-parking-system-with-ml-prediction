import os
import uuid
import pickle
import mysql.connector
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Memory store for tokens
# Format: { "uuid-token": {"user_id": 1, "role": "user"} }
active_tokens = {}

import os

# Ultra simple .env loader so we don't need to pip install python-dotenv 
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                k, v = line.split('=', 1)
                os.environ[k.strip()] = v.strip()

# MySQL Connection config
db_config = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'user': os.environ.get('DB_USER', 'root'),
    'password': os.environ.get('DB_PASSWORD', ''), # Loaded from .env or environment
    'database': 'campus_parking'
}

def get_db_connection():
    return mysql.connector.connect(**db_config)

# Helper function to authenticate token
def authenticate_token(req):
    auth_header = req.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        user_data = active_tokens.get(token)
        return user_data, token
    return None, None

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT user_id, role, password FROM User WHERE username = %s AND password = %s", (username, password))
        user = cursor.fetchone()
        
        if user:
            token = str(uuid.uuid4())
            active_tokens[token] = {
                'user_id': user['user_id'],
                'role': user['role']
            }
            return jsonify({'token': token, 'user_id': user['user_id'], 'role': user['role']})
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    email = data.get('email', '')
    contact_no = data.get('contact_no', '')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        # Check if user exists
        cursor.execute("SELECT user_id FROM User WHERE username = %s", (username,))
        if cursor.fetchone():
            return jsonify({'error': 'Username already exists'}), 409
            
        # Insert new user
        query = "INSERT INTO User (username, password, role, email, contact_no) VALUES (%s, %s, 'user', %s, %s)"
        cursor.execute(query, (username, password, email, contact_no))
        conn.commit()
        
        user_id = cursor.lastrowid
        
        # Auto-login after signup
        token = str(uuid.uuid4())
        active_tokens[token] = {
            'user_id': user_id,
            'role': 'user'
        }
        return jsonify({'token': token, 'user_id': user_id, 'role': 'user'}), 201
    except Exception as e:
        if 'conn' in locals(): conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.route('/api/logout', methods=['POST'])
def logout():
    user_data, token = authenticate_token(request)
    if token in active_tokens:
        del active_tokens[token]
        return jsonify({'message': 'Logged out successfully'})
    return jsonify({'error': 'Not logged in'}), 401

@app.route('/api/current-availability', methods=['GET'])
def get_current_availability():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # total slots
        cursor.execute("SELECT COUNT(*) AS total FROM ParkingSlot")
        total_slots = cursor.fetchone()['total']
        
        # occupied slots: EntryLog where exit_time IS NULL or exit_time > current time
        # Since it's a parking lot, usually exit_time is NULL when occupied.
        # Strict logic: entry_time is not null and exit_time IS NULL
        current_date = datetime.now().date()
        current_time = datetime.now().time()
        
        query = """
            SELECT COUNT(DISTINCT slot_id) AS occupied
            FROM EntryLog 
            WHERE entry_date = %s 
              AND entry_time <= %s 
              AND (exit_time IS NULL OR exit_time > %s)
        """
        cursor.execute(query, (current_date, current_time, current_time))
        occupied_slots = cursor.fetchone()['occupied']
        
        available_slots = total_slots - occupied_slots
        
        return jsonify({
            'total_slots': total_slots,
            'occupied_slots': occupied_slots,
            'available_slots': available_slots
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.route('/api/slot-types', methods=['GET'])
def get_slot_types():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT slot_type, COUNT(*) AS count 
            FROM ParkingSlot 
            GROUP BY slot_type
        """)
        rows = cursor.fetchall()
        
        result = {'Compact': 0, 'Standard': 0, 'Oversized': 0}
        for r in rows:
            type_val = r['slot_type']
            # capitalize just in case
            type_val = type_val.capitalize()
            if type_val in result:
                result[type_val] = r['count']
                
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        current_date = datetime.now().date()
        
        query = """
            SELECT HOUR(entry_time) as hour, COUNT(*) as vehicle_count 
            FROM EntryLog 
            WHERE entry_date = %s
            GROUP BY HOUR(entry_time)
            ORDER BY hour ASC
        """
        cursor.execute(query, (current_date,))
        rows = cursor.fetchall()
        return jsonify(rows)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.route('/api/predict-demand', methods=['GET'])
def predict_demand():
    model_path = os.path.join(os.path.dirname(__file__), 'parking_demand_model.pkl')
    if not os.path.exists(model_path):
        return jsonify({'error': 'Model not trained yet'}), 500
        
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
            
        import pandas as pd
        day_type = 1 if datetime.now().weekday() >= 5 else 0
        
        predictions = []
        for h in range(7, 19): # 7 AM to 6 PM
            input_df = pd.DataFrame([{'hour': h, 'day_type': day_type}])
            pred = model.predict(input_df)[0]
            predictions.append({'hour': h, 'predicted_vehicles': max(0, int(pred))})
            
        return jsonify(predictions)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/book-slot', methods=['POST'])
def book_slot():
    user_data, token = authenticate_token(request)
    if not user_data:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    user_id = data.get('user_id')
    slot_id = data.get('slot_id')
    booking_date = data.get('booking_date')
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    v_num = data.get('vehicle_number')
    
    if not all([user_id, slot_id, booking_date, start_time, end_time, v_num]):
        return jsonify({'error': 'Missing required fields'}), 400
        
    # Security check: User can only book for themselves (unless admin)
    if user_data['user_id'] != int(user_id) and user_data['role'] != 'admin':
        return jsonify({'error': 'Unauthorized to book for this user'}), 403

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check overlapping bookings
        # Conflict if existing booking on same date & slot where
        # new_start < existing_end AND new_end > existing_start
        # AND status != 'Cancelled'
        conflict_query = """
            SELECT booking_id FROM Booking 
            WHERE slot_id = %s 
              AND booking_date = %s 
              AND booking_status != 'Cancelled'
              AND (start_time < %s AND end_time > %s)
        """
        cursor.execute(conflict_query, (slot_id, booking_date, end_time, start_time))
        conflicts = cursor.fetchall()
        
        if conflicts:
            return jsonify({'error': 'Slot already booked for this time', 'can_waitlist': True}), 409
            
        cursor.execute("SELECT vehicle_id FROM Vehicle WHERE vehicle_number = %s", (v_num,))
        veh = cursor.fetchone()
        if not veh:
            cursor.execute("INSERT INTO Vehicle (vehicle_number, vehicle_type, user_id) VALUES (%s, %s, %s)", (v_num, 'Car', user_id))
            vehicle_id = cursor.lastrowid
        else:
            vehicle_id = veh['vehicle_id']

        # Insert Booking
        insert_booking_query = """
            INSERT INTO Booking (booking_date, start_time, end_time, booking_status, user_id, slot_id, vehicle_id)
            VALUES (%s, %s, %s, 'Confirmed', %s, %s, %s)
        """
        cursor.execute(insert_booking_query, (booking_date, start_time, end_time, user_id, slot_id, vehicle_id))
        booking_id = cursor.lastrowid
        
        # Insert BookingLog
        insert_log_query = """
            INSERT INTO BookingLog (booking_id, action_type, action_time)
            VALUES (%s, 'Created', %s)
        """
        cursor.execute(insert_log_query, (booking_id, datetime.now()))
        
        conn.commit()
        return jsonify({'message': 'Booking successful', 'booking_id': booking_id}), 201
        
    except Exception as e:
        if 'conn' in locals(): conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.route('/api/my-bookings', methods=['GET'])
def my_bookings():
    user_data, token = authenticate_token(request)
    if not user_data:
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT b.booking_id, b.booking_date, b.start_time, b.end_time, b.booking_status, b.slot_id, s.slot_type 
            FROM Booking b
            JOIN ParkingSlot s ON b.slot_id = s.slot_id
            WHERE b.user_id = %s
            ORDER BY b.booking_date DESC, b.start_time DESC
        """
        cursor.execute(query, (user_data['user_id'],))
        bookings = cursor.fetchall()
        
        # Convert timedelta and date to string
        for b in bookings:
            b['booking_date'] = b['booking_date'].strftime('%Y-%m-%d')
            b['start_time'] = str(b['start_time'])
            b['end_time'] = str(b['end_time'])
            
        return jsonify(bookings)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.route('/api/cancel-booking', methods=['POST'])
def cancel_booking():
    user_data, token = authenticate_token(request)
    if not user_data:
        return jsonify({'error': 'Unauthorized'}), 401
        
    data = request.json
    booking_id = data.get('booking_id')
    
    if not booking_id:
        return jsonify({'error': 'Missing booking_id'}), 400
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Verify ownership
        cursor.execute("SELECT user_id, booking_status, booking_date, start_time, end_time, slot_id FROM Booking WHERE booking_id = %s", (booking_id,))
        booking = cursor.fetchone()
        
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
            
        if booking['user_id'] != user_data['user_id'] and user_data['role'] != 'admin':
            return jsonify({'error': 'Unauthorized to cancel this booking'}), 403
            
        if booking['booking_status'] == 'Cancelled':
            return jsonify({'error': 'Booking already cancelled'}), 400
            
        # Update status
        cursor.execute("UPDATE Booking SET booking_status = 'Cancelled' WHERE booking_id = %s", (booking_id,))
        
        # Add log
        cursor.execute("INSERT INTO BookingLog (booking_id, action_type, action_time) VALUES (%s, 'Cancelled', %s)", 
                      (booking_id, datetime.now()))
                      
        # --- WAITLIST AUTO-ASSIGNMENT ---
        slot_id = booking['slot_id']
        b_date = booking['booking_date']
        b_start = booking['start_time']
        b_end = booking['end_time']

        cursor.execute("""
            SELECT waitlist_id, user_id FROM Waitlist 
            WHERE status = 'Pending' 
              AND booking_date = %s 
              AND start_time >= %s 
              AND end_time <= %s
            ORDER BY join_time ASC LIMIT 1
        """, (b_date, b_start, b_end))
        wl_match = cursor.fetchone()

        if wl_match:
            wl_id = wl_match['waitlist_id']
            wl_user_id = wl_match['user_id']
            
            # Find a vehicle to assign
            cursor.execute("SELECT vehicle_id FROM Vehicle WHERE user_id = %s ORDER BY vehicle_id DESC LIMIT 1", (wl_user_id,))
            wl_veh = cursor.fetchone()
            veh_id_to_use = wl_veh['vehicle_id'] if wl_veh else None
            
            cursor.execute("""
                INSERT INTO Booking (booking_date, start_time, end_time, booking_status, user_id, slot_id, vehicle_id)
                VALUES (%s, %s, %s, 'Confirmed', %s, %s, %s)
            """, (b_date, b_start, b_end, wl_user_id, slot_id, veh_id_to_use))
            n_booking_id = cursor.lastrowid
            
            cursor.execute("INSERT INTO BookingLog (booking_id, action_type, action_time) VALUES (%s, 'Created from Waitlist', %s)", (n_booking_id, datetime.now()))
            cursor.execute("UPDATE Waitlist SET status = 'Fulfilled' WHERE waitlist_id = %s", (wl_id,))
        # --- END WAITLIST ---
        conn.commit()
        return jsonify({'message': 'Booking cancelled successfully'})
        
    except Exception as e:
        if 'conn' in locals(): conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.route('/api/admin/all-bookings', methods=['GET'])
def get_all_bookings():
    user_data, token = authenticate_token(request)
    if not user_data or user_data['role'] != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT b.booking_id, b.booking_date, b.start_time, b.end_time, b.booking_status, b.slot_id, s.slot_type, u.username
            FROM Booking b
            JOIN ParkingSlot s ON b.slot_id = s.slot_id
            JOIN User u ON b.user_id = u.user_id
            ORDER BY b.booking_date DESC, b.start_time DESC
        """
        cursor.execute(query)
        bookings = cursor.fetchall()
        
        for b in bookings:
            b['booking_date'] = b['booking_date'].strftime('%Y-%m-%d')
            b['start_time'] = str(b['start_time'])
            b['end_time'] = str(b['end_time'])
            
        return jsonify(bookings)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

# Helper endpoint to get all parking slots
        
# ==========================================
# ADVANCED FEATURES ENDPOINTS
# ==========================================



@app.route('/api/join-waitlist', methods=['POST'])
def join_waitlist():
    user_data, token = authenticate_token(request)
    if not user_data: return jsonify({'error': 'Unauthorized'}), 401
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO Waitlist (user_id, booking_date, start_time, end_time, join_time)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_data['user_id'], data['booking_date'], data['start_time'], data['end_time'], datetime.now()))
        conn.commit()
        return jsonify({'message': 'Successfully joined waitlist'})
    except Exception as e: return jsonify({'error': str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.route('/api/slots', methods=['GET'])
def get_slots():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT slot_id, slot_type, slot_status, zone_id FROM ParkingSlot")
        slots = cursor.fetchall()
        return jsonify(slots)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()
        
@app.route('/api/my-waitlist', methods=['GET'])
def get_my_waitlist():
    user_data, token = authenticate_token(request)
    if not user_data: return jsonify({'error': 'Unauthorized'}), 401
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Waitlist WHERE user_id = %s ORDER BY join_time DESC", (user_data['user_id'],))
        wl = cursor.fetchall()
        for w in wl:
            w['booking_date'] = w['booking_date'].strftime('%Y-%m-%d')
            w['start_time'] = str(w['start_time'])
            w['end_time'] = str(w['end_time'])
            w['join_time'] = str(w['join_time'])
        return jsonify(wl)
    except Exception as e: return jsonify({'error': str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

@app.route('/api/simulate-gate-entry', methods=['POST'])
def simulate_gate_entry():
    data = request.json
    v_num = data.get('vehicle_number')
    if not v_num: return jsonify({'action': 'KEEP_CLOSED', 'reason': 'No vehicle number'}), 400
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT vehicle_id, user_id FROM Vehicle WHERE vehicle_number = %s OR fastag_id = %s", (v_num, v_num))
        vehicle = cursor.fetchone()
        if not vehicle: return jsonify({'action': 'KEEP_CLOSED', 'reason': 'Vehicle not registered in system.'})

        now = datetime.now()
        # Allow admin to pass a custom date/time for simulation, else use current time
        check_date_str = data.get('check_date')
        check_time_str = data.get('check_time')
        
        from datetime import date as dt_date, time as dt_time
        if check_date_str and check_time_str:
            # Parse the provided strings
            check_date = dt_date.fromisoformat(check_date_str)
            h, m = check_time_str.split(':')[:2]
            check_time = dt_time(int(h), int(m), 0)
        else:
            check_date = now.date()
            check_time = now.time()

        cursor.execute("""
            SELECT booking_id, slot_id FROM Booking 
            WHERE vehicle_id = %s 
              AND booking_date = %s 
              AND start_time <= %s 
              AND end_time >= %s
              AND booking_status = 'Confirmed'
        """, (vehicle['vehicle_id'], check_date, check_time, check_time))
        booking = cursor.fetchone()

        if booking:
            cursor.execute("""
                INSERT INTO EntryLog (entry_date, entry_time, vehicle_id, slot_id)
                VALUES (%s, %s, %s, %s)
            """, (check_date, check_time, vehicle['vehicle_id'], booking['slot_id']))
            conn.commit()
            return jsonify({'action': 'OPEN_GATE', 'message': f'Booking #{booking["booking_id"]} validated. Entry logged for Slot #{booking["slot_id"]}.'})
        else:
            return jsonify({'action': 'KEEP_CLOSED', 'reason': 'No confirmed booking found for this vehicle at the given date and time.'})
    except Exception as e: return jsonify({'error': str(e)}), 500
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

if __name__ == '__main__':
    app.run(debug=True, port=5001)
