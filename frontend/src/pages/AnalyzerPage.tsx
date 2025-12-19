import { useState } from "react";
import { ManuscriptEditor } from "../features/lexical/ManuscriptEditor";
import { TokenTable } from "../features/lexical/TokenTable";

const AnalyzerPage = () => {
  const [code, setCode] = useState("");
  const [backendResponse, setBackendResponse] = useState<string>("");

  const handleAnalyze = async () => {
    try {
      const response = await fetch("http://localhost:5000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      console.log("Response from backend:", data);

      // Update state to show feedback
      setBackendResponse(
        `Message: ${data.message}\nReceived Code Length: ${data.length}\n\n${data.receivedCode}`
      );
    } catch (err) {
      console.error("Error sending code:", err);
      setBackendResponse("Error sending code to backend.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[600px]">
      {/* LEFT COLUMN: Editor + Analyze Button */}
      <section className="flex-1 flex flex-col gap-4">
        <div className="grow">
          <ManuscriptEditor code={code} setCode={setCode} />
        </div>

        <button className="btn-primary w-full shadow-lg" onClick={handleAnalyze}>
          Analyze Narrative Structure
        </button>
      </section>

      {/* RIGHT COLUMN: Table + Backend Feedback */}
      <section className="flex-1 h-full min-w-0 overflow-auto flex flex-col gap-4">
        {/* Feedback Box */}
        <div className="p-4 border rounded bg-gray-100 text-sm whitespace-pre-wrap h-40 overflow-auto">
          {backendResponse || "Backend response will appear here..."}
        </div>

        <TokenTable />
      </section>
    </div>
  );
};

export default AnalyzerPage;
