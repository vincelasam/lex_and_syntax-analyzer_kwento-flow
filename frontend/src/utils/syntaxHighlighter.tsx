import React from "react";
import { KEYWORDS } from "../../../backend/src/types/Tokens"; // Adjust path as needed

// --- COLOR MAPPING ---
const TOKEN_COLORS: Record<string, string> = {
  KEYWORD: "text-purple-700 font-bold",
  TYPE: "text-blue-600 font-bold",
  LITERAL_STRING: "text-green-600",
  LITERAL_NUMBER: "text-orange-600",
  COMMENT: "text-gray-400 italic",
  NOISE: "text-slate-500",
  DEFAULT: "text-gray-800",
};

// --- HIGHLIGHT FUNCTION ---
export const highlightCode = (code: string) => {
  if (!code) return [];

  // Regex patterns: Strings -> Comments -> Multi-Comments -> Numbers/Words -> Symbols
  const tokenRegex = /("[^"]*"|~~[^\n]*|~[^~]*~|\b\d+\b|\b\w+\b|[{}[\],:;])/gm;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(code)) !== null) {
    const [text] = match;
    const index = match.index;

    // Push plain text between tokens
    if (index > lastIndex) {
      elements.push(code.slice(lastIndex, index));
    }

    let className = TOKEN_COLORS.DEFAULT;

    // Determine Color
    if (text.startsWith('"')) {
      className = TOKEN_COLORS.LITERAL_STRING;
    } else if (text.startsWith("~")) {
      className = TOKEN_COLORS.COMMENT;
    } else if (/^\d+$/.test(text)) {
      className = TOKEN_COLORS.LITERAL_NUMBER;
    } else if (KEYWORDS[text]) {
      const tokenType = KEYWORDS[text]; // Using the imported enum/object if needed for strict checking

      if (["text", "boolean", "number", "db"].includes(text)) {
        className = TOKEN_COLORS.TYPE;
      } else if (["to", "is", "then"].includes(text)) {
        className = TOKEN_COLORS.NOISE;
      } else {
        className = TOKEN_COLORS.KEYWORD;
      }
    }

    elements.push(
      <span key={index} className={className}>
        {text}
      </span>,
    );

    lastIndex = index + text.length;
  }

  // Push remaining text
  if (lastIndex < code.length) {
    elements.push(code.slice(lastIndex));
  }

  return elements;
};
