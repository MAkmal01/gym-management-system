# 💪 IronCore Gym — REST API

**Node.js + Express + MySQL**  
5th Semester Project Backend

---

## 📁 Project Structure

```
gym-backend/
├── server.js          ← Entry point
├── schema.sql         ← Database setup
├── .env               ← Config (DB credentials etc.)
├── package.json
├── config/
│   └── db.js          ← MySQL connection pool
├── middleware/
│   └── validate.js    ← Input validation middleware
└── routes/
    ├── members.js     ← Member CRUD
    ├── plans.js       ← Membership plan CRUD
    ├── trainers.js    ← Trainer CRUD
    ├── classes.js     ← Class CRUD + bookings
    └── dashboard.js   ← Summary stats
```

---

## ⚙️ Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure `.env`
```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=ironcore_gym
```

### 3. Create database & tables
```bash
mysql -u root -p < schema.sql
```
This creates the `ironcore_gym` database, all tables, and seeds plans, trainers, and classes automatically.

### 4. Run the server
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Server runs on: `http://localhost:5000`

---

## 📡 API Endpoints

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Total members, trainers, classes, plan distribution |

---

### Members
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/members` | Get all members |
| GET | `/api/members?search=ahmed` | Search by name/email |
| GET | `/api/members?plan=Premium` | Filter by plan |
| GET | `/api/members?status=Active` | Filter by status |
| GET | `/api/members/:id` | Get single member |
| POST | `/api/members` | Register new member |
| PUT | `/api/members/:id` | Update member |
| DELETE | `/api/members/:id` | Delete member |

**POST /api/members — Request Body:**
```json
{
  "first_name": "Ahmed",
  "last_name":  "Raza",
  "email":      "ahmed@example.com",
  "phone":      "+92-300-1234567",
  "dob":        "2000-05-15",
  "gender":     "Male",
  "address":    "Gujranwala, Punjab",
  "plan_id":    2,
  "trainer_id": 1,
  "notes":      "Weight loss goal"
}
```

---

### Plans
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plans` | Get all plans |
| GET | `/api/plans/:id` | Get single plan |
| POST | `/api/plans` | Create plan |
| PUT | `/api/plans/:id` | Update plan |
| DELETE | `/api/plans/:id` | Delete plan |

---

### Trainers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trainers` | Get all trainers (with member counts) |
| GET | `/api/trainers/:id` | Get trainer + their classes |
| POST | `/api/trainers` | Add trainer |
| PUT | `/api/trainers/:id` | Update trainer |
| DELETE | `/api/trainers/:id` | Delete trainer |

---

### Classes & Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/classes` | Get all classes (with filled slots) |
| GET | `/api/classes?day=Mon` | Filter by day |
| GET | `/api/classes/:id` | Get single class |
| POST | `/api/classes` | Create class |
| DELETE | `/api/classes/:id` | Delete class |
| GET | `/api/classes/:id/bookings` | List bookings for a class |
| POST | `/api/classes/:id/bookings` | Book a class |
| DELETE | `/api/classes/:id/bookings/:bookingId` | Cancel booking |

**POST /api/classes/:id/bookings — Request Body:**
```json
{ "member_id": 5 }
```

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| express | Web framework |
| mysql2 | MySQL driver (promise-based) |
| cors | Cross-Origin Resource Sharing |
| dotenv | Environment variables |
| bcryptjs | Password hashing (for future auth) |
| express-validator | Input validation |
| nodemon | Auto-restart in dev mode |

---

## 🔌 Connecting to Frontend

Replace `localStorage` calls in `gym-management-system.html` with `fetch()`:

```javascript
// Register member
const res = await fetch('http://localhost:5000/api/members', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(memberData)
});
const data = await res.json();

// Get all members
const res = await fetch('http://localhost:5000/api/members');
const { data: members } = await res.json();
```
