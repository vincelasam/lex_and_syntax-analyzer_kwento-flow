import { Panel } from "../../components/ui/Panel";

export interface Token {
  id: number;
  line: number;
  lexeme: string;
  type: string;
  desc: string;
}

interface TokenTableProps {
  tokens: Token[];
  code: string;
}

export const TokenTable = ({ tokens, code }: TokenTableProps) => {
  const handleDownloadPDF = async () => {
    console.log(" Download PDF clicked");
    console.log("Code length:", code?.length);
    console.log("Tokens count:", tokens?.length);

    if (!code) {
      alert("No code to generate PDF from.");
      return;
    }

    try {
      console.log(" Sending request to backend...");

      const response = await fetch("http://localhost:5000/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code }),
      });

      console.log(" Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(" Response error:", errorText);
        throw new Error(`Failed to generate PDF: ${response.status}`);
      }

      const data = await response.json();
      console.log(" Received data:", data.success ? "Success" : "Failed");

      if (!data.pdf) {
        throw new Error("No PDF data received from server");
      }

      // Convert data URI to blob and download
      console.log(" Converting to blob...");
      const pdfData = data.pdf;

      // Handle both data URI and base64 string
      let base64;
      if (pdfData.startsWith("data:")) {
        base64 = pdfData.split(",")[1];
      } else {
        base64 = pdfData;
      }

      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      console.log(" Blob created, size:", blob.size);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "kwentoflow_tokens.pdf";
      document.body.appendChild(link);

      console.log(" Triggering download...");
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log(" Cleanup complete");
      }, 100);
    } catch (error) {
      console.error("❌ PDF download error:", error);
      alert(
        `Failed to generate PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <Panel
      title="Lexical Tokens (The Elements)"
      action={
        tokens.length > 0 ? (
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-(--kwento-brown) text-white rounded hover:brightness-110 transition-all active:scale-95 active:bg-stone-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download PDF
          </button>
        ) : null
      }
    >
      <div className="h-full w-full overflow-auto min-w-0">
        <table className="w-max min-w-full text-left text-sm font-sans border-collapse">
          <thead className="bg-gray-100 text-xs font-bold text-gray-600 uppercase tracking-wider sticky top-0">
            <tr>
              <th className="px-4 py-3 border-b border-gray-200">Line</th>
              <th className="px-4 py-3 border-b border-gray-200">Lexeme</th>
              <th className="px-4 py-3 border-b border-gray-200">Token Type</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {tokens.length === 0 ? (
              <tr>
                {/* Updated colSpan from 4 to 3 */}
                <td colSpan={3} className="px-4 py-6 text-center text-gray-400">
                  No tokens yet. Click "Analyze Narrative Structure".
                </td>
              </tr>
            ) : (
              tokens.map((token) => (
                <tr
                  key={token.id}
                  className="hover:bg-parchment/30 transition-colors"
                >
                  <td className="px-4 py-2 text-gray-500">{token.line}</td>
                  <td className="px-4 py-2 font-mono text-ink wrap-break-word max-w-[200px]">
                    
                    {(() => {
                      let displayValue = token.lexeme
                        .replace(/\n/g, '\\n')
                        .replace(/\t/g, '\\t')
                        .replace(/\r/g, '\\r');
                      
                      if (token.type === 'TextLiteral') {
                        displayValue = '"' + displayValue + '"';
                      }
                      
                      return displayValue;
                    })()}
                  </td>
                  <td className="px-4 py-2 text-xs font-bold text-gray-600 wrap-break-word">
                    {token.type}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
};