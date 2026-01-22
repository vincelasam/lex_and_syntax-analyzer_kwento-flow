import { CheckCircle, Expand, Play, AlertCircle } from "lucide-react";

export interface SyntaxError {
  line: number;
  message: string;
  type?: string;
}

interface SyntaxViewProps {
  errors: SyntaxError[];
  hasAnalyzed?: boolean;
}

export const SyntaxView = ({
  errors,
  hasAnalyzed = false,
}: SyntaxViewProps) => {
  const hasErrors = errors.length > 0;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden border-2 border-[#e4c060] shadow-sm font-serif">
      {/* --- HEADER SECTION --- */}
      <div className="flex justify-between items-center px-4 py-3 border-b-2 border-[#e4c060] bg-white">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-[#2d3748] tracking-wide">
            Syntax Analyzer
          </h2>

          {/* BADGE LOGIC: 3 States */}
          {!hasAnalyzed ? (
            // STATE 0: IDLE / READY
            <span className="px-3 py-1 bg-gray-100 text-gray-500 text-sm font-bold rounded-md border border-gray-200">
              Ready to Analyze
            </span>
          ) : hasErrors ? (
            // STATE 1: ERRORS FOUND
            <span className="px-3 py-1 bg-[#f0e6e6] text-[#c53030] text-sm font-bold rounded-md border border-[#e4c060]/30">
              {errors.length} Errors Found
            </span>
          ) : (
            // STATE 2: SUCCESS
            <span className="px-3 py-1 bg-[#e6f0e6] text-[#2f855a] text-sm font-bold rounded-md border border-[#e4c060]/30">
              No Errors Detected
            </span>
          )}
        </div>
      </div>

      {/* --- CONTENT BODY --- */}
      <div className="flex-1 overflow-auto p-4 bg-[#f3f0e9]">
        {/* CASE 0: NOT ANALYZED YET */}
        {!hasAnalyzed ? (
          <div className="flex flex-col items-center justify-center h-full text-center pb-8 opacity-60">
            <div className="w-16 h-16 bg-[#e4c060] rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Play size={32} className="text-white ml-1" fill="white" />
            </div>
            <h3 className="text-2xl font-bold text-[#2d3748] mb-2">
              Begin Analysis
            </h3>
            <p className="text-[#718096] italic max-w-xs">
              Click the "Analyze Narrative Structure" button to check your code.
            </p>
          </div>
        ) : hasErrors ? (
          // CASE 1: ERRORS LIST (Your existing code)
          <div className="flex flex-col gap-3">
            {errors.map((error, index) => (
              <div
                key={index}
                className="flex bg-white rounded-r-md shadow-sm overflow-hidden"
              >
                <div className="w-2 bg-[#c53030]"></div>
                <div className="p-3 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-[#f0e6e6] text-[#c53030] text-xs font-bold rounded-sm font-sans">
                      Line {error.line}
                    </span>
                    <span className="text-[#718096] text-xs font-bold tracking-wider font-sans uppercase">
                      {error.type || "SYNTAX ERROR"}
                    </span>
                  </div>
                  <p className="text-[#2d3748] font-mono text-sm leading-relaxed">
                    {error.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // CASE 2: SUCCESS MESSAGE (Your existing code)
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
