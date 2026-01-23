import React, { useRef, useMemo } from "react";
import { Panel } from "../components/ui/Panel";
// IMPORT THE NEW UTILITY
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
  const highlightRef = useRef<HTMLPreElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lineCount = code.split("\n").length;

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = scrollTop;
    if (highlightRef.current) highlightRef.current.scrollTop = scrollTop;
    if (textareaRef.current && textareaRef.current !== e.currentTarget) {
      textareaRef.current.scrollTop = scrollTop;
    }
  };

  // USE THE IMPORTED FUNCTION HERE
  const highlightedContent = useMemo(() => highlightCode(code), [code]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // 1. HANDLE TAB
    if (e.key === "Tab") {
      e.preventDefault();
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

    // 2. HANDLE "~" (Toggle Comment)
    if (e.key === "~" && start !== end) {
      e.preventDefault();
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

    // ... (Your file handling logic remains exactly the same)
    // For brevity, assuming standard read logic here
    try {
      const content = await file.text();
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
      <div className="flex h-full bg-[#fffcf5] overflow-hidden rounded-md relative font-mono text-sm">
        {/* 1. LINE NUMBERS */}
        <div
          ref={lineNumbersRef}
          className="flex flex-col items-end text-gray-400 bg-[#f7f5ee] select-none border-r border-gray-200 overflow-hidden min-w-[3rem]"
          style={{
            paddingTop: `${CONFIG.padding}px`,
            paddingBottom: `${CONFIG.padding}px`,
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

        {/* 2. EDITOR CONTAINER */}
        <div className="relative grow h-full overflow-hidden">
          {/* LAYER 1: SYNTAX HIGHLIGHTER */}
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

          {/* LAYER 2: TEXTAREA */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            className="absolute inset-0 w-full h-full resize-none outline-none text-transparent bg-transparent caret-black whitespace-pre overflow-auto z-10"
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
