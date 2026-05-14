# Backend (Express)

Quick instructions to run the development backend for the Medical Records project.

Requirements
- Node.js 18+ (or compatible)
- MongoDB running locally or reachable via `MONGO_URI`

Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Create `.env` from the example and adjust values:

```bash
cp .env.example .env
# edit .env as needed
```

Run

- Development (auto-restart):

```bash
npm run start
```

Endpoints
- `GET /api/health` — basic health + Mongo state
- `POST /api/files` — upload a file (form field `file`); query `?encrypt=true` to enable server-side encryption
- `GET /api/files/:cid` — retrieve stored file metadata

Notes
- The project uses `ipfs-http-client` to upload files to an IPFS node defined by `IPFS_API_URL`.
- Encryption keys returned by the upload endpoint are required to decrypt data off-chain and are not stored by the server.
