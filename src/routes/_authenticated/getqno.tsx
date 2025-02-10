import { createFileRoute, useRouter } from "@tanstack/react-router";
import useAppStore from "../../store";
import { useEffect, useRef, useState } from "react";
import Header from "../../components/Header";
import { useAuth } from "../../hooks/userAuth";
import { notification } from "antd";
import dayjs from "dayjs";
import { PostData } from "../../helpers";
//import { useReactToPrint } from "react-to-print";

export const Route = createFileRoute("/_authenticated/getqno")({
  component: () => <GetQNo />,
});

const GetQNo = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  //  const reactToPrintFn = useReactToPrint({ contentRef });
  const [description, setDescription] = useState("");
  const [time, setTime] = useState(dayjs().format("MM/DD/YYYY hh:mm A"));
  const [QNo, setQNo] = useState("");
  const router = useRouter();
  const auth = useAuth();
  const [IsProcessing, setIsProcessing] = useState(false);
  const store = useAppStore();
  const handleClick = async (e: string) => {
    //  handlePrintIcs(e);

    setIsProcessing(true);
    try {
      const res = await PostData("GetQNo", {
        Code: e,
      });
      if (res) {
        if (res.status === 1) {
          setQNo(res.parameters.QNo);
          setTime(dayjs().format("MM/DD/YYYY hh:mm A"));
          setDescription(res.parameters.Description);
          setIsProcessing(false);
        } else {
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  // const handlePrintIcs = async (code: string) => {
  //   const url = apiUrl + "GenerateReport";

  //   setIsProcessing(true);
  //   try {
  //     await axios({
  //       url: url, //your url
  //       method: "GET",
  //       responseType: "blob", // important
  //       params: {
  //         ReportName: "q.rdl",
  //         Code: code,
  //       },
  //       headers: {
  //         Authorization: ("Bearer " + Cookies.get("WebCimsTokenId")) as string,
  //       },
  //     }).then((response) => {
  //       let newBlob = new Blob([response.data], {
  //         type: "application/pdf",
  //       });

  //       if (newBlob) {
  //         const data = window.URL.createObjectURL(newBlob);

  //         var myWindow = window.open(data, "_blank", "width=800,height=600");

  //         if (myWindow) {
  //           var original = Promise.resolve(myWindow);
  //           original
  //             .then(() => {
  //               myWindow!.focus();
  //             })
  //             .then(() => {
  //               setTimeout(() => {
  //                 myWindow!.print();
  //               }, 2000);
  //             })
  //             .then(() => {
  //               setTimeout(() => {
  //                 myWindow?.close();
  //               }, 6000);

  //               setIsProcessing(false);
  //             });
  //         }
  //       }
  //     });
  //   } catch (error: any) {
  //     let errorString = error.response.data;
  //     errorString = JSON.parse(await error.response.data.text());
  //     return { Status: 0, Message: errorString.Message };
  //   }
  // };
  const handleWithAccess = async () => {
    const res = await auth.isWithAccess(13);
    if (!res) {
      notification.error({
        message: "Access denied-Queuing",
        placement: "topRight",
        duration: 3,
      });
      store.setHideSideBar("N");
      router.navigate({
        to: "/",
      });
    }
  };
  const handlePrint = () => {
    if (contentRef.current) {
      const content = contentRef.current.innerHTML; // Get the inner HTML of the div
      const printWindow = window.open("", "", "width=600,height=600"); // Open a new window
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print</title>
              <style>
                /* Add any custom styles for printing here */
                body { font-family: Arial, sans-serif;text-align: center;font-size: 24px }
              </style>
            </head>
            <body>
              ${content} <!-- Insert the div content -->
            </body>
          </html>
        `);
        printWindow.document.close(); // Close the document to ensure it's fully loaded
        printWindow.print(); // Trigger the print dialog
        // Close the document to en
      }
    }
  };
  useEffect(() => {
    handleWithAccess();

    store.setHideSideBar("Y");
  }, []);
  useEffect(() => {
    if (QNo !== "") {
      //  reactToPrintFn();
      handlePrint();
    }
  }, [QNo]);
  return (
    <div className="mt-2 p-4">
      <Header />
      <div className="grid grid-cols-1 md:grid-cols-2 mt-2 gap-4">
        <div
          className="bg-green-700 h-32 flex items-center justify-center hover:bg-green-900 cursor-pointer"
          onClick={() => {
            if (!IsProcessing) {
              handleClick("ape");
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
              handleClick("diag");
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
              handleClick("ofw");
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
              handleClick("consultation");
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
              handleClick("sc");
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
      <div className="text-center text-xl font-bold mt-2">Last Queue No.</div>
      <div ref={contentRef}>
        <div className={`text-center`}>
          <div className="font-bold text-3xl">HMICare, Inc.</div>
          <div className="font-bold text-2xl">Clinic and Diagnostic Center</div>
          <div className="text-2xl font-bold">{description}</div>
          <div className="text-4xl font-bold">{QNo}</div>
          <div className="text-2xl font-bold">{time}</div>
        </div>
      </div>
    </div>
  );
};
