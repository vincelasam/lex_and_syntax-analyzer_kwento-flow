import express from "express";
import cors from "cors";
import { Lexer } from "../lexer/kf_lexer"; 
import { CharStream } from "../utils/charStream";
import { TokenType } from "../types/Tokens";
import { generatePDF } from "../lexer/pdf_generator";
import { Parser } from "../parser/parser";

const app = express();
const PORT = 5000; 
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ 
    status: "OK",
    message: "KwentoFlow Backend Server",
    endpoints: {
      analyze: "POST /analyze",
      generatePdf: "POST /generate-pdf"
    }
  });
});

// Analyze endpoint
app.post("/analyze", (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ success: false, message: "No code provided" });
  }

  try {
    // 1. LEXICAL ANALYSIS
    const lexer = new Lexer(new CharStream(code));
    const tokens = lexer.tokenize();

    const tokensForFrontend = tokens.map((t, idx) => ({
      id: idx + 1,
      line: t.line,
      lexeme: t.lexeme,
      type: TokenType[t.type],
      desc: "",
    }));

    // 2. SYNTAX ANALYSIS
    const parser = new Parser(tokens);
    const parseResult = parser.parse();

    const syntaxErrors = parseResult.errors.map(err => ({
      line: err.token?.line ?? err.line ?? 0,
      message: err.message,
      type: err.type ?? "SYNTAX ERROR"
    }));

    res.json({
      success: true,
      tokens: tokensForFrontend,
      syntaxErrors,
      ast: parseResult.body // optional (future use)
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Unexpected compiler error"
    });
  }
});

// Generate PDF endpoint - MUST match frontend call to /generate-pdf
app.post("/generate-pdf", (req, res) => {
  console.log("📄 /generate-pdf endpoint called");
  const { code } = req.body;
  
  if (!code) {
    console.error("❌ No code provided");
    return res.status(400).json({ 
      success: false, 
      message: "No code provided" 
    });
  }

  try {
    console.log("🔄 Tokenizing code...");
    const lexer = new Lexer(new CharStream(code));
    const tokens = lexer.tokenize();
    
    console.log(`✅ Tokenized ${tokens.length} tokens`);
    console.log("🔄 Generating PDF...");
    
    // Generate PDF Buffer
    const pdfBuffer = generatePDF(tokens);
    
    // Convert Buffer to base64 string
    const base64 = pdfBuffer.toString('base64');
    
    // Create data URI that frontend expects
    const pdfDataUri = `data:application/pdf;base64,${base64}`;
    
    console.log("✅ PDF generated successfully");
    
    // Send as JSON with pdf field (frontend expects this format)
    res.json({ 
      success: true, 
      pdf: pdfDataUri 
    });
  } catch (error) {
    console.error("❌ PDF generation error:", error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║  🚀 Backend Server Running           ║
║  📍 http://localhost:${PORT}            ║
║                                       ║
║  Endpoints:                           ║
║  📝 POST /analyze                     ║
║  📄 POST /generate-pdf                ║
╚═══════════════════════════════════════╝
  `);
});