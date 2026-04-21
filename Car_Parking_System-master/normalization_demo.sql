CREATE DATABASE IF NOT EXISTS campus_parking_normalization;
USE campus_parking_normalization;

-- ==========================================
-- 1NF Before
-- ==========================================
CREATE TABLE IF NOT EXISTS User_Details_UNF (
    User_ID INT,
    Username VARCHAR(50),
    Role VARCHAR(20),
    Vehicles_Owned VARCHAR(100)
);
TRUNCATE TABLE User_Details_UNF;
INSERT INTO User_Details_UNF VALUES
(1, 'Alice', 'Student', 'UP14AB1234, DL01CD5678'),
(2, 'Bob', 'Faculty', 'HR26XY9012');

-- ==========================================
-- 1NF After / 2NF Before
-- ==========================================
CREATE TABLE IF NOT EXISTS User_Details_1NF (
    User_ID INT,
    Username VARCHAR(50),
    Role VARCHAR(20),
    Vehicle_Owned VARCHAR(20)
);
TRUNCATE TABLE User_Details_1NF;
INSERT INTO User_Details_1NF VALUES
(1, 'Alice', 'Student', 'UP14AB1234'),
(1, 'Alice', 'Student', 'DL01CD5678'),
(2, 'Bob', 'Faculty', 'HR26XY9012');

-- ==========================================
-- 2NF After
-- ==========================================
CREATE TABLE IF NOT EXISTS User_2NF (
    User_ID INT PRIMARY KEY,
    Username VARCHAR(50),
    Role VARCHAR(20)
);
TRUNCATE TABLE User_2NF;
INSERT INTO User_2NF VALUES
(1, 'Alice', 'Student'),
(2, 'Bob', 'Faculty');

CREATE TABLE IF NOT EXISTS Vehicle_2NF (
    Vehicle_Owned VARCHAR(20) PRIMARY KEY,
    User_ID INT
);
TRUNCATE TABLE Vehicle_2NF;
INSERT INTO Vehicle_2NF VALUES
('UP14AB1234', 1),
('DL01CD5678', 1),
('HR26XY9012', 2);

-- ==========================================
-- 3NF Before
-- ==========================================
CREATE TABLE IF NOT EXISTS SlotZone_Before_3NF (
    Slot_ID VARCHAR(10),
    Slot_Type VARCHAR(20),
    Zone_ID VARCHAR(10),
    Zone_Name VARCHAR(30),
    Zone_Capacity INT
);
TRUNCATE TABLE SlotZone_Before_3NF;
INSERT INTO SlotZone_Before_3NF VALUES
('S1', 'Two-Wheeler', 'Z1', 'North Gate', 50),
('S2', 'Four-Wheeler', 'Z1', 'North Gate', 50),
('S3', 'Two-Wheeler', 'Z2', 'South Gate', 100);

-- ==========================================
-- 3NF After
-- ==========================================
CREATE TABLE IF NOT EXISTS ParkingZone_3NF (
    Zone_ID VARCHAR(10) PRIMARY KEY,
    Zone_Name VARCHAR(30),
    Zone_Capacity INT
);
TRUNCATE TABLE ParkingZone_3NF;
INSERT INTO ParkingZone_3NF VALUES
('Z1', 'North Gate', 50),
('Z2', 'South Gate', 100);

CREATE TABLE IF NOT EXISTS ParkingSlot_3NF (
    Slot_ID VARCHAR(10) PRIMARY KEY,
    Slot_Type VARCHAR(20),
    Zone_ID VARCHAR(10)
);
TRUNCATE TABLE ParkingSlot_3NF;
INSERT INTO ParkingSlot_3NF VALUES
('S1', 'Two-Wheeler', 'Z1'),
('S2', 'Four-Wheeler', 'Z1'),
('S3', 'Two-Wheeler', 'Z2');

