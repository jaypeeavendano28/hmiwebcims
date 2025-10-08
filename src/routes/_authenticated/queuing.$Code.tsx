import { createFileRoute, useRouter } from "@tanstack/react-router";
import useAppStore from "../../store";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/userAuth";
import { notification } from "antd";
import Header from "../../components/Header";
import { TCounters, TQCounters } from "../../types";
import { PostData, isNullOrUndefinedOrBlank } from "../../helpers";
import dayjs from "dayjs";
import Calling2 from "../../components/calling2";
import Attending from "../../components/attending";
import QPatients from "../../components/QPatients";

export const Route = createFileRoute("/_authenticated/queuing/$Code")({
  component: () => <Queuing />,
});

const Queuing = () => {
  const [isCalling, setIsCalling] = useState(false);
  const [currentCounter, setCurrentCounter] = useState<any | undefined>();
  const [randomNo, setRandonNo] = useState(
    Math.floor(Math.random() * 999999) + 1
  );
  const { Code } = Route.useParams();
  const auth = useAuth();
  const store = useAppStore();
  const router = useRouter();
  const [Counters, setCounters] = useState<TCounters[] | undefined>([]);
  const [Counter1, setCounter1] = useState<string | undefined>("");
  const [Counter2, setCounter2] = useState<string | undefined>("");
  const [Counter3, setCounter3] = useState<string | undefined>("");
  const [Counter4, setCounter4] = useState<string | undefined>("");
  const [Cashier, setCashier] = useState<string | undefined>("");

  // const [Departments, setDepartments] = useState([]);
  const [ProcessQ, setProcessQ] = useState(false);
  const [ProcessedDept] = useState<string[]>([]);
  // const [QCalling, setQCalling] = useState([]);

  const handleGetCounterValues = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetReceptionCounters",
      parameters: { Grp: Code },
    });
    if (res) {
      setCounters(res.parameters.lst);
    }
  };

  const handleGetDepartments = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetPatientPerCounter2",
      parameters: {
        BranchCode: store.branchCode,
        DateFrom: dayjs().format("YYYYMMDD"),
        DateTo: dayjs().format("YYYYMMDD"),
        Station: Code,
      },
    });
    if (res) {
      setProcessQ(true);
      setCurrentCounter("");
      const x = res.parameters.lst;
      for (const e of x) {
        setCurrentCounter(e);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
      setProcessQ(false);
      setRandonNo(Math.floor(Math.random() * 999999) + 1);
    }
  };

  const handleSetCounterValues = () => {
    Counters?.map((v: TCounters) => {
      if (v.Code === "counter1") {
        setCounter1(v.CurrentQ);
      } else if (v.Code === "counter2") {
        setCounter2(v.CurrentQ);
      } else if (v.Code === "counter3") {
        setCounter3(v.CurrentQ);
      } else if (v.Code === "counter4") {
        setCounter4(v.CurrentQ);
      } else if (v.Code === "cashier") {
        setCashier(v.CurrentQ);
      }
    });
  };

  useEffect(() => {
    handleGetDepartments();
  }, [randomNo]);

  useEffect(() => {
    store.setHideSideBar("Y");
    const interval = setInterval(() => {
      handleGetCounterValues();
    }, 5000);
    return () => clearInterval(interval);
    console.log(Counter1);
    console.log(Counter2);
    console.log(Counter3);
    console.log(Counter4);
    console.log(Cashier);
    console.log(ProcessQ);
    console.log(ProcessedDept);
  }, []);

  // const handleCall = () => {
  //   QCalling.forEach(async (v: TQCalling) => {
  //     setIsCalling(true);
  //     console.log(v);
  //     const speech = new SpeechSynthesisUtterance();
  //     const voices = window.speechSynthesis.getVoices();
  //     speech.voice = voices[0]; // change voice
  //     speech.rate = 0.7;
  //     if (v.Station !== "2") {
  //       console.log("xxxxxxxxxxx");
  //       speech.text = "Patient " + v.QNo + " please proceed to " + v.Counter;
  //     } else {
  //       speech.text = "Patient " + v.QNo + " please proceed to STATION 2";
  //     }
  //     window.speechSynthesis.speak(speech);
  //     window.speechSynthesis.speak(speech);
  //     await PostData("UpdateQCalling", {
  //       QNo: v.QNo,
  //       Counter: v.Counter,
  //     });

  //     await new Promise((resolve) => setTimeout(resolve, 2000));
  //   });
  //   setIsCalling(false);

  //   // var i = 0;
  //   // const myLoop = () => {
  //   //   //  create a loop function
  //   //   setTimeout(async function () {
  //   //     //  call a 3s setTimeout when the loop is called
  //   //     const counter: TQCalling = QCalling[i];
  //   //     const speech = new SpeechSynthesisUtterance();
  //   //     const voices = window.speechSynthesis.getVoices();
  //   //     speech.voice = voices[0]; // change voice
  //   //     speech.rate = 0.7;
  //   //     if (counter.Station !== "2") {
  //   //       speech.text =
  //   //         "Patient " + counter.QNo + " please proceed to " + counter.Counter;
  //   //     } else {
  //   //       speech.text =
  //   //         "Patient " + counter.QNo + " please proceed to STATION 2";
  //   //     }
  //   //     window.speechSynthesis.speak(speech);
  //   //     window.speechSynthesis.speak(speech);
  //   //     // window.speechSynthesis.speak(speech);
  //   //     i++; //  increment the counter
  //   //     const res = await PostData("UpdateQCalling", {
  //   //       QNo: counter.QNo,
  //   //       Counter: counter.Counter,
  //   //     });
  //   //     if (res) {
  //   //     }
  //   //     if (i < QCalling.length) {
  //   //       //  if the counter < 10, call the loop function
  //   //       myLoop(); //  ..  again which will trigger another
  //   //     } //  ..  setTimeout()
  //   //   }, 1000);
  //   // };
  //   // myLoop();
  // };

  const handleGetQCalling = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetQCalling",
      parameters: {},
    });
    if (res) {
      setIsCalling(true);
      const q = res.parameters.lst;
      setIsCalling(true);
      q.forEach(async (f: any) => {
        const speech = new SpeechSynthesisUtterance();
        const voices = window.speechSynthesis.getVoices();
        speech.voice = voices[0]; // change voice
        speech.rate = 0.7;
        if (f.Station !== "2") {
          speech.text = "Patient " + f.QNo + " please proceed to " + f.Counter;
        } else {
          speech.text = "Patient " + f.QNo + " please proceed to STATION 2";
        }
        window.speechSynthesis.speak(speech);
        window.speechSynthesis.speak(speech);
        const res = await PostData("UpdateQCalling", {
          QNo: f.QNo,
          Counter: f.Counter,
        });
        if (res) {
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      setIsCalling(false);
    }
  };

  useEffect(() => {
    if (!isCalling) {
      handleGetQCalling();
    }
  }, [isCalling]);
  // useEffect(() => {
  //   handleCall();
  // }, []);

  useEffect(() => {
    handleSetCounterValues();
  }, [Counters]);

  useEffect(() => {
    if (!auth.isWithAccess(13)) {
      notification.error({
        message: "Access denied-Queuing",
        placement: "topRight",
        duration: 3,
      });
      router.navigate({
        to: "/",
      });
    }
  }, []);

  return (
    <div className="p-2 m-2 cardBackGround h-screen">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <Header />

          {Counters?.map((v: TQCounters) => (
            <div className="bg-orange-100 mt-2" key={v.Code}>
              <div className="text-3xl font-bold text-center">
                {v.Description}
              </div>
              <div className="text-3xl font-bold text-center">
                {!isNullOrUndefinedOrBlank(v.CurrentQ) && (
                  <div className="flex flex-row justify-center items-center">
                    {v.Status === "C" ? (
                      <Calling2 size={64} />
                    ) : (
                      <Attending size={64} />
                    )}
                    {v.CurrentQ}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="col-span-8 bg-green-500 p-4 min-h-screen">
          <>
            {currentCounter && (
              <QPatients CurrentDepartment={currentCounter!} />
            )}
          </>
        </div>
      </div>
    </div>
  );
};
