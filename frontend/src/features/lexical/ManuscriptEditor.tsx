import React, { useRef } from "react";
import { Panel } from "../../components/ui/Panel";

interface ManuscriptEditorProps {
  code: string;
  setCode: (code: string) => void;
}

export const ManuscriptEditor: React.FC<ManuscriptEditorProps> = ({
  code,
  setCode,
}) => {
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lineCount = code.split("\n").length;

  // Sync line numbers with textarea scroll
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // NEW: Handle Tab key to insert spaces
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault(); // Prevent focus change

      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // Configuration: How many spaces per tab? (Standard is 2 or 4)
      const tabSize = 2;
      const spaces = " ".repeat(tabSize);

      // Insert spaces at cursor position
      const newCode = code.substring(0, start) + spaces + code.substring(end);

      setCode(newCode);

      // Move cursor to after the inserted spaces
      // We need to use requestAnimationFrame or setTimeout to ensure React render completes first
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + tabSize;
      }, 0);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [".txt", ".kf"];
    const fileName = file.name.toLowerCase();
    const isValid = validTypes.some((type) => fileName.endsWith(type));

    if (!isValid) {
      alert("Please upload a .txt or .kf");
      return;
    }

    try {
      const content = await file.text();
      setCode(content);
      console.log(
        " Manuscript uploaded:",
        file.name,
        `(${content.length} characters)`
      );

      // Clear input so same file can be uploaded again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error reading file:", error);
      alert("Failed to read file. Please try again.");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
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
            aria-label="Upload manuscript file"
          />
          <button
            onClick={handleUploadClick}
            className="flex items-center gap-2 px-3 py-1 text-sm font-bold border border-(--kwento-gold) rounded hover:bg-parchment transition-all active:scale-95 active:bg-stone-300"
          >
            <span className="bg-black text-white px-1 text-xs">↑</span>
            Upload Manuscript
          </button>
        </>
      }
    >
      <div className="flex h-full font-mono text-sm bg-(--kwento-bg)">
        {/* Line Numbers */}
        <div
          ref={lineNumbersRef}
          className="w-10 flex flex-col items-center pt-4 text-gray-400 bg-(--kwento-side) select-none border-r border-gray-100 overflow-hidden"
          style={{ lineHeight: "1.5rem" }}
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* The Text Area */}
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown} // Attached the new handler here
          onScroll={handleScroll}
          className="grow resize-none p-4 outline-none text-ink bg-(--kwento-paper) whitespace-pre overflow-auto leading-6"
          placeholder="Start typing your KwentoFlow code..."
          spellCheck={false}
        />
      </div>
    </Panel>
  );
};
