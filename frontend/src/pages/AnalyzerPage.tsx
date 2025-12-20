import { useState } from "react";
import { ManuscriptEditor } from "../features/lexical/ManuscriptEditor";
import { TokenTable } from "../features/lexical/TokenTable";
import type { Token } from "../features/lexical/TokenTable"; // Import from TokenTable

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
      setTokens(data.tokens || []); // Add fallback for empty array
    } catch (error) {
      console.error("Analysis error:", error);
      // Optionally show error to user
      setTokens([]);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[600px]">
      {/* LEFT: Editor */}
      <section className="flex-1 flex flex-col gap-4">
        <div className="grow">
          <ManuscriptEditor code={code} setCode={setCode} />
        </div>

        <button
          className="btn-primary w-full shadow-lg"
          onClick={handleAnalyze}
        >
          Analyze Narrative Structure
        </button>
      </section>

      {/* RIGHT: Token Table */}
      <section className="flex-1 h-full min-w-0 overflow-auto">
        <TokenTable tokens={tokens} code={code} />
      </section>
    </div>
  );
};

export default AnalyzerPage;
