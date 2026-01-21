import { useState } from "react";
import { ManuscriptEditor } from "../features/ManuscriptEditor";
import { TokenTable } from "../features/TokenTable";
import type { Token } from "../features/TokenTable";
import { SyntaxView, type SyntaxError } from "../features/SyntaxView";

const AnalyzerPage = () => {
  const [code, setCode] = useState("");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [activeTab, setActiveTab] = useState<"lexical" | "syntax">("lexical");
  const [syntaxErrors, setSyntaxErrors] = useState<SyntaxError[]>([]);

  const handleAnalyze = async () => {
    try {
      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze code");
      }

      const data = await response.json();
      setTokens(data.tokens || []);
    } catch (error) {
      console.error("Analysis error:", error);
      setTokens([]);
    }
  };

  return (
    // OUTER CONTAINER: Handles the full height of the page
    <div className="flex flex-col w-full p-4 gap-2 h-[85vh]">
      {/* --- NEW SECTION: THE TABS --- */}
      <div className="flex gap-2 px-1">
        <button
          onClick={() => setActiveTab("lexical")}
          className={`px-4 py-2 font-bold rounded-t-lg transition-colors border-t-2 border-l-2 border-r-2 ${
            activeTab === "lexical"
              ? "bg-[#e4c060] text-white border-[#e4c060] shadow-sm" // Active Style
              : "bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200" // Inactive Style
          }`}
        >
          Lexical Analyzer
        </button>
        <button
          onClick={() => setActiveTab("syntax")}
          className={`px-4 py-2 font-bold rounded-t-lg transition-colors border-t-2 border-l-2 border-r-2 ${
            activeTab === "syntax"
              ? "bg-[#e4c060] text-white border-[#e4c060] shadow-sm"
              : "bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200"
          }`}
        >
          Syntax Analyzer
        </button>
      </div>

      {/* --- ORIGINAL CONTENT AREA --- */}
      {/* I changed the fixed height to 'grow' so it fills the rest of the 85vh minus the tabs */}
      <div className="flex flex-col lg:flex-row gap-6 w-full grow min-h-0">
        {/* LEFT: Editor (Stays Static - Shared Input) */}
        <section className="flex-1 flex flex-col gap-4 min-h-0">
          <div className="grow min-h-0">
            <ManuscriptEditor code={code} setCode={setCode} />
          </div>

          <button
            className="btn-primary w-full shadow-lg shrink-0"
            onClick={handleAnalyze}
          >
            Analyze Narrative Structure
          </button>
        </section>

        {/* RIGHT: Output (Dynamic - Swaps based on Tab) */}
        <section className="flex-1 min-w-0 min-h-0 flex flex-col">
          {/* THE SWITCH LOGIC */}
          <div className="grow min-h-0 overflow-auto bg-white rounded-md">
            {activeTab === "lexical" ? (
              // CASE 1: Lexical Analyzer
              <TokenTable tokens={tokens} code={code} />
            ) : (
              <SyntaxView errors={syntaxErrors} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AnalyzerPage;
