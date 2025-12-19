# KwentoFlow Lexical Analyzer

> A complete lexical analysis tool for the KwentoFlow programming language

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
│   (Node.js)     │ ← Tokenizes code
└────────┬────────┘
         │
         ↓
    JSON Tokens
```

## 🚀 Quick Start

### Full Stack
# KwentoFlow Lexical Analyzer - Setup & Run Instructions

This project is divided into two separate applications:
1.  **Backend**: An Express.js server that handles the lexical analysis logic.
2.  **Frontend**: A React/Vite interface for writing code and viewing results.

You must run **both** terminals simultaneously for the application to work.

---

## 1. Prerequisites

Before starting, ensure you have **Node.js** installed on your machine.
* **Check installation:** Open a terminal and run `node -v`.
* **Install:** If not found, download it from [nodejs.org](https://nodejs.org/).

---

## 2. How to Run the Project

### Step A: Start the Backend 
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
    ✅ **Success:** You should see: `Backend server running on http://localhost:5000`

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

## 3. Troubleshooting

| Error Message | Solution |
| :--- | :--- |
| **`ENOENT: no such file or directory, open 'package.json'`** | You are likely in the root folder. You must `cd backend` or `cd frontend` before running npm commands. |
| **`Address already in use`** | The server is already running in another window. Close other terminals or press `Ctrl + C` to stop the old process. |
| **Frontend says "Network Error"** | Ensure the **Backend** terminal is running and hasn't crashed. The frontend needs the backend to verify the code. |

## 📁 Project Structure

- `/backend` - Lexical analyzer API (Node.js + TypeScript)
- `/frontend` - Web-based code editor (React + TypeScript)

## 👥 Team

**Backend Devs:** John Rich Nicolas, Vince Lasam, James Agbon, Jeff Mercado
**Frontend Devs:** Kevin Gerona, Clarence Ignacio
**UI/UX:** Lian Paredes




