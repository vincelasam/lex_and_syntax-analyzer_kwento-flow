import { useEffect, useState } from "react";
import { ManuscriptEditor } from "../features/ManuscriptEditor";
import { TokenTable } from "../features/TokenTable";
import type { Token } from "../features/TokenTable";
import { SyntaxView, type SyntaxError } from "../features/SyntaxView";
import { Loader2 } from "lucide-react";

const AnalyzerPage = () => {
  const [code, setCode] = useState("");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [syntaxErrors, setSyntaxErrors] = useState<SyntaxError[]>([]);

  const [activeTab, setActiveTab] = useState<"lexical" | "syntax">("lexical");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasRunAnalysis, setHasRunAnalysis] = useState(false);

  // --- AUTO-RESET: When user clears text manually ---
  useEffect(() => {
    if (!code || code.trim() === "") {
      setHasRunAnalysis(false);
      setTokens([]);
      setSyntaxErrors([]);
    }
  }, [code]);

  const handleAnalyze = async () => {
    // 1. EMPTY CHECK: If code is empty when clicking analyze, force Idle state
    if (!code || code.trim() === "") {
      setHasRunAnalysis(false);
      setTokens([]);
      setSyntaxErrors([]);
      return; // Stop here, do not fetch
    }

    setIsAnalyzing(true);
    setHasRunAnalysis(false); // Temporarily hide results while loading

    try {
      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      setTokens(data.tokens || []);
      setSyntaxErrors(data.errors || []); // Changed 'syntaxErrors' to 'errors' to match standard backend keys usually

      // Smart Tab Switch: If errors exist, switch to Syntax tab
      if (data.errors && data.errors.length > 0) {
        setActiveTab("syntax");
      }

      setHasRunAnalysis(true); // Analysis done -> Show results
    } catch (error) {
      console.error("Analysis error:", error);
      setSyntaxErrors([
        { line: 0, message: "Backend connection error", type: "SYSTEM" },
      ]);
      setHasRunAnalysis(true); // Show the error in the UI
      setActiveTab("syntax");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    // OUTER CONTAINER: Handles the full height of the page
    <div className="flex flex-col w-full p-4 h-[85vh]">
      {/* --- TABS --- */}
      <div className="flex gap-2 px-1">
        <button
          onClick={() => setActiveTab("lexical")}
          className={`px-4 py-2 font-bold rounded-t-lg transition-colors border-t-2 border-l-2 border-r-2 ${
            activeTab === "lexical"
              ? "bg-[#e4c060] text-white border-[#e4c060] shadow-sm translate-y-[2px]"
              : "bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200"
          }`}
        >
          Lexical Analyzer
        </button>
        <button
          onClick={() => setActiveTab("syntax")}
          className={`px-4 py-2 font-bold rounded-t-lg transition-colors border-t-2 border-l-2 border-r-2 flex items-center gap-2 ${
            activeTab === "syntax"
              ? "bg-[#e4c060] text-white border-[#e4c060] shadow-sm translate-y-[2px]"
              : "bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200"
          }`}
        >
          Syntax Analyzer
          {/* Optional: Error Indicator Dot */}
          {activeTab !== "syntax" && syntaxErrors.length > 0 && (
            <span className="flex h-2 w-2 rounded-full bg-[#c53030]"></span>
          )}
        </button>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex flex-col lg:flex-row gap-6 w-full grow min-h-0">
        {/* LEFT: Editor & Action Button */}
        <section className="flex-1 flex flex-col gap-4 min-h-0">
          <div className="grow min-h-0">
            <ManuscriptEditor code={code} setCode={setCode} />
          </div>

          <button
            className={`btn-primary w-full shadow-lg shrink-0 py-4 bg-[#5a3e36] text-white rounded-lg font-bold text-xl tracking-wider hover:bg-[#4a322b] transition-all flex justify-center items-center gap-2
              ${isAnalyzing ? "opacity-80 cursor-not-allowed" : ""}`}
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin" /> Analyzing...
              </>
            ) : (
              "Analyze Narrative Structure"
            )}
          </button>
        </section>

        {/* RIGHT: Output (Dynamic) */}
        <section className="flex-1 min-w-0 min-h-0 flex flex-col">
          <div className="grow min-h-0 overflow-auto bg-white rounded-md">
            {activeTab === "lexical" ? (
              // CASE A: Lexical Table (Requires its own scroll container if table is long)
              <div className="h-full flex flex-col">
                <TokenTable tokens={tokens} code={code} />
              </div>
            ) : (
              // CASE B: Syntax View (Handles Idle/Error/Success states via hasAnalyzed)
              <SyntaxView errors={syntaxErrors} hasAnalyzed={hasRunAnalysis} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AnalyzerPage;
