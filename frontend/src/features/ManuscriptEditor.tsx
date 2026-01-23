import React, { useRef, useLayoutEffect, useMemo } from "react";
import { Panel } from "../components/ui/Panel";
import { highlightCode } from "../utils/syntaxHighlighter";

interface ManuscriptEditorProps {
  code: string;
  setCode: (code: string) => void;
}

const CONFIG = {
  lineHeight: 24,
  padding: 16,
  fontSize: 14,
  bottomBuffer: 40,
};

const FONT_FAMILY = "Menlo, Monaco, Consolas, 'Courier New', monospace";

// TYPE FOR HISTORY
interface HistoryState {
  text: string;
  cursor: number;
}

export const ManuscriptEditor: React.FC<ManuscriptEditorProps> = ({
  code,
  setCode,
}) => {
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- HISTORY STATE ---
  // We use refs so updating history doesn't trigger re-renders
  const historyRef = useRef<HistoryState[]>([{ text: code, cursor: 0 }]);
  const historyIndex = useRef(0);

  const lineCount = code.split("\n").length;
  const highlightedContent = useMemo(() => highlightCode(code), [code]);

  // --- HISTORY HELPERS ---
  const saveHistory = (text: string, cursor: number) => {
    // If we are in the middle of the stack (after undoing), remove the "future"
    if (historyIndex.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(
        0,
        historyIndex.current + 1,
      );
    }

    // Push new state
    historyRef.current.push({ text, cursor });
    historyIndex.current = historyRef.current.length - 1;

    // Optional: Limit history size to prevent memory leaks (e.g., last 100 steps)
    if (historyRef.current.length > 100) {
      historyRef.current.shift();
      historyIndex.current--;
    }
  };

  const undo = () => {
    if (historyIndex.current > 0) {
      historyIndex.current--; // Move pointer back
      const previousState = historyRef.current[historyIndex.current];

      setCode(previousState.text);

      // Restore cursor position after React render
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.value = previousState.text;
          textareaRef.current.selectionStart = previousState.cursor;
          textareaRef.current.selectionEnd = previousState.cursor;
        }
      }, 0);
    }
  };

  // --- SCROLL SYNC ---
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = scrollTop;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
  };

  useLayoutEffect(() => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, [code]);

  // --- KEY HANDLING ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // 0. HANDLE UNDO (Ctrl+Z or Cmd+Z)
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault();
      undo();
      return;
    }

    // HELPER: Save snapshot before making a complex change
    const snapshot = () => saveHistory(code, start);

    // 1. SNAPSHOT ON TYPING BREAKS (Space / Enter)
    // This creates "natural" undo points while typing normally
    if (e.key === " " || e.key === "Enter") {
      snapshot();
    }

    // 2. HANDLE TAB
    if (e.key === "Tab") {
      e.preventDefault();
      snapshot(); // Save state before tab

      const spaces = "  ";
      const newCode = code.substring(0, start) + spaces + code.substring(end);
      setCode(newCode);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.value = newCode;
          textareaRef.current.selectionStart =
            textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }

    // 3. HANDLE PARENTHESES "()"
    if (e.key === "(" && start !== end) {
      e.preventDefault();
      snapshot(); // Save state before wrap

      const selectedText = code.substring(start, end);
      const before = code.substring(0, start);
      const after = code.substring(end);
      const newCode = before + "(" + selectedText + ")" + after;

      setCode(newCode);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.value = newCode;
          textareaRef.current.selectionStart = start + 1;
          textareaRef.current.selectionEnd = end + 1;
        }
      }, 0);
    }

    // 4. HANDLE COMMENT TOGGLE "~"
    if (e.key === "~" && start !== end) {
      e.preventDefault();
      snapshot(); // Save state before toggle

      const selectedText = code.substring(start, end);
      const charBefore = code[start - 1];
      const charAfter = code[end];

      if (charBefore === "~" && charAfter === "~") {
        // Un-comment
        const before = code.substring(0, start - 1);
        const after = code.substring(end + 1);
        const newCode = before + selectedText + after;
        setCode(newCode);

        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.value = newCode;
            textareaRef.current.selectionStart = start - 1;
            textareaRef.current.selectionEnd = end - 1;
          }
        }, 0);
      } else {
        // Comment
        const before = code.substring(0, start);
        const after = code.substring(end);
        const newCode = before + "~" + selectedText + "~" + after;
        setCode(newCode);

        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.value = newCode;
            textareaRef.current.selectionStart = start + 1;
            textareaRef.current.selectionEnd = end + 1;
          }
        }, 0);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      saveHistory(content, 0); // Save the loaded file as a history point
      setCode(content);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Panel
      title="Manuscript Source (Code)"
      action={
        <div className="flex flex-col items-center gap-0.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.kf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex justify-center items-center gap-2 px-3 py-1 text-sm font-bold border border-[#e4c060] rounded hover:bg-[#fff9e6] transition-all active:scale-95 active:bg-[#e6e2d3]"
          >
            <span className="bg-black text-white px-1 text-xs">↑</span>
            Upload
          </button>
          <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider text-center w-full">
            Supports .txt & .kf
          </span>
        </div>
      }
    >
      <div className="flex h-full bg-[#fffcf5] overflow-hidden rounded-md relative">
        {/* 1. LINE NUMBERS */}
        <div
          ref={lineNumbersRef}
          className="flex flex-col items-end text-gray-400 bg-[#f7f5ee] select-none border-r border-gray-200 overflow-hidden min-w-[3rem]"
          style={{
            paddingTop: `${CONFIG.padding}px`,
            paddingBottom: `${CONFIG.bottomBuffer}px`,
            fontFamily: FONT_FAMILY,
            fontSize: `${CONFIG.fontSize}px`,
            lineHeight: `${CONFIG.lineHeight}px`,
          }}
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div
              key={i}
              className="w-full text-center hover:text-gray-600 transition-colors"
              style={{ height: `${CONFIG.lineHeight}px` }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* 2. EDITOR AREA */}
        <div className="relative grow h-full overflow-hidden bg-[#fffcf5]">
          {/* LAYER 1: HIGHLIGHTER */}
          <pre
            ref={highlightRef}
            aria-hidden="true"
            className="absolute inset-0 m-0 pointer-events-none whitespace-pre overflow-hidden w-full text-left"
            style={{
              paddingTop: `${CONFIG.padding}px`,
              paddingLeft: `${CONFIG.padding}px`,
              paddingRight: `${CONFIG.padding}px`,
              paddingBottom: `${CONFIG.bottomBuffer}px`,
              fontFamily: FONT_FAMILY,
              fontSize: `${CONFIG.fontSize}px`,
              lineHeight: `${CONFIG.lineHeight}px`,
            }}
          >
            {highlightedContent}
            <br />
          </pre>

          {/* LAYER 2: TEXTAREA */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            className="absolute inset-0 w-full h-full resize-none outline-none text-transparent bg-transparent caret-black whitespace-pre overflow-auto z-10"
            placeholder="Start typing your KwentoFlow code..."
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            style={{
              paddingTop: `${CONFIG.padding}px`,
              paddingLeft: `${CONFIG.padding}px`,
              paddingRight: `${CONFIG.padding}px`,
              paddingBottom: `${CONFIG.bottomBuffer}px`,
              fontFamily: FONT_FAMILY,
              fontSize: `${CONFIG.fontSize}px`,
              lineHeight: `${CONFIG.lineHeight}px`,
            }}
          />
        </div>
      </div>
    </Panel>
  );
};
