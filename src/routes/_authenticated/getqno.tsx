import { createFileRoute, useRouter } from '@tanstack/react-router';
import useAppStore from '../../store';
import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import { useAuth } from '../../hooks/userAuth';
import { notification } from 'antd';
//import dayjs from "dayjs";
// import { PostData } from "../../helpers";
import Cookies from 'js-cookie';
import axios from 'axios';
//import { useReactToPrint } from "react-to-print";
const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API;
const devApi = import.meta.env.VITE_DEV_API;
const apiUrl = isDev ? devApi : prodApi;
export const Route = createFileRoute('/_authenticated/getqno')({
  component: () => <GetQNo />,
});

const GetQNo = () => {
  // const contentRef = useRef<HTMLDivElement>(null);
  //  const reactToPrintFn = useReactToPrint({ contentRef });
  //const [description, setDescription] = useState("");
  //const [time, setTime] = useState(dayjs().format("MM/DD/YYYY hh:mm A"));
  // const [QNo, setQNo] = useState("");
  const router = useRouter();
  const auth = useAuth();
  const [IsProcessing, setIsProcessing] = useState(false);
  const store = useAppStore();
  const handleClick = async (e: string) => {
    handlePrintQ(e);

    // setIsProcessing(true);
    // try {
    //   const res = await PostData("GetQNo", {
    //     Code: e,
    //   });
    //   if (res) {
    //     if (res.status === 1) {
    //       setQNo(res.parameters.QNo);
    //       setTime(dayjs().format("MM/DD/YYYY hh:mm A"));
    //       setDescription(res.parameters.Description);
    //       setIsProcessing(false);
    //     } else {
    //     }
    //   }
    // } catch (error) {
    //   console.log(error);
    // }
  };
  const handlePrintQ = async (code: string) => {
    setIsProcessing(true);

    try {
      const response = await axios({
        url: apiUrl + '/api/GenerateReport',
        method: 'GET',
        responseType: 'blob',
        params: {
          ReportName: 'q.rdl',
          Code: code,
        },
        headers: {
          Authorization: `Bearer ${Cookies.get('WebCimsTokenId')}`,
        },
      });

      const blob = new Blob([response.data], {
        type: 'application/pdf',
      });

      const pdfUrl = URL.createObjectURL(blob);

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';

      document.body.appendChild(iframe);

      let cleaned = false;

      const cleanupSuccessfulPrintFrame = () => {
        if (cleaned) return;
        cleaned = true;

        try {
          URL.revokeObjectURL(pdfUrl);

          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        } catch (err) {
          console.error(err);
        }

        setIsProcessing(false);
      };

      iframe.onload = () => {
        try {
          const win = iframe.contentWindow;

          if (!win) {
            setIsProcessing(false);
            return;
          }

          win.addEventListener('afterprint', cleanupSuccessfulPrintFrame, {
            once: true,
          });

          win.focus();
          win.print();
          setIsProcessing(false);
        } catch (err) {
          console.error(err);
          setIsProcessing(false);
        }
      };

      iframe.src = pdfUrl;
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
    }
  };
  const handleWithAccess = async () => {
    const res = await auth.isWithAccess(13);
    if (!res) {
      notification.error({
        message: 'Access denied-Queuing',
        placement: 'topRight',
        duration: 3,
      });
      store.setHideSideBar('N');
      router.navigate({
        to: '/',
      });
    }
  };
  // const handlePrint = () => {
  //   if (contentRef.current) {
  //     const content = contentRef.current.innerHTML; // Get the inner HTML of the div
  //     const printWindow = window.open("", "", "width=600,height=600"); // Open a new window
  //     if (printWindow) {
  //       printWindow.document.write(`
  //         <html>
  //           <head>
  //             <title>Print</title>
  //             <style>
  //               /* Add any custom styles for printing here */
  //               body { font-family: Arial, sans-serif;text-align: center;font-size: 24px }
  //             </style>
  //           </head>
  //           <body>
  //             ${content} <!-- Insert the div content -->
  //           </body>
  //         </html>
  //       `);
  //       printWindow.document.close(); // Close the document to ensure it's fully loaded
  //       printWindow.print(); // Trigger the print dialog
  //       // Close the document to en
  //     }
  //   }
  // };
  useEffect(() => {
    handleWithAccess();

    store.setHideSideBar('Y');
  }, []);
  // useEffect(() => {
  //   if (QNo !== "") {
  //     //  reactToPrintFn();
  //     handlePrint();
  //   }
  // }, [QNo]);
  return (
    <div className="mt-2 p-4">
      <Header />
      <div className="grid grid-cols-1 md:grid-cols-2 mt-2 gap-4">
        <div
          className="bg-green-700 h-32 flex items-center justify-center hover:bg-green-900 cursor-pointer"
          onClick={() => {
            if (!IsProcessing) {
              handleClick('ape');
            }
          }}
        >
          <div className="text-white font-bold text-4xl text-center">
            PEME/APE Appointment
            <br />
            (Tap to print)
          </div>
        </div>

        <div
          className="bg-blue-700 h-32 flex items-center justify-center hover:bg-blue-900"
          onClick={() => {
            if (!IsProcessing) {
              handleClick('diag');
            }
          }}
        >
          <div className="text-white font-bold text-4xl text-center cursor-pointer">
            Diagnostics
            <br />
            (Tap to print)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 mt-2 gap-4">
        <div
          className="bg-yellow-700 h-32 flex items-center justify-center hover:bg-yellow-900 cursor-pointer"
          onClick={() => {
            if (!IsProcessing) {
              handleClick('ofw');
            }
          }}
        >
          <div className="text-white font-bold text-4xl text-center">
            OFW Appointment
            <br />
            (Tap to print)
          </div>
        </div>

        <div
          className="bg-pink-700 h-32 flex items-center justify-center hover:bg-pink-900 cursor-pointer"
          onClick={() => {
            if (!IsProcessing) {
              handleClick('consultation');
            }
          }}
        >
          <div className="text-white font-bold text-4xl text-center">
            Consultation Appointment
            <br />
            (Tap to print)
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 mt-2 gap-4">
        <div
          className="bg-orange-700 h-32 flex items-center justify-center hover:bg-yellow-900 cursor-pointer"
          onClick={() => {
            if (!IsProcessing) {
              handleClick('sc');
            }
          }}
        >
          <div className="text-white font-bold text-4xl text-center">
            Senior Citizen/PWD
            <br />
            (Tap to print)
          </div>
        </div>
      </div>
      {/* <div className="text-center text-xl font-bold mt-2">Last Queue No.</div>
      <div ref={contentRef}>
        <div className={`text-center`}>
          <div className="font-bold text-3xl">HMICare, Inc.</div>
          <div className="font-bold text-2xl">Clinic and Diagnostic Center</div>
          <div className="text-2xl font-bold">{description}</div>
          <div className="text-4xl font-bold">{QNo}</div>
          <div className="text-2xl font-bold">{time}</div>
        </div>
      </div> */}
    </div>
  );
};
