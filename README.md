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
```bash
npm run install:all
npm run dev
```

## 📁 Project Structure

- `/backend` - Lexical analyzer API (Node.js + TypeScript)
- `/frontend` - Web-based code editor (React + TypeScript)

## 👥 Team

**Backend Devs:** John Rich Nicolas, Vince Lasam, James Agbon, Jeff Mercado
**Frontend Devs:** Kevin Gerona, Clarence Ignacio
**UI/UX:** Lian Paredes




