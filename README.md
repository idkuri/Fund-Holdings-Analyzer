# Prospect Take Home

## Environment Setup
1. Populate `.env` files before running the project:
   - For **production**, use `/frontend/.env.production`
   - For **development**, use `/frontend/.env.development`
   
   Reference the example files:
   - `/frontend/.env.development-example`
   - `/frontend/.env.production-example`

## Run the Project
Use Docker Compose to build and start both frontend and backend:
```bash
docker compose up --build -d
```

## Run Tests
```bash
pytest -v test.py
```

---
## Logs
Logs are saved in app.log for debugging purposes

## Development Checklist

### Core Functionality Requirements
- [x] CIK Input & Validation
- [x] N-Port Data Retrieval
- [x] Holdings Display (CUSIP, Title/Name, Balance, Value)
- [x] Basic Error Handling

### Optional Enhancements
- [x] **Error Handling**
- [x] **Enhanced UI/UX**
- [x] **Data Visualization**
- [x] **Caching and Performance**
- [x] **Testing**
- [x] **Containerization**

- [x] **Security Enhancements**

