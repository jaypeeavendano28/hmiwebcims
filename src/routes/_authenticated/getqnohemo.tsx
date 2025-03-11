import { createFileRoute, useRouter } from "@tanstack/react-router";
import useAppStore from "../../store";
import { useEffect, useState } from "react";
import Header from "../../components/Header";
import { useAuth } from "../../hooks/userAuth";
import { notification } from "antd";
import axios from "axios";
import Cookies from "js-cookie";
const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API;
const devApi = import.meta.env.VITE_DEV_API;
const apiUrl = isDev ? devApi : prodApi;

export const Route = createFileRoute("/_authenticated/getqnohemo")({
  component: () => <GetQNoHemo />,
});

const GetQNoHemo = () => {
  const router = useRouter();
  const auth = useAuth();
  const [IsProcessing, setIsProcessing] = useState(false);
  const store = useAppStore();

  const handlePrintQ = async (code: string) => {
    const url = apiUrl + "/api/GenerateReport";

    setIsProcessing(true);
    try {
      await axios({
        url: url, //your url
        method: "GET",
        responseType: "blob", // important
        params: {
          ReportName: "q.rdl",
          Code: code,
        },
        headers: {
          Authorization: ("Bearer " + Cookies.get("WebCimsTokenId")) as string,
        },
      }).then((response) => {
        let newBlob = new Blob([response.data], {
          type: "application/pdf",
        });

        if (newBlob) {
          const data = window.URL.createObjectURL(newBlob);

          var myWindow = window.open(data, "_blank", "width=800,height=600");

          if (myWindow) {
            var original = Promise.resolve(myWindow);
            original
              .then(() => {
                myWindow!.focus();
              })
              .then(() => {
                setTimeout(() => {
                  myWindow!.print();
                }, 2000);
              })
              .then(() => {
                setTimeout(() => {
                  myWindow?.close();
                }, 6000);

                setIsProcessing(false);
              });
          }
        }
      });
    } catch (error: any) {
      let errorString = error.response.data;
      errorString = JSON.parse(await error.response.data.text());
      return { Status: 0, Message: errorString.Message };
    }
  };
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
  useEffect(() => {
    handleWithAccess();

    store.setHideSideBar("Y");
  }, []);
  // useEffect(() => {
  //   if (QNo !== "") {
  //     reactToPrintFn();
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
              handlePrintQ("hemo");
            }
          }}
        >
          <div className="text-white font-bold text-4xl text-center">
            HEMODIALYSIS
            <br />
            (Tap to print)
          </div>
        </div>

        <div
          className="bg-blue-700 h-32 flex items-center justify-center hover:bg-blue-900"
          onClick={() => {
            if (!IsProcessing) {
              handlePrintQ("amb");
            }
          }}
        >
          <div className="text-white font-bold text-4xl text-center cursor-pointer">
            AMBULATORY
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
