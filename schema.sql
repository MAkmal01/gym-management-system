-- ─────────────────────────────────────────────
--  IronCore Gym — MySQL Schema
--  Run this file once to set up the database:
--  mysql -u root -p < schema.sql
-- ─────────────────────────────────────────────



-- ── MEMBERSHIP PLANS ──
CREATE TABLE IF NOT EXISTS plans (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(50)    NOT NULL UNIQUE,          -- Basic, Premium, Elite
  price      DECIMAL(10,2)  NOT NULL,
  duration   VARCHAR(20)    NOT NULL DEFAULT 'Monthly',
  features   TEXT,                                     -- JSON string
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── TRAINERS ──
CREATE TABLE IF NOT EXISTS trainers (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  specialization VARCHAR(100),
  experience_yrs INT          DEFAULT 0,
  rating         DECIMAL(3,1) DEFAULT 0.0,
  email          VARCHAR(150) UNIQUE,
  phone          VARCHAR(20),
  created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ── MEMBERS ──
CREATE TABLE IF NOT EXISTS members (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(60)  NOT NULL,
  last_name  VARCHAR(60)  NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  phone      VARCHAR(20)  NOT NULL,
  dob        DATE,
  gender     ENUM('Male','Female','Prefer not to say'),
  address    VARCHAR(255),
  plan_id    INT,
  trainer_id INT,
  notes      TEXT,
  status     ENUM('Active','Inactive','Suspended') DEFAULT 'Active',
  joined_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id)    REFERENCES plans(id)    ON DELETE SET NULL,
  FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL
);

-- ── CLASSES ──
CREATE TABLE IF NOT EXISTS classes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  day         ENUM('Mon','Tue','Wed','Thu','Fri','Sat','Sun') NOT NULL,
  time        TIME         NOT NULL,
  duration    VARCHAR(20)  NOT NULL,
  level       ENUM('Low','Med','High') DEFAULT 'Med',
  total_slots INT          DEFAULT 20,
  trainer_id  INT,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL
);

-- ── CLASS BOOKINGS ──
CREATE TABLE IF NOT EXISTS bookings (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  member_id  INT NOT NULL,
  class_id   INT NOT NULL,
  booked_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status     ENUM('Confirmed','Cancelled') DEFAULT 'Confirmed',
  UNIQUE KEY unique_booking (member_id, class_id),
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id)  REFERENCES classes(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
--  SEED DATA
-- ─────────────────────────────────────────────

INSERT IGNORE INTO plans (name, price, features) VALUES
('Basic',   2500.00, '["Gym floor 6AM-10PM","Locker & shower","Free parking","Basic fitness assessment"]'),
('Premium', 4500.00, '["Gym floor 24/7","Locker & shower","Free parking","Full fitness assessment","All group classes","4 trainer sessions/month","2 guest passes/month"]'),
('Elite',   8000.00, '["Gym floor 24/7","Locker & shower","Free parking","Full fitness assessment","All group classes","Unlimited trainer sessions","Monthly nutrition consultation","Sauna & spa access","5 guest passes/month"]');

INSERT IGNORE INTO trainers (name, specialization, experience_yrs, rating, email, phone) VALUES
('Ali Hassan',  'Strength & Powerlifting', 8,  4.9, 'ali@ironcore.com',    '+92-300-1111111'),
('Sara Khan',   'Cardio & Endurance',      5,  4.8, 'sara@ironcore.com',   '+92-300-2222222'),
('Usman Tariq', 'CrossFit & HIIT',         6,  4.9, 'usman@ironcore.com',  '+92-300-3333333'),
('Ayesha Mir',  'Yoga & Flexibility',      7,  5.0, 'ayesha@ironcore.com', '+92-300-4444444'),
('Bilal Ahmed', 'Boxing & MMA',            10, 4.7, 'bilal@ironcore.com',  '+92-300-5555555'),
('Zara Noor',   'Pilates & Core',          4,  4.8, 'zara@ironcore.com',   '+92-300-6666666');

INSERT IGNORE INTO classes (name, day, time, duration, level, total_slots, trainer_id) VALUES
('Morning HIIT',     'Mon', '06:30:00', '45 min', 'High', 20, 3),
('Power Yoga',       'Mon', '09:00:00', '60 min', 'Low',  15, 4),
('Strength Circuit', 'Tue', '07:00:00', '60 min', 'High', 12, 1),
('Pilates Core',     'Tue', '10:00:00', '45 min', 'Low',  15, 6),
('Cardio Blast',     'Wed', '06:00:00', '50 min', 'Med',  25, 2),
('Boxing Basics',    'Wed', '18:00:00', '60 min', 'Med',  12, 5),
('CrossFit Open',    'Thu', '07:00:00', '60 min', 'High', 20, 3),
('Flex & Stretch',   'Thu', '11:00:00', '45 min', 'Low',  20, 4),
('Deadlift Clinic',  'Fri', '08:00:00', '75 min', 'High',  8, 1),
('Zumba Dance',      'Fri', '17:30:00', '50 min', 'Low',  25, 2),
('Sparring Session', 'Sat', '09:00:00', '60 min', 'High', 10, 5),
('Weekend Pilates',  'Sat', '11:00:00', '45 min', 'Low',  15, 6);
