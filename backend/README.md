# MediVault – Backend (Spring Boot)

REST API backend for the MediVault patient health management platform.

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | Spring Boot 3.2 |
| Language | Java 17 |
| ORM | Spring Data JPA / Hibernate |
| Database (dev) | H2 In-Memory |
| Database (prod) | PostgreSQL |
| Auth | JWT (JJWT 0.11) + OTP flow |
| Security | Spring Security 6 |
| Build | Maven |

## Getting Started

### Prerequisites
- Java 17+
- Maven 3.8+

### Run in development mode
```bash
cd backend
mvn spring-boot:run
```

The server starts on **http://localhost:8080**.  
H2 console available at **http://localhost:8080/h2-console** (JDBC URL: `jdbc:h2:mem:medivaultdb`).

### Build a JAR
```bash
mvn clean package
java -jar target/medivault-backend-0.0.1-SNAPSHOT.jar
```

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/send-otp` | Public | Request OTP for email |
| POST | `/api/auth/login` | Public | Verify OTP → JWT |

### Patients
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/patients` | JWT | List all patients |
| GET | `/api/patients/{id}` | JWT | Get patient by ID |
| POST | `/api/patients` | JWT | Create patient |
| PUT | `/api/patients/{id}` | JWT | Update patient |
| DELETE | `/api/patients/{id}` | JWT | Delete patient |

### Medical Records
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/patients/{id}/records` | JWT | Get records for patient |
| POST | `/api/patients/{id}/records` | JWT | Add a record |
| DELETE | `/api/patients/{id}/records/{recordId}` | JWT | Delete a record |

### Appointments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/patients/{id}/appointments` | JWT | Get appointments |
| POST | `/api/appointments` | JWT | Book appointment |
| PATCH | `/api/appointments/{id}/status` | JWT | Update status |
| DELETE | `/api/appointments/{id}` | JWT | Cancel appointment |

### Symptoms
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/symptoms/catalog` | Public | Symptom options list |
| GET | `/api/patients/{id}/symptom-history` | JWT | Past analyses |
| GET | `/api/symptom-analyses/{id}` | JWT | Single analysis |
| POST | `/api/symptom-analyses` | JWT | Run symptom check |

---

## Connecting the Frontend

In `frontend/.env` (create this file):
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_USE_MOCK=false
```

---

## Production (PostgreSQL)
Set the active profile and supply env vars:
```bash
export SPRING_PROFILES_ACTIVE=prod
export DB_USERNAME=your_db_user
export DB_PASSWORD=your_db_password
java -jar target/medivault-backend-0.0.1-SNAPSHOT.jar
```
