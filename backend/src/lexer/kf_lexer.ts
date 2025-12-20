import { CharStream } from "../utils/charStream";
import { Token, TokenType, KEYWORDS } from "../types/Tokens";
import {
  isLetter, 
  isDigit,
  isAlphaNumeric, 
  isWhitespace,
  readWhile,
  isOperatorChar,
  readIdentifier,
  isDelimiterChar,
  readNumber,
  readString } from "../utils/helpers";
import { makeToken, keywordOrIdentifier } from "../utils/utils";


export class Lexer {

    constructor (private stream : CharStream) {}

    private tokens: Token[] = [];
    
    tokenize() : Token[]{
      
        while (!this.stream.isEOF()){
        const ch = this.stream.peek();

        if(isWhitespace(ch)) {
            this.stream.advance();
            continue;
        }

        if(isLetter(ch)) {
            this.readWord();
            continue;
        }

        if(isDigit(ch)){
            this.scanNumber();
            continue;
        }

        if(ch == "\"" ){
            this.scanString();
            continue;
        }

        if(ch == "~"){
            this.scanComment();
            continue;
        }

        if (isOperatorChar(ch)) {
            this.scanOperator();
            continue;
        }

        if(isDelimiterChar(ch)){
            this.scanDelimiter();
            continue;
        }

    

        this.addErrorToken(this.stream.peek());
        this.stream.advance();
    }

    this.addEOFToken();
    return this.tokens;
}

    private readWord() : void {
        const startLine = this.stream.getLine();
        const startColumn = this.stream.getColumn();

            let word = "";

        while (!this.stream.isEOF() && isAlphaNumeric(this.stream.peek())){
            word += this.stream.advance();
        }

        const type = keywordOrIdentifier(word, KEYWORDS);
        const token = makeToken(type, word, startLine, startColumn);
        this.tokens.push(token);
    }

    private scanNumber() : void {
        const startLine = this.stream.getLine();
        const startColumn = this.stream.getColumn();

        let value = readNumber(this.stream);

        if (this.stream.peek() === '.' && isDigit(this.stream.peekNext())) {
          value += this.stream.advance();
          value += readNumber(this.stream);
        }

          const token = makeToken(TokenType.NumberLiteral, value, startLine, startColumn);
          this.tokens.push(token);
        }

    private addEOFToken() : void {
        const token = makeToken(
            TokenType.EOF,
            "",
            this.stream.getLine(),
            this.stream.getColumn()
        );

        this.tokens.push(token);
    }

    private addErrorToken(ch: string) : void {
        const token = makeToken(
            TokenType.Error,
            ch,
            this.stream.getLine(),
            this.stream.getColumn()
        );

        this.tokens.push(token);
    }

    private scanString() : void {
        const startLine = this.stream.getLine();
        const startColumn = this.stream.getColumn();

        this.stream.advance()

        try {
            const value = readString(this.stream);
        
            const token = makeToken(TokenType.TextLiteral, value, startLine, startColumn);
            this.tokens.push(token);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "String Error";
            const token = makeToken(TokenType.Error, errorMessage, startLine,startColumn);
            this.tokens.push(token);
        }
    }

    private scanComment(): void {
        const startLine = this.stream.getLine();
        const startColumn = this.stream.getColumn();

        this.stream.advance();

        if(this.stream.peek() == "~"){
            this.stream.advance();
            let value = "~~"

            while (!this.stream.isEOF() && this.stream.peek() !== '\n') {
                value += this.stream.advance();
            }

            const token = makeToken(TokenType.SingleLineComment, value, startLine, startColumn)
            this.tokens.push(token);
        } else {
            let value = "~";
            let depth = 1;

            while (!this.stream.isEOF()) {
            const ch = this.stream.peek();

            if (ch == "~") {
                value += this.stream.advance();
                depth--;

                if (depth == 0) {
                    const token = makeToken(
                        TokenType.MultiLineComment,
                        value,
                        startLine,
                        startColumn
                    );
                    this.tokens.push(token);
                    return;
                }
            } else {
                value += this.stream.advance();

                if (this.stream.peek() == "~") {
                    depth++;
                }
            }
        }

            const token = makeToken(TokenType.Error,"Unterminated multi line comment",startLine,startColumn);
            this.tokens.push(token);
    }
}

    private scanOperator(): void {
        const startLine = this.stream.getLine();
        const startColumn = this.stream.getColumn();
    
        const ch = this.stream.advance(); // Get first character
        let type: TokenType;
        let lexeme = ch;
    

    switch (ch) {
        case '=' :
            if (this.stream.match('=')) {
                type = TokenType.OP_EqualTo;
                lexeme = '==';
            } else {
                type = TokenType.OP_Assign;
            }
            break;
            
        case '!':
            if (this.stream.match('=')) {
                type = TokenType.OP_NotEqual;
                lexeme = '!=';
            } else {
                type = TokenType.OP_Logical_Not;
            }
            break;
            
        case '<':
            if (this.stream.match('=')) {
                type = TokenType.OP_Less_Equal;
                lexeme = '<=';
            } else {
                type = TokenType.OP_Less_Than;
            }
            break;
            
        case '>':
            if (this.stream.match('=')) {
                type = TokenType.OP_Greater_Equal;
                lexeme = '>=';
            } else {
                type = TokenType.OP_Greater_Than;
            }
            break;
            
        case '&':
            if (this.stream.match('&')) {
                type = TokenType.OP_Logical_And;
                lexeme = '&&';
            } else {
                type = TokenType.Error;
                lexeme = ch;
            }
            break;
            
        case '|':
            if (this.stream.match('|')) {
                type = TokenType.OP_Logical_Or;
                lexeme = '||';
            } else {
                type = TokenType.Error;
                lexeme = ch;
            }
            break;
            
        // Single-character operators
        case '+':
            type = TokenType.OP_Plus;
            break;
        case '-':
            type = TokenType.OP_Minus;
            break;
        case '*':
            type = TokenType.OP_Asterisk;
            break;
        case '/':
            type = TokenType.OP_Slash;
            break;
        case '%':
            type = TokenType.OP_Modulo;
            break;
        case '^':
            type = TokenType.OP_Caret;
            break;
            
        default:
            type = TokenType.Error;
            break;
    }
    
    const token = makeToken(type, lexeme, startLine, startColumn);
    this.tokens.push(token)
    }

    private scanDelimiter(): void {
        const startLine = this.stream.getLine();
        const startColumn = this.stream.getColumn();
    
        const ch = this.stream.advance();
        let type: TokenType;
    
        switch (ch) {
            case '(':
                 type = TokenType.D_LParen;
                break;
            case ')':
                type = TokenType.D_RParen;
                 break;
            case '{':
                type = TokenType.D_LBrace;
                break;
            case '}':
                type = TokenType.D_RBrace;
                break;
             case '[':
                 type = TokenType.D_LBracket;
                break;
             case ']':
                type = TokenType.D_RBracket;
                break;
            case ':':
                 type = TokenType.D_Colon;
                break;
             case ';':
                 type = TokenType.D_Semicolon;
                 break;
             case ',':
                type = TokenType.D_Comma;
                break;
            case '.':
                 type = TokenType.D_Dot;
                    break;
             default:
                 type = TokenType.Error;
                break;
    }
    
    const token = makeToken(type, ch, startLine, startColumn);
    this.tokens.push(token);
    }


}
