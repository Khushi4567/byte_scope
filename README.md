# ByteScope — Interactive Computer Memory Explorer

A React + CSS frontend with a Python FastAPI backend for demonstrating computer data representation.

## Features in this starter version
- Memory Explorer: integer-to-binary/hex conversion and byte allocation
- Endian Battle: Big Endian vs Little Endian comparison
- Number Identity: signed and unsigned interpretation of the same bit pattern
- Float Detective: IEEE 754 single and double precision fields
- Bit Manipulation: modify a selected bit and inspect the new value

## Requirements
- Python 3.10+
- Node.js 18+
- npm

## 1. Run the backend

Open a terminal:

```bash
cd backend
python -m venv venv
```

Activate the environment:

Windows PowerShell:
```powershell
.\venv\Scripts\Activate.ps1
```

Windows CMD:
```cmd
venv\Scripts\activate
```

Install dependencies and start FastAPI:

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend:
- API: http://127.0.0.1:8000
- Interactive API documentation: http://127.0.0.1:8000/docs

## 2. Run the frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually:
http://localhost:5173

## API endpoints
- `GET /api/health`
- `POST /api/integer/inspect`
- `POST /api/float/inspect`
- `POST /api/memory/modify-bit`

## Example request

```json
{
  "value": 258,
  "bits": 16,
  "signed": false,
}
```

## Notes
- The memory addresses shown in the UI are simulated starting at `0x1000`; they are not physical RAM addresses.
- Endianness is simulated by Python's byte conversion functions.
- IEEE 754 values are packed using Python's `struct` module. Single precision (32-bit) may round the input value.
- This is an educational simulator, not a debugger for the host computer's actual memory.
