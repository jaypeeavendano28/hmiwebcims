import { createFileRoute } from '@tanstack/react-router';
import { Button } from 'antd';

export const Route = createFileRoute('/_authenticated/pdfviewer')({
  component: () => <PdfViewer />,
});

const PdfViewer = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex h-screen flex-col gap-3 bg-slate-100 p-3">
      <div>
        <Button type="primary" onClick={handlePrint}>
          Print
        </Button>
      </div>
      <object
        className="min-h-0 flex-1 rounded border border-slate-300 bg-white"
        data="/PsychReportOfw.pdf"
        type="application/pdf"
      >
        <div className="p-4 text-slate-700">PDF preview unavailable.</div>
      </object>
    </div>
  );
};