-- ==========================================
-- BCNF Before
-- ==========================================
CREATE TABLE IF NOT EXISTS UserPass_Before_BCNF (
    User_ID INT,
    Zone_ID VARCHAR(10),
    Pass_Type VARCHAR(20)
);
TRUNCATE TABLE UserPass_Before_BCNF;
INSERT INTO UserPass_Before_BCNF VALUES
(1, 'Z1', 'VIP_North'),
(2, 'Z2', 'Gen_South'),
(3, 'Z1', 'VIP_North');

-- ==========================================
-- BCNF After
-- ==========================================
CREATE TABLE IF NOT EXISTS PassZone_BCNF (
    Pass_Type VARCHAR(20) PRIMARY KEY,
    Zone_ID VARCHAR(10)
);
TRUNCATE TABLE PassZone_BCNF;
INSERT INTO PassZone_BCNF VALUES
('VIP_North', 'Z1'),
('Gen_South', 'Z2');

CREATE TABLE IF NOT EXISTS UserPass_BCNF (
    User_ID INT,
    Pass_Type VARCHAR(20)
);
TRUNCATE TABLE UserPass_BCNF;
INSERT INTO UserPass_BCNF VALUES
(1, 'VIP_North'),
(2, 'Gen_South'),
(3, 'VIP_North');

-- ==========================================
-- 4NF Before
-- ==========================================
CREATE TABLE IF NOT EXISTS UserPrefs_Before_4NF (
    User_ID INT,
    Vehicle_Type VARCHAR(20),
    Zone_Name VARCHAR(30)
);
TRUNCATE TABLE UserPrefs_Before_4NF;
INSERT INTO UserPrefs_Before_4NF VALUES
(1, 'Two-Wheeler', 'North Gate'),
(1, 'Two-Wheeler', 'South Gate'),
(1, 'Four-Wheeler', 'North Gate'),
(1, 'Four-Wheeler', 'South Gate');

-- ==========================================
-- 4NF After
-- ==========================================
CREATE TABLE IF NOT EXISTS UserVehiclePref_4NF (
    User_ID INT,
    Vehicle_Type VARCHAR(20)
);
TRUNCATE TABLE UserVehiclePref_4NF;
INSERT INTO UserVehiclePref_4NF VALUES
(1, 'Two-Wheeler'),
(1, 'Four-Wheeler');

CREATE TABLE IF NOT EXISTS UserZonePref_4NF (
    User_ID INT,
    Zone_Name VARCHAR(30)
);
TRUNCATE TABLE UserZonePref_4NF;
INSERT INTO UserZonePref_4NF VALUES
(1, 'North Gate'),
(1, 'South Gate');

-- ==========================================
-- 5NF Before
-- ==========================================
CREATE TABLE IF NOT EXISTS Valet_Before_5NF (
    Valet_Name VARCHAR(20),
    Agency_Name VARCHAR(30),
    Zone_ID VARCHAR(10)
);
TRUNCATE TABLE Valet_Before_5NF;
INSERT INTO Valet_Before_5NF VALUES
('John', 'ParkAssist', 'Z1'),
('Mike', 'QuickPark', 'Z2'),
('John', 'QuickPark', 'Z2');

-- ==========================================
-- 5NF After
-- ==========================================
CREATE TABLE IF NOT EXISTS ValetAgency_5NF (
    Valet_Name VARCHAR(20),
    Agency_Name VARCHAR(30)
);
TRUNCATE TABLE ValetAgency_5NF;
INSERT INTO ValetAgency_5NF VALUES
('John', 'ParkAssist'),
('Mike', 'QuickPark'),
('John', 'QuickPark');

CREATE TABLE IF NOT EXISTS AgencyZone_5NF (
    Agency_Name VARCHAR(30),
    Zone_ID VARCHAR(10)
);
TRUNCATE TABLE AgencyZone_5NF;
INSERT INTO AgencyZone_5NF VALUES
('ParkAssist', 'Z1'),
('QuickPark', 'Z2');

CREATE TABLE IF NOT EXISTS ValetZone_5NF (
    Valet_Name VARCHAR(20),
    Zone_ID VARCHAR(10)
);
TRUNCATE TABLE ValetZone_5NF;
INSERT INTO ValetZone_5NF VALUES
('John', 'Z1'),
('Mike', 'Z2'),
('John', 'Z2');
