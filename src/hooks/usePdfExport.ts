import { useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ChatMessage {
  role: string;
  parts: { text: string }[];
}

const usePdfExport = () => {
  const exportToPdf = useCallback(async (conversationHistory: ChatMessage[]) => {
    if (conversationHistory.length === 0) {
      alert('No conversation to export');
      return;
    }

    try {
      // Create a hidden div to render the chat for PDF
      const exportDiv = document.createElement('div');
      exportDiv.style.position = 'absolute';
      exportDiv.style.left = '-9999px';
      exportDiv.style.width = '210mm'; // A4 width
      exportDiv.style.padding = '20px';
      exportDiv.style.backgroundColor = 'white';
      exportDiv.style.fontFamily = 'Arial, sans-serif';
      
      // Add header
      const header = document.createElement('div');
      header.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f47321; padding-bottom: 20px;">
          <h1 style="color: #1f2937; margin: 0; font-size: 24px;">UTEP Support Chat Export</h1>
          <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 14px;">Exported on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
      `;
      exportDiv.appendChild(header);

      // Add each message
      conversationHistory.forEach((message, index) => {
        const messageDiv = document.createElement('div');
        messageDiv.style.marginBottom = '25px';
        messageDiv.style.pageBreakInside = 'avoid';
        
        const isUser = message.role === 'user';
        const bgColor = isUser ? '#dbeafe' : '#f9fafb';
        const textColor = isUser ? '#1e40af' : '#374151';
        const roleText = isUser ? 'You' : 'UTEP Assistant';
        const emoji = isUser ? '👤' : '🤖';
        
        messageDiv.innerHTML = `
          <div style="background-color: ${bgColor}; padding: 15px; border-radius: 10px; border-left: 4px solid ${isUser ? '#3b82f6' : '#10b981'};">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <span style="font-size: 16px; margin-right: 8px;">${emoji}</span>
              <strong style="color: ${textColor}; font-size: 16px;">${roleText}</strong>
              <span style="margin-left: 10px; color: #6b7280; font-size: 12px;">Message ${index + 1}</span>
            </div>
            <div style="color: ${textColor}; line-height: 1.6; font-size: 14px; white-space: pre-wrap;">${message.parts[0].text}</div>
          </div>
        `;
        
        exportDiv.appendChild(messageDiv);
      });

      // Add footer
      const footer = document.createElement('div');
      footer.innerHTML = `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
          <p>University of Texas at El Paso - Support Chat</p>
          <p>Total messages: ${conversationHistory.length}</p>
        </div>
      `;
      exportDiv.appendChild(footer);

      document.body.appendChild(exportDiv);

      // Convert to canvas
      const canvas = await html2canvas(exportDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: 'white',
        width: exportDiv.scrollWidth,
        height: exportDiv.scrollHeight
      });

      // Remove the temporary div
      document.body.removeChild(exportDiv);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10; // 10mm top margin

      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20); // Account for margins

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }

      // Save the PDF
      const fileName = `UTEP_Chat_${new Date().toISOString().split('T')[0]}_${new Date().toTimeString().split(' ')[0].replace(/:/g, '-')}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  }, []);

  return { exportToPdf };
};

export default usePdfExport;
