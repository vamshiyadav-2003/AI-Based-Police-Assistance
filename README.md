# AI Police Assistant

Core skeleton built and working end-to-end:
- **Auth** — JWT login, role-based access (officer / station_head / admin)
- **Case Management** — create/list/update cases, status workflow
- **AI Chat Assistant** — Groq-hosted LLM (Llama 3), traced via LangSmith
- **AI FIR Generator** — raw complaint text → structured FIR draft (JSON)
- **Semantic Case Search (RAG)** — natural-language search over cases using Sentence Transformers + ChromaDB

Modules not yet built (from your full spec — add later): Voice-to-text (Whisper), Face Recognition, Crime Prediction (XGBoost), CCTV/YOLO detection, Vehicle Verification, Heatmaps, PDF report generation. The architecture already has clean seams (`services/`, `routers/`) to drop these in.

## 1. Configure your database connection

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL` to your existing PostgreSQL database, e.g.:
```
DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/police_db
```

Also fill in:
```
GROQ_API_KEY=...        # from https://console.groq.com
LANGCHAIN_API_KEY=...   # from https://smith.langchain.com
```

> The app only **adds** tables it needs (`officers`, `cases`, `case_updates`, `chat_messages`) — it will never touch or drop any existing tables in your database.

## 2. Run the backend (without Docker)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create your first admin account (required before anyone can log in)
python create_admin.py

# Start the API
uvicorn app.main:app --reload
```
API runs at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

## 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```
App runs at `http://localhost:5173`.

## 4. Run everything with Docker instead

```bash
docker compose up --build
```
This builds and runs the backend + frontend containers. It still expects `DATABASE_URL` in `backend/.env` to point at your own PostgreSQL — see the note in `docker-compose.yml` about connecting to a database running on your host machine.

You'll still need to run `python create_admin.py` once (either locally with the same `.env`, or via `docker compose exec backend python create_admin.py`).

## 5. Try it out

1. Log in with the admin account you created
2. Go to **Case Management** → create a test case with a description
3. Go to **AI FIR Assistant** → paste a sample complaint → generate a draft
4. Go to **Case Search** → ask "show me cases involving a motorcycle"
5. Go to **AI Assistant** → ask a legal/procedural question

## API reference (once running)
Full interactive API docs (all endpoints, request/response schemas): `http://localhost:8000/docs`

## Project structure
```
police-ai-assistant/
├── backend/
│   ├── app/
│   │   ├── core/        # config, DB connection, JWT/auth
│   │   ├── models/       # SQLAlchemy models (Officer, Case, ChatMessage)
│   │   ├── schemas/      # Pydantic request/response schemas
│   │   ├── routers/      # API endpoints (auth, cases, chat, fir, search)
│   │   ├── services/     # AI logic (Groq chat, FIR generation, RAG search)
│   │   └── main.py
│   ├── create_admin.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    └── src/
        ├── pages/         # Login, Overview, Cases, FIR, Search, Chat
        ├── components/    # DashboardLayout (sidebar nav)
        └── api/client.js  # Axios instance with JWT interceptor
```

## Adding the remaining modules
- **Voice-to-text**: add a `/fir/transcribe` endpoint using `openai-whisper`, feed its output into the existing `generate_fir_draft()`
- **Face Recognition**: new `criminals` / `missing_persons` tables + `face_recognition` library, store embeddings alongside photo path
- **Crime Prediction**: new `services/prediction_service.py` with an XGBoost model trained on your historical case data (features: day_of_week, hour, area, past_crime_count)
- **CCTV Detection**: separate service running YOLOv11 on a video stream, POSTing detected events to a new `/alerts` endpoint
