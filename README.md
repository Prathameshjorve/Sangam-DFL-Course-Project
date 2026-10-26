# SANGAM: Distributed Multi-City Text Intelligence & Suspicious Activity Analysis Platform

A complete distributed systems platform built for the **DFL (Distributed Systems)** academic project.

SANGAM features four autonomous local city servers (**Mumbai**, **Bengaluru**, **Kolkata**, **Chennai**), each equipped with its own text-analysis model adapter and local MongoDB store, aggregated by a central **Global Coordinator** using genuine HTTP inter-service communication and an automated cross-city correlation engine.

---

## 1. Tactical Military Design System

The frontend replicates the supplied defense template:
- **Palette**: Military olive and drab (`#4C5744`, `#1F241C`, `#2D3627`, `#526046`, `#BAC8AB`, `#FAFBF9`).
- **Tactical Cut-Outs**: Beveled polygonal corner cut-outs on action cards, military rank chevron insignias, and segmented telemetry dials.
- **Dynamic Indicators**: Pulse indicators for live node connectivity, priority alert tags, and correlation match metrics.

---

## 2. Distributed Architecture

```
                   ┌───────────────────────────────────┐
                   │     SANGAM Global Coordinator     │
                   │    FastAPI Central Service :8000  │
                   └─────────────────┬─────────────────┘
                                     │  (HTTP Sync & Polling)
        ┌──────────────────┬─────────┴────────┬──────────────────┐
        │                  │                  │                  │
        ▼                  ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ Mumbai Node  │   │Bengaluru Node│   │ Kolkata Node │   │ Chennai Node │
│  Port 8001   │   │  Port 8002   │   │  Port 8003   │   │  Port 8004   │
├──────────────┤   ├──────────────┤   ├──────────────┤   ├──────────────┤
│Mock NLP v1.0 │   │Mock NLP v1.0 │   │Mock NLP v1.0 │   │Mock NLP v1.0 │
│MongoDB Store │   │MongoDB Store │   │MongoDB Store │   │MongoDB Store │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
```

- **Fault Isolation**: An offline city server does not crash the coordinator. The Global Coordinator serves cached records and marks the specific node as offline.
- **Idempotent Synchronization**: Global deduplication prevents duplicate records across repeated sync passes.
- **Cross-City Correlation Engine**: Dynamically analyzes vehicle descriptions, matched keywords, and narrative similarities to detect links between incidents in different cities.

---

## 3. Configured Service Ports

| Service | Port | Interactive Swagger API Docs |
|---|---|---|
| **Frontend Dashboard (Vite + React)** | `5173` | http://localhost:5173 |
| **Global Coordinator Server** | `8000` | http://127.0.0.1:8000/docs |
| **Mumbai Local Server** | `8001` | http://127.0.0.1:8001/docs |
| **Bengaluru Local Server** | `8002` | http://127.0.0.1:8002/docs |
| **Kolkata Local Server** | `8003` | http://127.0.0.1:8003/docs |
| **Chennai Local Server** | `8004` | http://127.0.0.1:8004/docs |

---

## 4. Quick Start & Execution

### Step 1: Ensure MongoDB is Running
MongoDB is already installed and running as a Windows service on `127.0.0.1:27017`.

### Step 2: Seed the Database
Populates initial realistic demonstration records across all four cities with cross-city correlation patterns:
```powershell
py backend/database/seed.py
```

### Step 3: Launch All 5 Backend Microservices
Run the automated unified service mesh launcher:
```powershell
py scripts/start_all_services.py
```
*(Or start each individually with `py -m uvicorn global_server.main:app --port 8000` etc.)*

### Step 4: Launch the React Tactical Frontend
In a new terminal:
```powershell
cd frontend
npm run dev
```
Open **http://localhost:5173** in your browser.

---

## 5. Model Adapter Architecture (Mock to Real Model Guide)

All models inherit from `BaseModelAdapter` in [backend/shared/model_adapter_base.py](file:///d:/SEM%205%20project/DFL%20PROJECT/backend/shared/model_adapter_base.py).

To plug in a trained machine learning model (e.g., PyTorch, HuggingFace Transformers, TF, or Scikit-learn):
1. Subclass `BaseModelAdapter`.
2. Implement:
   - `load_model()`: Load the model weights (`.pt`, `.bin`, `.joblib`).
   - `predict(text, area)`: Run inference and return a `ModelPredictionResult`.
   - `get_model_status()`: Return model metadata and version.
3. Replace the adapter instantiation in [city_service.py](file:///d:/SEM%205%20project/DFL%20PROJECT/backend/city_servers/city_service.py).
Neither the frontend nor the Global Coordinator API contracts require any changes.

---

## 6. Verification and Testing

Execute the automated test suite:
```powershell
py -m pytest backend/tests/
```
All unit tests validate text classification, entity extraction, and cross-city correlation linkage.
