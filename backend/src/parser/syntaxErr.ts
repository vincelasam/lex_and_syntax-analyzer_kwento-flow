// error interface
export interface SyntaxError {
  message: string;
  line: number;
  column: number;
  token: string;
  type?: ErrorType;  // Optional: categorize errors
}

// Error categories 
export enum ErrorType {
  UNEXPECTED_TOKEN = 'UNEXPECTED_TOKEN',
  MISSING_TOKEN = 'MISSING_TOKEN',
  INVALID_STATEMENT = 'INVALID_STATEMENT',
  INVALID_EXPRESSION = 'INVALID_EXPRESSION',
}

// Helper class to create consistent error messages 
export class SyntaxErrorBuilder {
  static unexpectedToken(token: string, line: number, column: number): SyntaxError {
    return {
      message: `Unexpected token '${token}'`,
      line,
      column,
      token,
      type: ErrorType.UNEXPECTED_TOKEN
    };
  }

  static expectedToken(expected: string, found: string, line: number, column: number): SyntaxError {
    return {
      message: `Expected '${expected}' but found '${found}'`,
      line,
      column,
      token: found,
      type: ErrorType.MISSING_TOKEN
    };
  }

  static missingClosingBrace(line: number, column: number): SyntaxError {
    return {
      message: 'Missing closing brace "}"',
      line,
      column,
      token: '}',
      type: ErrorType.MISSING_TOKEN
    };
  }

  static missingSemicolon(line: number, column: number, token: string): SyntaxError {
    return {
      message: 'Expected ";" after statement',
      line,
      column,
      token,
      type: ErrorType.MISSING_TOKEN
    };
  }

  static invalidStatement(token: string, line: number, column: number): SyntaxError {
    return {
      message: `Invalid statement starting with '${token}'`,
      line,
      column,
      token,
      type: ErrorType.INVALID_STATEMENT
    };
  }

  static invalidExpression(token: string, line: number, column: number): SyntaxError {
    return {
      message: `Invalid expression at '${token}'`,
      line,
      column,
      token,
      type: ErrorType.INVALID_EXPRESSION
    };
  }
}