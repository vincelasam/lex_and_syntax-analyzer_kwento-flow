import { useState } from "react";
import { ManuscriptEditor } from "../features/lexical/ManuscriptEditor";
import { TokenTable } from "../features/lexical/TokenTable";
import type { Token } from "../features/lexical/TokenTable";

const AnalyzerPage = () => {
  const [code, setCode] = useState("");
  const [tokens, setTokens] = useState<Token[]>([]);

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
    // CHANGE 1: Use h-[85vh] (or h-[calc(100vh-100px)]) to force a fixed height.
    // This stops the page from growing infinitely.
    <div className="flex flex-col lg:flex-row gap-6 w-full p-4 min-h-[70vh] lg:h-[70vh]">
      {/* LEFT: Editor */}
      {/* CHANGE 2: Add min-h-0 to allow the inner scroll to work */}
      <section className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="grow min-h-0">
          <ManuscriptEditor code={code} setCode={setCode} />
        </div>

        <button
          className="btn-primary w-full shadow-lg shrink-0" // shrink-0 ensures button size stays fixed
          onClick={handleAnalyze}
        >
          Analyze Narrative Structure
        </button>
      </section>

      {/* RIGHT: Token Table */}
      {/* CHANGE 3: min-h-0 here too. Removed overflow-auto from this wrapper 
          because TokenTable handles its own scrolling. */}
      <section className="flex-1 min-w-0 min-h-0">
        <TokenTable tokens={tokens} code={code} />
      </section>
    </div>
  );
};

export default AnalyzerPage;
