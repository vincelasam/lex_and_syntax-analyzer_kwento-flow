// tokens.ts

export interface Token {
  type: TokenType;
  lexeme: string;
  line: number;
  column: number;
}

export enum TokenType {
  // ===== Basic =====
  Identifier,        // identifier (e.g., sceneName, character_1)
  NumberLiteral,     // 123, 45
  TextLiteral,       // "Hello world"
  BooleanLiteral,    // true | false

  // ===== Keywords =====
  K_Scene,             // scene
  K_Start,             // start
  K_Story,             // story
  K_Character,         // character
  K_Transition,        // transition
  K_Thru,              // thru
  K_When,              // when
  K_Do,                // do
  K_End,               // end
  K_Input,             // input
  K_Rem,               // rem
  K_Perceives,         // perceives
  K_Masking,           // masking
  K_Says,              // says
  K_Log,               // log
  K_Choose,            // choose
  K_Default,           // default
  K_DB,                // db
  K_Where,             // where

  // ===== Reserved Words =====
  R_Text,              // text
  R_Boolean,           // boolean
  R_Number,            // number

  // ===== Noise Words =====
  N_To,                // to
  N_Is,                // is
  N_Then,              // then
  N_Noiseword,         // general noisewords

  // ===== Operators =====
  OP_Plus,              // +
  OP_Minus,             // -
  OP_Asterisk,          // *
  OP_Slash,             // /
  OP_Modulo,            // %
  OP_Caret,             // ^
  OP_Assign,            // =
  OP_EqualTo,           // ==
  OP_NotEqual,          // !=
  OP_Less_Than,         // <
  OP_Less_Equal,        // <=
  OP_Greater_Than,      // >
  OP_Greater_Equal,     // >=
  OP_Logical_And,       // &&
  OP_Logical_Or,        // ||
  OP_Logical_Not,       // !

  // ===== Delimiters =====
  D_LParen,            // (
  D_RParen,            // )
  D_LBrace,            // {
  D_RBrace,            // }
  D_LBracket,          // [
  D_RBracket,          // ]
  D_Colon,             // :
  D_Semicolon,         // ;
  D_Comma,             // ,
  D_Dot,               // .
  D_DoubleQuote,       // "

  // ===== Comments =====
  SingleLineComment, // ~~ comment until newline
  MultiLineComment,  // ~ comment block ~

  // ===== Whitespace =====
  NewLine,           // \n
  Whitespace,        

  // ===== End of File =====
  EOF,                // end of input
  Error
}

export const KEYWORDS: Record<string, TokenType> = {
  "scene": TokenType.K_Scene,
  "story": TokenType.K_Story,
  "start": TokenType.K_Start,
  "character": TokenType.K_Character,
  "transition": TokenType.K_Transition,
  "thru": TokenType.K_Thru,
  "when": TokenType.K_When,
  "do": TokenType.K_Do,
  "end": TokenType.K_End,
  "input": TokenType.K_Input,
  "says": TokenType.K_Says,
  "log": TokenType.K_Log,
  "db": TokenType.K_DB,
  "rem": TokenType.K_Rem,
  "where": TokenType.K_Where,
  "perceives": TokenType.K_Perceives,
  "masking": TokenType.K_Masking,
  "choose": TokenType.K_Choose,
  "default": TokenType.K_Default,
  "text": TokenType.R_Text,
  "boolean": TokenType.R_Boolean,
  "number": TokenType.R_Number,
  "to": TokenType.N_To,
  "is": TokenType.N_Is,
  "then": TokenType.N_Then,
};
