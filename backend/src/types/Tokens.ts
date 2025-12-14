// tokenTypes.ts
export enum TokenType {
  // Basic
  Identifier,
  NumberLiteral,
  TextLiteral,
  BooleanLiteral,

  // Keywords
  Scene,
  Start,
  Story,
  Character,
  Transition,
  Thru,
  When,
  Do,
  End,
  Input,
  Rem,
  Perceives,
  Masking,
  Says,
  Log,
  Choose,
  Default,

  // Reserved Datatypes
  Text,
  Boolean,
  Number,

  // Noise Words
  To,
  Is,
  Then,

  // Operators
  Plus, Minus, Star, Slash, Percent, Caret,
  EqualEqual, NotEqual,
  Less, LessEqual,
  Greater, GreaterEqual,
  AndAnd, OrOr,
  Not,

  // Delimiters
  LParen, RParen,
  LBrace, RBrace,
  LBracket, RBracket,
  Colon, Semicolon,
  Comma, Dot,
  DoubleQuote, SingleQuote,
  
  // Comments
  SingleLineComment, // ~~
  MultiLineComment, // ~...~
  

  // Whitespace
  NewLine,
  EOF
}

export interface Token {
  type: TokenType;
  lexeme: string;
  line: number;
  column: number;
}


export const KEYWORDS: Record<string, TokenType> = {
  "scene": TokenType.Scene,
  "story": TokenType.Story,
  "start": TokenType.Start,
  "character": TokenType.Character,

  "transition": TokenType.Transition,
  "thru": TokenType.Thru,
  "when": TokenType.When,
  "do": TokenType.Do,
  "end": TokenType.End,

  //Input/Output
  "input": TokenType.Input,
  "says": TokenType.Says,
  "log": TokenType.Log,

  "rem": TokenType.Rem,

  "perceives": TokenType.Perceives,
  "masking": TokenType.Masking,

  
  "choose": TokenType.Choose,
  "default": TokenType.Default,

  "text": TokenType.Text,
  "boolean": TokenType.Boolean,
  "number": TokenType.Number,

  "to": TokenType.To,
  "is": TokenType.Is,
  "then": TokenType.Then,
};
