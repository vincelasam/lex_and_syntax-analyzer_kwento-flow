import { CheckCircle, Expand } from "lucide-react"; // Make sure you have lucide-react installed

// Define the shape of a single syntax error based on your image
export interface SyntaxError {
  line: number;
  message: string;
  type?: string; // Defaults to "SYNTAX ERROR"
}

interface SyntaxViewProps {
  errors: SyntaxError[];
}

export const SyntaxView = ({ errors }: SyntaxViewProps) => {
  const hasErrors = errors.length > 0;

  return (
    // Main Card Container - matches the style of the Lexical Analyzer card
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden border-2 border-[#e4c060] shadow-sm font-serif">
      {/* --- HEADER SECTION --- */}
      <div className="flex justify-between items-center px-4 py-3 border-b-2 border-[#e4c060] bg-white">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-[#2d3748] tracking-wide">
            Syntax Analyzer
          </h2>

          {/* CONDITIONAL BADGE: Shows Red Error count or Green Success message */}
          {hasErrors ? (
            <span className="px-3 py-1 bg-[#f0e6e6] text-[#c53030] text-sm font-bold rounded-md border border-[#e4c060]/30">
              {errors.length} Errors Found
            </span>
          ) : (
            <span className="px-3 py-1 bg-[#e6f0e6] text-[#2f855a] text-sm font-bold rounded-md border border-[#e4c060]/30">
              No Errors Detected
            </span>
          )}
        </div>
      </div>

      {/* --- CONTENT BODY --- */}
      {/* The background is slightly off-white (#f3f0e9) to make the white error cards pop */}
      <div className="flex-1 overflow-auto p-4 bg-[#f3f0e9]">
        {hasErrors ? (
          // === STATE 1: ERROR LIST ===
          <div className="flex flex-col gap-3">
            {errors.map((error, index) => (
              <div
                key={index}
                className="flex bg-white rounded-r-md shadow-sm overflow-hidden"
              >
                {/* Red accent bar on the left */}
                <div className="w-2 bg-[#c53030]"></div>
                <div className="p-3 flex-1">
                  {/* Error Header: Line Number & Type */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-[#f0e6e6] text-[#c53030] text-xs font-bold rounded-sm font-sans">
                      Line {error.line}
                    </span>
                    <span className="text-[#718096] text-xs font-bold tracking-wider font-sans uppercase">
                      {error.type || "SYNTAX ERROR"}
                    </span>
                  </div>
                  {/* Error Message - using monospace font for code flavor */}
                  <p className="text-[#2d3748] font-mono text-sm leading-relaxed">
                    {error.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // === STATE 2: SUCCESS MESSAGE ===
          <div className="flex flex-col items-center justify-center h-full text-center pb-8">
            <CheckCircle size={64} className="text-[#e4c060] mb-4 opacity-80" />
            <h3 className="text-2xl font-bold text-[#2d3748] mb-2">
              Analysis Complete
            </h3>
            <p className="text-[#718096] italic">No Syntax Error Detected</p>
          </div>
        )}
      </div>
    </div>
  );
};
