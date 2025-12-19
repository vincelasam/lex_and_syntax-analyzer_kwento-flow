import React, { useRef } from "react";
import { Panel } from "../../components/ui/Panel";

interface ManuscriptEditorProps {
  code: string;
  setCode: (code: string) => void;
}

export const ManuscriptEditor: React.FC<ManuscriptEditorProps> = ({ code, setCode }) => {
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const lineCount = code.split("\n").length;

  // Sync line numbers with textarea scroll
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <Panel
      title="Manuscript Source (Code)"
      action={
        <button className="flex items-center gap-2 px-3 py-1 text-sm font-bold border border-(--kwento-gold) rounded hover:bg-parchment transition-colors">
          <span className="bg-black text-white px-1 text-xs">↑</span>
          Upload Manuscript
        </button>
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
          onScroll={handleScroll}
          className="grow resize-none p-4 outline-none text-ink bg-(--kwento-paper) whitespace-pre overflow-auto leading-6"
          placeholder="Start typing your KwentoFlow code..."
          spellCheck={false}
        />
      </div>
    </Panel>
  );
};
