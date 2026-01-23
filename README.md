# 📖 KwentoFlow Analyzer

> A complete lexical and syntax analysis tool for the KwentoFlow programming language - built for narrative-based programming with integrated security.

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [API Reference](#-api-reference) • [Team](#-team)

</div>

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     KwentoFlow Analyzer                   │
└──────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┴───────────────────┐
          │                                       │
          ▼                                       ▼
┌─────────────────────┐               ┌─────────────────────┐
│   Frontend (React)  │               │  Backend (Node.js)  │
│   Port: 5173        │◄─────HTTP─────┤  Port: 5000         │
│                     │               │                     │
│  • Code Editor      │               │  • Lexical Analyzer │
│  • Token Display    │               │  • Syntax Parser    │
│  • AST Viewer       │               │  • PDF Generator    │
│  • Error Messages   │               │  • API Endpoints    │
└─────────────────────┘               └─────────────────────┘
          │                                       │
          └───────────────────┬───────────────────┘
                              │
                              ▼
                   ┌─────────────────────┐
                   │   Analysis Pipeline │
                   │                     │
                   │  Source Code        │
                   │      ↓              │
                   │  Lexer → Tokens     │
                   │      ↓              │
                   │  Parser → AST       │
                   │      ↓              │
                   │  Validator → Result │
                   └─────────────────────┘
```

---

## ✨ Features

### 🔍 **Phase 1: Lexical Analyzer** (Complete ✅)
- 🎯 **Token Recognition** - Identifies keywords, identifiers, operators, literals, and delimiters
- 🚨 **Error Detection** - Catches invalid characters and malformed tokens
- 📊 **Token Table Generation** - Structured view of all recognized tokens
- 📄 **PDF Export** - Professional token reports with syntax highlighting
- ⚡ **Real-time Analysis** - Instant feedback as you type

### 🌳 **Phase 2: Syntax Analyzer** (Complete ✅)
- 📐 **Grammar Validation** - Ensures code follows KwentoFlow's EBNF grammar
- 🌲 **AST Construction** - Builds hierarchical Abstract Syntax Tree
- 🎨 **Visual Tree Display** - Interactive AST visualization
- 📍 **Error Pinpointing** - Line and column numbers for syntax errors
- 🔧 **Detailed Messages** - Helpful error descriptions with suggestions

### 🎭 **KwentoFlow Language Support**
- 📚 **Narrative Constructs** - `scene`, `character`, `story`, `transition`
- 🔐 **Security Keywords** - `perceives`, `masking`, `where`, `thru`
- 🔄 **Control Flow** - `when`, `choose`, `do`, loops via scene recursion
- 💾 **Data Types** - `text`, `number`, `boolean`, `db`
- 🎮 **Character System** - Typed entities with fields and access control

---

## 🚀 Quick Start

### Prerequisites

Ensure you have **Node.js 18+** installed:

```bash
node -v  # Should show v18.0.0 or higher
```

> 💡 **Don't have Node.js?** Download from [nodejs.org](https://nodejs.org/)

---

### Installation & Setup

#### **Step 1: Clone the Repository**

```bash
git clone https://github.com/your-org/kwentoflow-analyzer.git
cd kwentoflow-analyzer
```

#### **Step 2: Install Dependencies**

You'll need to install packages for **both** backend and frontend:

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies (in a new terminal or after going back)
cd ../frontend
npm install
```

---

### Running the Application

> ⚠️ **Important:** You need to run **TWO terminals simultaneously** - one for backend, one for frontend.

#### **Terminal 1: Start the Backend Server**

```bash
cd backend
npm run dev
```

**✅ Expected Output:**
```
╔═══════════════════════════════════════╗
║  🚀 KwentoFlow Analyzer API           ║
║  📍 http://localhost:5000              ║
║                                       ║
║  Lexical Analyzer:                    ║
║  📝 POST /analyze                    ║
║  📄 POST /generate-pdf                ║
║                                       ║
║  Syntax Analyzer:                     ║
║  🔍 POST /parse                       ║
║  ✅ POST /validate                    ║
╚═══════════════════════════════════════╝
```

#### **Terminal 2: Start the Frontend**

```bash
cd frontend
npm run dev
```

**✅ Expected Output:**
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

#### **Step 3: Open in Browser**

Navigate to **http://localhost:5173** to use the application.

---

## 📖 Usage Guide

### **Lexical Analysis Tab**

1. **Write Code** - Enter KwentoFlow code in the left editor
2. **Analyze** - Click **"Analyze Narrative Structure"**
3. **View Results** - Token table appears in the right panel
4. **Export** - Click **"Download PDF"** for a formatted report

**Example:**
```kwentoflow
scene start {
    text playerName;
    playerName = input("Enter your name:");
    log "Hello, {playerName}!";
}
```

### **Syntax Analysis Tab**

1. **Write Code** - Enter KwentoFlow code in the editor
2. **Parse** - Click **"Analyze Narrative Structure"**
3. **Check Results**:
   - ✅ **Valid:** View the generated AST (Abstract Syntax Tree)
   - ❌ **Invalid:** See error messages with exact locations

**Example Output (Valid):**
```json
{
  "type": "Program",
  "scenes": [
    {
      "type": "SceneDeclaration",
      "name": "start",
      "body": [...]
    }
  ]
}
```

**Example Output (Invalid):**
```
❌ Syntax Error at line 3, column 5:
   Expected ';' after statement
   
   2 | scene start {
   3 |     text playerName
       |                    ^
   4 |     playerName = input("Enter name:");
```

---

## 🗂️ Project Structure

```
kwentoflow-analyzer/
│
├── 📁 backend/                    # Server-side application
│   ├── 📁 src/
│   │   ├── 📁 examples/          # Sample KwentoFlow programs
│   │   ├── 📁 lexer/             # Lexical analyzer implementation
│   │   │   ├── tokenizer.ts     # Token recognition logic
│   │   │   └── tokenTypes.ts    # Token type definitions
│   │   ├── 📁 parser/            # Syntax analyzer implementation
│   │   │   ├── parser.ts        # Grammar validation
│   │   │   └── grammar.ts       # EBNF production rules
│   │   ├── 📁 ast/               # Abstract Syntax Tree builder
│   │   │   ├── astBuilder.ts    # AST construction
│   │   │   └── astTypes.ts      # AST node definitions
│   │   ├── 📁 server/            # Express API
│   │   │   └── routes.ts        # API endpoint handlers
│   │   ├── 📁 types/             # Shared TypeScript types
│   │   └── 📁 utils/             # Helper functions
│   ├── package.json
│   └── tsconfig.json
│
├── 📁 frontend/                   # Client-side application
│   ├── 📁 src/
│   │   ├── 📁 pages/
│   │   │   ├── LexicalPage.tsx  # Lexical analyzer UI
│   │   │   └── SyntaxPage.tsx   # Syntax analyzer UI
│   │   ├── 📁 components/        # Reusable UI components
│   │   │   ├── CodeEditor.tsx   # Monaco editor wrapper
│   │   │   ├── TokenTable.tsx   # Token display component
│   │   │   └── ASTViewer.tsx    # Tree visualization
│   │   ├── 📁 hooks/             # Custom React hooks
│   │   ├── 📁 services/          # API communication
│   │   └── App.tsx               # Main app component
│   ├── package.json
│   └── vite.config.ts
│
├── 📄 README.md                   # This file
└── 📄 .gitignore
```

---

## 🔌 API Reference

### **Base URL**
```
http://localhost:5000
```

### **Endpoints**

#### **1. Lexical Analysis**

##### `POST /analyze`
Analyzes source code and returns tokens.

**Request:**
```json
{
  "code": "scene start { log \"Hello World\"; }"
}
```

**Response:**
```json
{
  "tokens": [
    { "type": "KEYWORD", "value": "scene", "line": 1, "column": 1 },
    { "type": "IDENTIFIER", "value": "start", "line": 1, "column": 7 },
    { "type": "LBRACE", "value": "{", "line": 1, "column": 13 },
    ...
  ],
  "errors": []
}
```

##### `POST /generate-pdf`
Generates a PDF report of tokens.

**Request:**
```json
{
  "code": "scene start { ... }",
  "tokens": [...]
}
```

**Response:**
```
Content-Type: application/pdf
(Binary PDF data)
```

---

#### **2. Syntax Analysis**

##### `POST /parse`
Parses code and returns AST.

**Request:**
```json
{
  "code": "scene start { text x; }"
}
```

**Response:**
```json
{
  "success": true,
  "ast": {
    "type": "Program",
    "scenes": [...]
  },
  "errors": []
}
```

##### `POST /validate`
Simple validation check.

**Request:**
```json
{
  "code": "scene start { ... }"
}
```

**Response:**
```json
{
  "valid": true,
  "message": "Code is syntactically valid"
}
```

**Error Response:**
```json
{
  "valid": false,
  "errors": [
    {
      "line": 3,
      "column": 5,
      "message": "Expected ';' after statement"
    }
  ]
}
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| **`ENOENT: no such file or directory, open 'package.json'`** | You're in the wrong directory. Run `cd backend` or `cd frontend` before `npm install`. |
| **`Error: listen EADDRINUSE :::5000`** | Port 5000 is already in use. Close other terminals or change the port in `backend/src/server/index.ts`. |
| **Frontend shows "Network Error"** | The backend isn't running. Check Terminal 1 - ensure the backend server started successfully. |
| **Module not found errors** | Delete `node_modules` and `package-lock.json`, then run `npm install` again. |
| **Blank screen in frontend** | Check browser console (F12). Ensure both servers are running on correct ports. |

---

## 🧪 Testing

### **Manual Testing**

Test individual components using sample code:

```bash
# Test backend endpoints
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d '{"code":"scene start { log \"test\"; }"}'

# Test syntax validation
curl -X POST http://localhost:5000/validate \
  -H "Content-Type: application/json" \
  -d '{"code":"scene start { text x; }"}'
```

---

## 👥 Team

**Polytechnic University of the Philippines**  
**College of Computer and Information Sciences**  
**COSC 303 - Principles of Programming Languages**

### **Backend Development**

| Member | Role |
|--------|------|
| **John Rich Nicolas** | Lexical Analyzer Core |
| **Michael Vince Lasam** | Syntax Analyzer (Parser Logic) |
| **James Agbon** | AST Builder, Lexical Analyzer |
| **Jeff Petterson Mercado** | PDF Generation, Lexical Analyzer |

### **Frontend Development**

| Member |
|--------|
| **Jan Kevin Gerona** 
| **Clarence Ignacio** 

### **UI/UX**

| Member | 
|--------|
| **Lian Paredes** 

### **Documentation**

| Member | Role |
|--------|------|
| **Lian Paredes** | Lexical Analyzer Documentation | Syntax Analyzer Documentation |
| **Jeff Petterson Mercado** | Syntax Analyzer Documentation |
---

## 📚 Documentation

- [Lexical Analyzer Documentation](https://github.com/user-attachments/files/24823957/Group.6.-.KwentoFlow.Documentation.pdf)
- [Syntax Analyzer Documentation](https://github.com/user-attachments/files/24823958/Group.6.-.Syntax.Analyzer.Documentation.pdf)
  
---

## 🚦 Development Status

- ✅ **Lexical Analyzer** - Fully functional with PDF export
- ✅ **Syntax Analyzer** - Complete with AST visualization
- 🔄 **Semantic Analyzer** - Planned for future release
- 🔄 **Code Generator** - Planned for future release

---

## 📝 Contributing

This is an academic project for **COSC 303**. Contributions are currently limited to team members.

### Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Test both backend and frontend
4. Commit with clear messages: `git commit -m "Add: feature description"`
5. Push and create a pull request

---

## 📄 License

This project is developed as part of academic coursework at the Polytechnic University of the Philippines.

---

## 🔗 Links

- **University:** [Polytechnic University of the Philippines](https://www.pup.edu.ph/)
- **Department:** [College of Computer and Information Sciences](https://www.pup.edu.ph/ccis/)
- **Course:** COSC 303 - Principles of Programming Languages

---

## 📞 Support

For issues or questions:
- Create an issue in the repository
- Contact team members via institutional email
- Refer to documentation in `/docs` folder

---

<div align="center">

**Built with ❤️ by Group 6**  
*January 2025*

[⬆ Back to Top](#-kwentoflow-analyzer)

</div>
