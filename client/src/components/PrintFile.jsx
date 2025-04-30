import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { printPlugin } from '@react-pdf-viewer/print';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/print/lib/styles/index.css';

const PrintFile = ({ fileData }) => {
  const [printing, setPrinting] = useState(false);

  const printPluginInstance = printPlugin({
    getPrintOptions: () => ({
      numberOfPages: fileData.fileType.pages,
      pageRanges: fileData.fileType.pageRange || '1-' + fileData.fileType.pages,
      copies: fileData.fileType.copies || 1,
      orientation: fileData.fileType.layout || 'portrait',
      colorMode: fileData.fileType.color === 'black' ? 'monochrome' : 'color',
    }),
  });

  const handlePrint = () => {
    setPrinting(true);
    const fileUrl = `http://localhost:3000/uploads/${encodeURIComponent(fileData.fileName)}`;

    try {
      // Create container
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      // Create root and render
      const root = createRoot(container);
      root.render(
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
          <div style={{ height: '100vh', width: '100vw' }}>
            <Viewer
              fileUrl={fileUrl}
              plugins={[printPluginInstance]}
              onDocumentLoad={() => {
                console.log('Document loaded, triggering print...');
                setTimeout(() => {
                  printPluginInstance.print();
                  setTimeout(() => {
                    root.unmount();
                    document.body.removeChild(container);
                    setPrinting(false);
                  }, 1000);
                }, 1000);
              }}
              onError={(error) => {
                console.error('PDF loading error:', error);
                setPrinting(false);
              }}
            />
          </div>
        </Worker>
      );
    } catch (error) {
      console.error('Print error:', error);
      setPrinting(false);
    }
  };

  return (
    <button
      onClick={handlePrint}
      className="print-button"
      disabled={printing}
    >
      {printing ? 'Preparing...' : 'Print'}
    </button>
  );
};

export default PrintFile;
