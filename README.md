rag-app/
│
├── frontend/                        # Next.js Frontend
│   │
│   ├── app/
│   │   ├── page.jsx                # Home page
│   │   │
│   │   ├── upload/
│   │   │   └── page.jsx            # Upload PDF page
│   │   │
│   │   ├── chat/
│   │   │   └── page.jsx            # Chat UI page
│   │   │
│   │   └── layout.jsx
│   │
│   ├── components/
│   │   ├── UploadBox.jsx
│   │   ├── ChatBox.jsx
│   │   ├── MessageBubble.jsx
│   │   └── Sidebar.jsx
│   │
│   ├── services/
│   │   └── api.js                  # Axios/fetch calls to FastAPI
│   │
│   ├── styles/
│   │
│   ├── public/
│   │
│   ├── .env.local
│   ├── package.json
│   └── next.config.js
│
│
├── backend/                        # FastAPI Backend
│   │
│   ├── app/
│   │   │
│   │   ├── main.py                 # FastAPI entry point
│   │   │
│   │   ├── routes/
│   │   │   ├── upload.py           # Upload APIs
│   │   │   ├── chat.py             # Chat APIs
│   │   │   └── documents.py
│   │   │
│   │   ├── services/
│   │   │   ├── pdf_service.py      # PDF extraction
│   │   │   ├── chunk_service.py    # Text chunking
│   │   │   ├── embedding_service.py
│   │   │   ├── vector_service.py
│   │   │   └── rag_service.py
│   │   │
│   │   ├── database/
│   │   │   ├── mongodb.py
│   │   │   └── models.py
│   │   │
│   │   ├── utils/
│   │   │   ├── helpers.py
│   │   │   └── prompts.py
│   │   │
│   │   ├── uploads/                # Temporary uploaded PDFs
│   │   │
│   │   └── core/
│   │       └── config.py
│   │
│   ├── requirements.txt
│   ├── .env
│   └── README.md
│
│
├── docker-compose.yml              # Optional later
│
├── .gitignore
│
└── README.md