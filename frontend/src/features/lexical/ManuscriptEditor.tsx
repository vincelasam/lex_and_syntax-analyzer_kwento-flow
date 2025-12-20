import React, { useRef, useLayoutEffect } from "react";
import { Panel } from "../../components/ui/Panel";

interface ManuscriptEditorProps {
  code: string;
  setCode: (code: string) => void;
}

// 1. CONFIGURATION: Define these exactly so both sides match
const CONFIG = {
  lineHeight: 24, // px
  padding: 16, // px (matches p-4)
  fontSize: 14, // px (matches text-sm)
};

export const ManuscriptEditor: React.FC<ManuscriptEditorProps> = ({
  code,
  setCode,
}) => {
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate lines (ensure at least 1 line exists)
  const lineCount = code.split("\n").length;

  // 2. SCROLL SYNC: One-way sync from Textarea -> LineNumbers
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // 3. LAYOUT SYNC: Ensure they match immediately after any update
  useLayoutEffect(() => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, [code]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const spaces = "  "; // 2 spaces
      const newCode = code.substring(0, start) + spaces + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.kf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1 text-sm font-bold border border-(--kwento-gold) rounded hover:bg-parchment transition-all active:scale-95 active:bg-stone-300"
          >
            <span className="bg-black text-white px-1 text-xs">↑</span>
            Upload
          </button>
        </>
      }
    >
      <div className="flex h-full bg-(--kwento-bg) overflow-hidden rounded-md relative">
        {/* === LEFT: Line Numbers === */}
        <div
          ref={lineNumbersRef}
          className="flex flex-col items-end text-gray-400 bg-(--kwento-side) select-none border-r border-gray-100 overflow-hidden min-w-[3rem]"
          style={{
            // STRICT STYLE ENFORCEMENT
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
              style={{ height: `${CONFIG.lineHeight}px` }} // Force exact height per line
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* === RIGHT: Text Area === */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          className="grow resize-none outline-none text-ink bg-(--kwento-paper) whitespace-pre overflow-auto w-full"
          placeholder="Start typing your KwentoFlow code..."
          spellCheck={false}
          style={{
            // STRICT STYLE ENFORCEMENT MATCHING LEFT SIDE
            padding: `${CONFIG.padding}px`,
            fontFamily: "monospace",
            fontSize: `${CONFIG.fontSize}px`,
            lineHeight: `${CONFIG.lineHeight}px`,
          }}
        />
      </div>
    </Panel>
  );
};
