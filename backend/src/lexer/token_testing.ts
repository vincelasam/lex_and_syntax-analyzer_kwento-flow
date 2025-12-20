import { generatePDF } from "./pdf_generator";
import { Token, TokenType } from "../types/Tokens";

const mockTokens: Token[] = [
  { lexeme: "scene", type: TokenType.K_Scene, line: 1, column: 1 },
  { lexeme: "start", type: TokenType.K_Start, line: 2, column: 1 },
  { lexeme: "x", type: TokenType.Identifier, line: 3, column: 5 },
  { lexeme: "=", type: TokenType.OP_Assign, line: 3, column: 7 },
  { lexeme: "10", type: TokenType.NumberLiteral, line: 3, column: 9 },
  { lexeme: ";", type: TokenType.D_Semicolon, line: 3, column: 11 },
  { lexeme: "scene", type: TokenType.K_Scene, line: 1, column: 1 },
  { lexeme: "start", type: TokenType.K_Start, line: 2, column: 1 },
  { lexeme: "x", type: TokenType.Identifier, line: 3, column: 5 },
  { lexeme: "=", type: TokenType.OP_Assign, line: 3, column: 7 },
  { lexeme: "10", type: TokenType.NumberLiteral, line: 3, column: 9 },
  { lexeme: ";", type: TokenType.D_Semicolon, line: 3, column: 11 }
];

generatePDF(mockTokens); 