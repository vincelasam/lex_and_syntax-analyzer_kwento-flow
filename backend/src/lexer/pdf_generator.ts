import { Token, TokenType } from "../types/Tokens";
import { jsPDF } from "jspdf";


export function generatePDF(tokens: Token[]): Buffer {
  console.log(" Starting PDF generation...");
  
  const doc = new jsPDF();

  const GOLD: [number, number, number] = [218, 165, 32];
  const GRAY: [number, number, number] = [235, 235, 235];
  const TEXT: [number, number, number] = [30, 30, 30];

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const startX = 14;
  const startY = 18;
  const padding = 6;
  
  // Column widths 
  const colWidths = [20, 70, 70]; // LINE, LEXEME, TOKEN TYPE
  const baseTableWidth = colWidths.reduce((a, b) => a + b, 0);
  const innerX = startX + padding;
  const innerWidth = baseTableWidth - padding * 2;
  const scale = innerWidth / baseTableWidth;
  const innerColWidths = colWidths.map(w => w * scale);
  
  const cellHeight = 9;
  const maxCellHeight = 18; // Maximum height for cells with wrapped text
  
  // Calculate available space for table on first page
  const titleHeight = 18 + 6; // Title + divider
  const availableHeight = pageHeight - startY - titleHeight - 20; // 20 = bottom margin
  
  let currentY = startY;
  let currentPage = 1;
  let isFirstPage = true;

  // Helper function to wrap text
  const wrapText = (text: string, maxWidth: number): string[] => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = doc.getTextWidth(testLine);
      
      if (testWidth > maxWidth) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Word is too long, need to break it
          let remaining = word;
          while (remaining.length > 0) {
            let chunk = remaining;
            while (doc.getTextWidth(chunk) > maxWidth && chunk.length > 1) {
              chunk = chunk.slice(0, -1);
            }
            lines.push(chunk);
            remaining = remaining.slice(chunk.length);
          }
        }
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  // Helper function to add page header
  const addPageHeader = () => {
    doc.setFont("times", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...TEXT);
    
    if (isFirstPage) {
      doc.text(
        "Lexical Tokens (The Elements)",
        startX + padding,
        currentY + 13
      );
      currentY += 18;
      
      // Gold divider line
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.4);
      doc.line(startX + 2, currentY, startX + baseTableWidth - 2, currentY);
      currentY += 6;
      
      isFirstPage = false;
    } else {
      // Simplified header for continuation pages
      doc.setFontSize(14);
      doc.text(
        "Lexical Tokens (continued)",
        startX + padding,
        currentY + 10
      );
      currentY += 15;
    }

    // Table header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);

    const headers = ["LINE", "LEXEME", "TOKEN TYPE"];
    let x = innerX;

    headers.forEach((h, i) => {
      doc.setFillColor(...GRAY);
      doc.rect(x, currentY, innerColWidths[i], cellHeight, "FD");
      doc.text(h, x + innerColWidths[i] / 2, currentY + 6, { align: "center" });
      x += innerColWidths[i];
    });

    currentY += cellHeight;
  };

  // Helper function to add new page
  const addNewPage = () => {
    doc.addPage();
    currentPage++;
    currentY = startY;
    addPageHeader();
  };

  // Start first page
  addPageHeader();

  // Process tokens
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const rows = tokens.length > 0 ? tokens : 
    Array.from({ length: 3 }, (_, i) => ({
      line: i + 1,
      lexeme: "No tokens",
      type: TokenType.Identifier,
      column: 0 // Added to satisfy Token interface type check
    } as Token));

  console.log(`📝 Processing ${rows.length} tokens...`);

  rows.forEach((t, idx) => {
    // Prepare cell contents with wrapping
    const lineText = t.line.toString();
    const lexemeLines = wrapText(
      t.lexeme || "", 
      innerColWidths[1] - 8
    );
    const typeLines = wrapText(
      TokenType[t.type], 
      innerColWidths[2] - 8
    );
    
    // Calculate row height based on maximum lines
    const maxLines = Math.max(1, lexemeLines.length, typeLines.length);
    const rowHeight = Math.min(maxLines * 6 + 3, maxCellHeight);
    
    // Check if we need a new page
    if (currentY + rowHeight > pageHeight - 20) {
      console.log(` Adding new page at token ${idx + 1}`);
      addNewPage();
    }

    // Draw cells
    let colX = innerX;

    // LINE column
    doc.rect(colX, currentY, innerColWidths[0], rowHeight);
    doc.text(lineText, colX + 4, currentY + 6);
    colX += innerColWidths[0];

    // LEXEME column
    doc.rect(colX, currentY, innerColWidths[1], rowHeight);
    lexemeLines.forEach((line, idx) => {
      doc.text(line, colX + 4, currentY + 6 + (idx * 6));
    });
    colX += innerColWidths[1];

    // TOKEN TYPE column
    doc.rect(colX, currentY, innerColWidths[2], rowHeight);
    typeLines.forEach((line, idx) => {
      doc.text(line, colX + 4, currentY + 6 + (idx * 6));
    });

    currentY += rowHeight;
  });

  // Add page numbers
  const totalPages = currentPage;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  console.log(` PDF generated with ${totalPages} pages`);

  // CHANGE 2: Return Buffer for Node.js file serving
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}