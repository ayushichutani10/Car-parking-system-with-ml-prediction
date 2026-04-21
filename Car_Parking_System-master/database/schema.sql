DROP DATABASE IF EXISTS campus_parking;
CREATE DATABASE campus_parking;
USE campus_parking;

CREATE TABLE IF NOT EXISTS User (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    contact_no VARCHAR(15)
);

CREATE TABLE IF NOT EXISTS Vehicle (
    vehicle_id INT PRIMARY KEY AUTO_INCREMENT,
    vehicle_number VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL,
    color VARCHAR(20),
    fastag_id VARCHAR(50) DEFAULT NULL,
    user_id INT,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ParkingZone (
    zone_id INT PRIMARY KEY AUTO_INCREMENT,
    zone_name VARCHAR(30) NOT NULL,
    capacity INT NOT NULL,
    zone_type VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS ParkingSlot (
    slot_id INT PRIMARY KEY AUTO_INCREMENT,
    slot_type VARCHAR(20) NOT NULL,
    slot_status VARCHAR(15) NOT NULL,
    zone_id INT,
    FOREIGN KEY (zone_id) REFERENCES ParkingZone(zone_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Waitlist (
    waitlist_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    join_time DATETIME NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS EntryLog (
    entry_id INT PRIMARY KEY AUTO_INCREMENT,
    entry_date DATE NOT NULL,
    entry_time TIME NOT NULL,
    exit_time TIME,
    vehicle_id INT,
    slot_id INT,
    zone_id INT,
    FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES ParkingSlot(slot_id) ON DELETE CASCADE,
    FOREIGN KEY (zone_id) REFERENCES ParkingZone(zone_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Booking (
    booking_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    booking_status VARCHAR(20),
    user_id INT,
    slot_id INT,
    vehicle_id INT,
    FOREIGN KEY (user_id) REFERENCES User(user_id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES ParkingSlot(slot_id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES Vehicle(vehicle_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS BookingLog (
    booking_log_id INT PRIMARY KEY AUTO_INCREMENT,
    booking_id INT,
    action_type VARCHAR(30),
    action_time DATETIME,
    FOREIGN KEY (booking_id) REFERENCES Booking(booking_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS TimeSlot (
    time_slot_id INT PRIMARY KEY AUTO_INCREMENT,
    start_time TIME,
    end_time TIME
);

CREATE TABLE IF NOT EXISTS MLPrediction (
    prediction_id INT PRIMARY KEY AUTO_INCREMENT,
    hour INT,
    predicted_vehicle_count INT,
    prediction_date DATE
);
