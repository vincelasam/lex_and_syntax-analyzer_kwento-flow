import React, { useRef, useLayoutEffect } from "react";
import { Panel } from "../../components/ui/Panel";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lineCount = code.split("\n").length;

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

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
      const spaces = "  ";
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
        // CHANGED: Flex-col to stack them vertically
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
            // Added 'w-full' and 'justify-center' to align with the text width
            className="w-full flex justify-center items-center gap-2 px-3 py-1 text-sm font-bold border border-(--kwento-gold) rounded hover:bg-parchment transition-all active:scale-95 active:bg-stone-300"
          >
            <span className="bg-black text-white px-1 text-xs">↑</span>
            Upload
          </button>

          {/* MOVED: Note is now under the button */}
          <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider text-center w-full">
            Supports .txt & .kf
          </span>
        </div>
      }
    >
      <div className="flex h-full bg-(--kwento-bg) overflow-hidden rounded-md relative">
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
