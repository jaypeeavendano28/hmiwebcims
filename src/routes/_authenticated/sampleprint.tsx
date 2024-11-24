import { createFileRoute } from "@tanstack/react-router";
import { Button } from "antd";
export const Route = createFileRoute("/_authenticated/sampleprint")({
  component: () => <SamplePrint />,
});

const SamplePrint = () => {
  // const handlePrint = () => {
  //   const printWindow = window.open("", "_blank");
  //   if (printWindow) {
  //     printWindow.document.write(`
  //               <html>
  //                   <head>
  //                       <title>Print</title>
  //                       <style>
  //                           /* Add any styles you want for printing here */
  //                           body { font-family: Arial, sans-serif; }
  //                       </style>
  //                   </head>
  //                   <body>
  //                       <div id="print-content"></div>
  //                   </body>
  //               </html>
  //           `);
  //     printWindow.document.close();

  //     // Render the PrintableComponent to the new window
  //     const printContent = document.getElementById("print-content");
  //     if (printContent) {
  //       printContent.innerHTML = `
  //                   <h1>This is a Printable Component</h1>
  //                   <p>You can print this content directly from the browser.</p>
  //               `;
  //     }

  //     printWindow.onload = () => {
  //       printWindow.print();
  //       printWindow.close();
  //     };
  //   }
  // };

  return (
    <>
      <div>sdfsdf</div>
      <Button type="primary" onClick={() => {}}>
        Print
      </Button>
    </>
  );
};
