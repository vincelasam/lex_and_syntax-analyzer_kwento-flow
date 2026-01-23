# KwentoFlow Analyzer
> A complete lexical and syntax analysis tool for the KwentoFlow programming language

## 🏗️ Architecture
```
┌─────────────────┐
│   Frontend      │
│   (React)       │ ← User writes KwentoFlow code
└────────┬────────┘
         │ HTTP POST
         ↓
┌─────────────────┐
│   Backend       │
│   (Node.js)     │ ← Lexical & Syntax Analysis
└────────┬────────┘
         │
         ↓
    Tokens → Parser → AST
```

## 📚 What This Tool Does

### **Lexical Analyzer** (Phase 1 - ✅ Complete)
- Breaks KwentoFlow code into tokens (keywords, identifiers, operators, etc.)
- Detects invalid characters and lexical errors
- Generates PDF reports of token tables

### **Syntax Analyzer** (Phase 2 - ✅ Complete)
- Validates if tokens follow KwentoFlow grammar rules
- Builds an Abstract Syntax Tree (AST)
- Detects syntax errors (missing semicolons, braces, etc.)
- Provides detailed error messages with line/column numbers

---

# KwentoFlow Analyzer - Setup & Run Instructions

This project is divided into two separate applications:

1.  **Backend**: An Express.js server that handles lexical analysis, syntax parsing, and validation.
2.  **Frontend**: A React/Vite interface for writing code and viewing analysis results.

You must run **both** terminals simultaneously for the application to work.

---

## 1. Prerequisites

Before starting, ensure you have **Node.js** installed on your machine.

* **Check installation:** Open a terminal and run `node -v`.
* **Install:** If not found, download it from [nodejs.org](https://nodejs.org/).

---

## 2. How to Run the Project

### Step A: Start the Backend (The Analysis Engine)
*This starts the server on port 5000.*

1.  Open your **first** terminal window.
2.  Navigate to the backend folder:
```bash
    cd backend
```
3.  Install dependencies (only required the first time):
```bash
    npm install
```
4.  Start the server:
```bash
    npm run dev
```
    ✅ **Success:** You should see:
```
    ╔═══════════════════════════════════════╗
    ║  🚀 KwentoFlow Analyzer API          ║
    ║  📍 http://localhost:5000            ║
    ║                                       ║
    ║  Lexical Analyzer:                    ║
    ║  📝 POST /analyze                     ║
    ║  📄 POST /generate-pdf                ║
    ║                                       ║
    ║  Syntax Analyzer:                     ║
    ║  🔍 POST /parse                       ║
    ║  ✅ POST /validate                    ║
    ╚═══════════════════════════════════════╝
```

### Step B: Start the Frontend (The Interface)
*This starts the website, usually on port 5173.*

1.  Open a **new, second** terminal window (keep the backend running!).
2.  Navigate to the frontend folder:
```bash
    cd frontend
```
3.  Install dependencies (only required the first time):
```bash
    npm install
```
4.  Start the website:
```bash
    npm run dev
```
    ✅ **Success:** Click the link shown (e.g., `http://localhost:5173`) to open the app in your browser.

---

## 3. Using the Application

### **Lexical Analyzer Tab**
1. Write or paste KwentoFlow code in the editor
2. Click **"Analyze & Generate Tokens"**
3. View token table in the right panel
4. Click **"Download PDF"** to get a formatted token report

### **Syntax Analyzer Tab**
1. Write or paste KwentoFlow code in the editor
2. Click **"Parse & Validate Syntax"**
3. View parse results:
   - ✅ **Valid:** See the generated AST (Abstract Syntax Tree)
   - ❌ **Invalid:** See detailed error messages with line/column numbers

---

## 4. Troubleshooting

| Error Message | Solution |
| :--- | :--- |
| **`ENOENT: no such file or directory, open 'package.json'`** | You are likely in the root folder. You must `cd backend` or `cd frontend` before running npm commands. |
| **`Address already in use`** | The server is already running in another window. Close other terminals or press `Ctrl + C` to stop the old process. |
| **Frontend says "Network Error"** | Ensure the **Backend** terminal is running and hasn't crashed. The frontend needs the backend to analyze the code. |
| **"Cannot find module 'Parser'"** | The syntax analyzer is still in development. Make sure you've pulled the latest code from the repository. |

---

## 📁 Project Structure
```
kwentoflow-analyzer/
├── backend/
│   ├── src/
│   │   ├── examples/       # Code Samples of KwentoFlow
│   │   ├── lexer/          # Lexical analysis (Phase 1)
│   │   ├── parser/         # Syntax analysis (Phase 2)
│   │   ├── ast/            # Abstract Syntax Tree builder
│   │   ├── server/         # Express API endpoints
│   │   └── types/          # Shared TypeScript types
│   │   ├── utils/          # Utilies for tokenization
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LexicalPage.tsx   # Lexical analyzer UI
│   │   │   └── SyntaxPage.tsx    # Syntax analyzer UI
│   │   └── components/           # Reusable UI components
│   └── package.json
│
└── README.md
```

---

## 🔌 API Endpoints

### **Lexical Analyzer**
- `POST /analyze` - Returns token array from source code
- `POST /generate-pdf` - Returns PDF document of token table

### **Syntax Analyzer**
- `POST /parse` - Returns AST and syntax errors
- `POST /validate` - Returns simple valid/invalid result

---

## 👥 Team

**Backend Team:**
- **Lexical Analyzer:** John Rich Nicolas, Vince Lasam, James Agbon, Jeff Petterson Mercado
- **Syntax Analyzer (Parser Logic):** Vince Lasam
- **Syntax Analyzer (AST Builder):** James Agbon
- **API Integration:** John Rich Nicolas
- **PDF Generation:** Jeff Petterson Mercado

**Frontend Team:**
- Kevin Gerona, Clarence Ignacio

**UI/UX:**
- Lian Paredes

---

## 🚀 Development Status

- ✅ **Lexical Analyzer** - Complete and functional
- ✅ **Syntax Analyzer** - Complete and functional

---

## 📝 Notes for Developers

- Keep both terminals running while developing
- Backend auto-reloads on file changes (nodemon)
- Frontend auto-reloads on file changes (Vite HMR)
- Test API endpoints with `curl` or Postman before integrating with frontend

---

**Last Updated:** January 2025
