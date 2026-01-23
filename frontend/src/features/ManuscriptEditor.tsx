import React, { useRef, useLayoutEffect, useMemo } from "react";
import { Panel } from "../components/ui/Panel";
// IMPORT THE HIGHLIGHTER UTILITY
import { highlightCode } from "../utils/syntaxHighlighter";

interface ManuscriptEditorProps {
  code: string;
  setCode: (code: string) => void;
}

const CONFIG = {
  lineHeight: 24,
  padding: 16,
  fontSize: 14,
};

export const ManuscriptEditor: React.FC<ManuscriptEditorProps> = ({
  code,
  setCode,
}) => {
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null); // NEW: Ref for highlighter
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lineCount = code.split("\n").length;

  // --- SYNTAX HIGHLIGHTER ---
  // Memoize the highlighted nodes so they don't re-render unnecessarily
  const highlightedContent = useMemo(() => highlightCode(code), [code]);

  // --- SCROLL SYNC ---
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;

    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
    }

    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
  };

  // --- KEY HANDLING (Tab & Comments) ---
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // 1. HANDLE TAB
    if (e.key === "Tab") {
      e.preventDefault();
      const spaces = "  "; // 2 spaces
      const newCode = code.substring(0, start) + spaces + code.substring(end);
      setCode(newCode);

      // Restore cursor
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.value = newCode;
          textareaRef.current.selectionStart =
            textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }

    // 2. HANDLE "~" (Comment Toggle)
    if (e.key === "~" && start !== end) {
      e.preventDefault();
      const selectedText = code.substring(start, end);

      // Check surrounding characters to see if we should UN-comment
      const charBefore = code[start - 1];
      const charAfter = code[end];

      if (charBefore === "~" && charAfter === "~") {
        // === UN-COMMENT ===
        const before = code.substring(0, start - 1);
        const after = code.substring(end + 1);
        const newCode = before + selectedText + after;
        setCode(newCode);

        // Restore Selection (Shifted Left)
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.value = newCode;
            textareaRef.current.selectionStart = start - 1;
            textareaRef.current.selectionEnd = end - 1;
          }
        }, 0);
      } else {
        // === COMMENT ===
        const before = code.substring(0, start);
        const after = code.substring(end);
        const newCode = before + "~" + selectedText + "~" + after;
        setCode(newCode);

        // Restore Selection (Shifted Right)
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

    const validExtensions = [".txt", ".kf"];
    const fileExtension = file.name
      .slice(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      alert("Invalid file type. Please upload a .txt or .kf file.");
      return;
    }

    try {
      const content = await file.text();
      setCode(content);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      alert("Failed to read file");
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
            className="w-full flex justify-center items-center gap-2 px-3 py-1 text-sm font-bold border border-(--kwento-gold) rounded hover:bg-parchment transition-all active:scale-95 active:bg-stone-300"
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
      <div className="flex h-full bg-(--kwento-bg) overflow-hidden rounded-md relative">
        {/* 1. LINE NUMBERS (Left Sidebar) */}
        <div
          ref={lineNumbersRef}
          className="flex flex-col items-end text-gray-400 bg-(--kwento-side) select-none border-r border-gray-100 overflow-hidden min-w-12"
          style={{
            paddingTop: `${CONFIG.padding}px`,
            paddingBottom: `${CONFIG.padding}px`,
            fontFamily: "monospace",
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

        {/* 2. EDITOR WRAPPER (Right Side) */}
        {/* We moved the background color here so it sits behind the layers */}
        <div className="relative grow h-full overflow-hidden bg-(--kwento-paper)">
          {/* LAYER 1: HIGHLIGHTER (Behind) */}
          <pre
            ref={highlightRef}
            aria-hidden="true"
            className="absolute inset-0 m-0 pointer-events-none whitespace-pre overflow-hidden w-full text-left"
            style={{
              padding: `${CONFIG.padding}px`,
              fontFamily: "monospace",
              fontSize: `${CONFIG.fontSize}px`,
              lineHeight: `${CONFIG.lineHeight}px`,
            }}
          >
            {highlightedContent}
            <br />
          </pre>

          {/* LAYER 2: TEXTAREA (Front) */}
          {/* IMPORTANT: text-transparent allows Layer 1 to show through, but caret-black keeps cursor visible */}
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
              padding: `${CONFIG.padding}px`,
              fontFamily: "monospace",
              fontSize: `${CONFIG.fontSize}px`,
              lineHeight: `${CONFIG.lineHeight}px`,
            }}
          />
        </div>
      </div>
    </Panel>
  );
};
