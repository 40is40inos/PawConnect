# PawConnect: A Pet Services Marketplace

A full-stack web application architected to facilitate a multi-role marketplace for Pet Owners and Pet Keepers. The platform leverages a modern JavaScript stack to deliver a secure, scalable, and responsive experience.

Developed as a flagship project by Sarantis Sarantinos and Kiriaki Dimopoulou for the Internet-Centric Computing (HY351) course.

---

## Technical Architecture

The application follows a decoupled client-server architecture, ensuring a separation of concerns between the presentation layer and the business logic.

### Backend (RESTful API)
- **Engine:** Node.js with the Express.js framework for efficient request routing and middleware integration.
- **Data Persistence:** MySQL relational database managed via the **Sequelize ORM**, providing robust data mapping, validation, and schema synchronization.
- **Security & Session Management:** 
    - **CORS:** Configured for secure cross-origin resource sharing between the frontend (Port 3000) and backend (Port 5000).
    - **Authentication:** Custom session management utilizing `cookie-parser` for persistent, client-side session state.
    - **Validation:** Server-side checks for unique user identifiers (usernames, emails) during the registration lifecycle.

### Frontend (Single Page Application)
- **Framework:** React 18, utilizing functional components and hooks for optimized state management.
- **Routing:** React Router 6 for declarative, client-side navigation.
- **API Integration:** Axios-based service layer with interceptors for streamlined HTTP communication.
- **State Persistence:** `react-cookie` for seamless synchronization with backend session tokens.

---

## Data Model (Sequelize Schema)

The core domain model revolves around the `User` entity, characterized by the following attributes:

- **Primary Keys:** `userName` (String, Unique), `email` (String, Unique).
- **Role System:** `type` attribute utilizing SQL Enums: `PETKEEPER` | `PETOWNER`.
- **Demographics:** `sex` (Enum: `F`, `M`, `O`), `birthdate`, `city`, `country`.
- **Contact:** `phoneNumber`, `address`.

---

## API Endpoints

### Authentication & Lifecycle
- `POST /login`: Validates credentials and initializes session cookies.
- `POST /register`: Persists new user entities after validation.
- `POST /`: Heartbeat/Session check for auto-login capabilities.

### User Management
- `GET /users/getPetOwners`: Retrieves all users with the `PETOWNER` role.
- `GET /users/getPetKeepers`: Retrieves all users with the `PETKEEPER` role.
- `POST /users/update/:username`: Updates profile metadata for a specific user.

### Administrative Actions
- `GET /usersForAdmin/getAll`: Aggregated view of all platform users.
- `DELETE /usersForAdmin/:username`: Administrative removal of user accounts.

---

## Suggested Rebranding Names

To better reflect the platform's professional and connective nature, the following names are suggested:

1.  **PawConnect** (Selected): Emphasizes the community and networking aspect.
2.  **PetSitter Hub**: Direct and SEO-friendly.
3.  **TailTales**: A warm, community-focused brand.
4.  **CritterCare**: Simple, memorable, and alliterative.
5.  **AnimaLink**: A modern, tech-centric approach to pet services.
6.  **Fur-Ever Services**: Playful and service-oriented.

---

## Project Structure

```text
pet-services-marketplace/
├── backend/            # Express Server & API logic
│   ├── controllers/    # Request handling and response formatting
│   ├── models/         # Sequelize schemas and DB initialization
│   ├── services/       # Core business logic and database queries
│   ├── utils/          # Database connection configuration
│   └── server.js       # Express application entry point
└── frontend/           # React Single Page Application
    ├── public/         # Static assets and index.html
    └── src/
        ├── api/        # Modularized API service calls
        ├── components/ # Atomic UI components (CSS + JSX)
        └── pages/      # Route-level view components
```

---

## Installation & Setup

### 1. Prerequisites
- Node.js (v16+)
- MySQL Server

### 2. Database Configuration
1. Create a MySQL database (e.g., `pet_marketplace`).
2. Configure connection parameters in `backend/utils/db_connection.js`.
3. The server will automatically sync the schema on the first run via `initDB()`.

### 3. Execution
**Backend:**
```bash
cd backend && npm install && npm start
```

**Frontend:**
```bash
cd frontend && npm install && npm start
```

---

## License

This project was developed by Sarantis Sarantinos and Kiriaki Dimopoulou for academic purposes as part of the HY359 course. All rights reserved.
