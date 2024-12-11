import { createFileRoute, useRouter } from "@tanstack/react-router";
import useAppStore from "../../store";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/userAuth";
import { notification } from "antd";
import Header from "../../components/Header";
import {
  TCounters,
  TCurrentDepartment,
  TQCalling,
  TQCounters,
} from "../../types";
import { PostData, isNullOrUndefinedOrBlank } from "../../helpers";
import dayjs from "dayjs";
import Calling2 from "../../components/calling2";
import Attending from "../../components/attending";
import QPatients from "../../components/QPatients";

export const Route = createFileRoute("/_authenticated/queuing")({
  component: () => <Queuing />,
});

const Queuing = () => {
  const auth = useAuth();
  const store = useAppStore();
  const router = useRouter();
  const [Counters, setCounters] = useState<TCounters[] | undefined>([]);
  const [currentDepartment, setCurrentDepartment] = useState<
    TCurrentDepartment | undefined
  >(undefined);
  const [Counter1, setCounter1] = useState<string | undefined>("");
  const [Counter2, setCounter2] = useState<string | undefined>("");
  const [Counter3, setCounter3] = useState<string | undefined>("");
  const [Counter4, setCounter4] = useState<string | undefined>("");
  const [Cashier, setCashier] = useState<string | undefined>("");

  const [IsProcessing, setIsProcessing] = useState(false);
  const [Departments, setDepartments] = useState([]);
  const [ProcessQ, setProcessQ] = useState(false);
  const [ProcessedDept] = useState<string[]>([]);
  const [QCalling, setQCalling] = useState([]);

  const handleGetCounterValues = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetReceptionCounters",
      parameters: { Grp: "1" },
    });
    if (res) {
      setCounters(res.parameters.lst);
    }
  };

  const handleGetQCalling = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetQCalling",
      parameters: {},
    });
    if (res) {
      setQCalling(res.parameters.lst);
    }
  };

  const handleGetDepartments = async () => {
    if (IsProcessing) return;

    setDepartments([]);
    const res = await PostData("GetRecords", {
      sp: "udp_GetPatientPerCounter2",
      parameters: {
        BranchCode: store.branchCode,
        DateFrom: dayjs().format("YYYYMMDD"),
        DateTo: dayjs().format("YYYYMMDD"),
      },
    });
    if (res) {
      setProcessQ(true);
      setDepartments(res.parameters.lst);
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

  // const handleProcessQ = () => {
  //   setIsProcessing(true);

  //   Departments.map((v: any) => {
  //     //  var x = ProcessedDept.filter((e: string) => e == v.Counter);

  //     ProcessedDept.push(v.Counter);
  //   });
  //   setIsProcessing(false);
  // };
  useEffect(() => {
    handleGetDepartments();
    const interval = setInterval(() => {
      handleGetDepartments();
    }, 35000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
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

  const handleCall = () => {
    var i = 0;

    const myLoop = () => {
      //  create a loop function
      setTimeout(async function () {
        //  call a 3s setTimeout when the loop is called
        const counter: TQCalling = QCalling[i];

        const speech = new SpeechSynthesisUtterance();
        const voices = window.speechSynthesis.getVoices();
        speech.voice = voices[0]; // change voice
        speech.rate=.7;
        if (counter.Station !== "2") {
          speech.text =
            "Patient " + counter.QNo + " please proceed to " + counter.Counter;
        } else {
          speech.text =
            "Patient " + counter.QNo + " please proceed to STATION 2";
        }

        window.speechSynthesis.speak(speech);
        window.speechSynthesis.speak(speech);
        // window.speechSynthesis.speak(speech);
        i++; //  increment the counter

        const res = await PostData("UpdateQCalling", {
          QNo: counter.QNo,
          Counter: counter.Counter,
        });
        if (res) {
        }

        if (i < QCalling.length) {
          //  if the counter < 10, call the loop function
          myLoop(); //  ..  again which will trigger another
        } //  ..  setTimeout()
      }, 1000);
    };
    myLoop();
  };
  useEffect(() => {
    const interval = setInterval(() => {
      handleGetQCalling();
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    handleCall();
  }, [QCalling]);

  const handleGetDisplayQPerDepartment = async () => {
    setIsProcessing(false);
    var promise = Promise.resolve();
    Departments.forEach(async (v: TCurrentDepartment) => {
      promise = promise.then(function () {
        setCurrentDepartment(v);
        return new Promise(function (resolve) {
          setTimeout(resolve, 10000);
        });
      });
    });

    setIsProcessing(true);
    // Departments.forEach(async (v: any) => {
    //   setCurrentDepartment(v);
    //   console.log(v);
    //   await delay(5000);
    // });
    // setIsProcessing(false);
    // Departments.map(async (v: any) => {
    //   console.log(v);
    //   const res = await PostData("Pause", {
    //     Seconds: 30000,
    //   });
    //   if (res) {
    //     console.log(v);
    //   }
    // });
  };

  useEffect(() => {
    // const interval = setInterval(() => {
    //   Departments.map((v: any) => setCurrentDepartment(v));
    // }, 30000);
    // return () => clearInterval(interval);
    // Departments.map((v: any) => setCurrentDepartment(v));
    handleGetDisplayQPerDepartment();
  }, [Departments]);

  useEffect(() => {
    handleSetCounterValues();
  }, [Counters]);

  // useEffect(() => {
  //   const interval2 = setInterval(() => {
  //     handleProcessQ();
  //   }, 10000);
  //   return () => clearInterval(interval2);
  // }, [ProcessQ]);

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

    store.setHideSideBar("Y");
    //handleGetDisplayQPerDepartment();
    // delayedGreeting();
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
          {/* <div className="grid md:grid-cols-2 gap-4">
            {currentDepartment && (
              <QPatients CurrentDepartment={currentDepartment!} />
            )}
          </div> */}
          {currentDepartment && (
            <QPatients CurrentDepartment={currentDepartment!} />
          )}
        </div>
      </div>
    </div>
  );
};
