# Smart Parking System

A fully functional Smart Parking System built with React.js, Flask, MySQL, and Machine Learning.

## Features
- **User Authentication**: Token-based login via MySQL.
- **Dashboard**: Real-time slot availability, distribution of slot types, and AI demand prediction using Chart.js.
- **Slot Booking**: Book slots ensuring no overlaps using a strict conflict check algorithm.
- **History & Cancellation**: View past bookings and cancel active ones.

## Project Structure
```
SmartParkingSystem/
├── backend/
│   ├── app.py                  # Main Flask API
│   ├── train_model.py          # Script to train Scikit-Learn Model
│   ├── requirements.txt        # Backend dependencies
├── frontend/                   # React Vite application
│   ├── src/                    # Frontend source (Components & CSS)
│   ├── package.json            # Frontend dependencies
├── database/
│   ├── schema.sql              # MySQL strict relational schema
│   ├── setup_db.py             # Optional helper script to initialize MySQL
├── dataset/
│   ├── generate_data.py        # Script to generate synthetic data
│   ├── parking_data.csv        # The generated 1000+ rows dataset
```

## Step-by-Step Setup Instructions

### 1. Database Setup
1. Ensure you have MySQL Server installed and running locally.
2. Open `backend/app.py` and `database/setup_db.py` to change the database credentials if necessary (default: host=localhost, user=root, password="").
3. Import the schema to your MySQL instance:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
   *Alternatively, test running `python3 database/setup_db.py` to auto-import schema and seed admin/user.*

### 2. Machine Learning & Dataset
1. Install Python dependencies:
   ```bash
   pip3 install -r backend/requirements.txt
   ```
2. Generate synthetic data (creates `dataset/parking_data.csv`):
   ```bash
   python3 dataset/generate_data.py
   ```
3. Train the ML Model (creates `backend/parking_demand_model.pkl`):
   ```bash
   python3 backend/train_model.py
   ```

### 3. Running Backend (Flask)
From the root directory, run:
```bash
python3 backend/app.py
```
The Flask server will start on `http://localhost:5000`.

### 4. Running Frontend (React)
Open a new terminal, navigate to the `frontend` folder, and start Vite:
```bash
cd frontend
npm run dev
```
The React frontend will be available at `http://localhost:5173`.

### 5. Login Credentials
If you used the `database/setup_db.py` seeder, the default accounts are:
- **Admin**: `admin` / `admin123`
- **User**: `student1` / `pass123`

You can also insert your own test users into the `User` table manually according to your schema.
