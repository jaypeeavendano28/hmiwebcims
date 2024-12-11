import { FC, useEffect, useState } from "react";
import { PostData } from "../helpers";
import useAppStore from "../store";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { TAppointments } from "../types";
import {
  Button,
  Dropdown,
  MenuProps,
  Modal,
  Space,
  Tooltip,
  notification,
} from "antd";
import { BsCheckLg, BsClipboardCheck, BsMegaphoneFill } from "react-icons/bs";
import Calling from "./calling";
import { BiNotepad } from "react-icons/bi";
import { useRouter } from "@tanstack/react-router";
import dayjs from "dayjs";
import { FaUpload } from "react-icons/fa6";

type Props = {
  CounterCode: string;
  DateFrom: string;
  DateTo: string;
  Station: string;
};

const PatientsPerCounter: FC<Props> = ({
  CounterCode,
  DateFrom,
  DateTo,
  Station,
}) => {
  const router = useRouter();
  const [selectedRecord, setSelectedRecord] = useState<any | undefined>();
  const [showModal, setShowModal] = useState(false);
  const [IsSubmitting, setIsSubmitting] = useState(false);
  const store = useAppStore();
  const [listOfPatients, setListOfPatients] = useState([]);

  const handleGetListOfPatients = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetPatientsPerCounter",
      parameters: {
        BranchCode: store.branchCode,
        CounterCode: CounterCode,
        DateFrom: DateFrom,
        DateTo: DateTo,
      },
    });
    if (res) {
      setListOfPatients(res.parameters.lst);
    }
  };

  const handleCall = async (data: any) => {
 
    setIsSubmitting(true);
    // if (data.Status === "C") {
    //   const speech = new SpeechSynthesisUtterance();
    //   const voices = window.speechSynthesis.getVoices();
    //   speech.voice = voices[0]; // change voice

    //   speech.text =
    //     "Patient " + data.QueueNo + " please proceed to " + data.CounterName;
    //   window.speechSynthesis.speak(speech);
    //   window.speechSynthesis.speak(speech);
    //   window.speechSynthesis.speak(speech);
    // }

    const valuesToSave = {
      ...data,
      Username: store.username,
      Counter: data.CounterName,
      QNo: data.QueueNo,
      Code: data.CounterCode,
      fk_Appointments_Id: data.fk_Appointments_Id,
      ElapseTime: "",
      Station,
    };

    const res = await PostData("CallCounter", valuesToSave);
    if (res) {
      setIsSubmitting(false);
      if (res.status === 1) {
        if (data.Status === "C") {
         
            setShowModal(true);
         

        } else if (data.Status === "O") {
          setSelectedRecord({});
          setShowModal(false);
        } else if (data.Status === "A") {
          setSelectedRecord(data);
          setShowModal(false);
          if (CounterCode === "LAB") {
            handleLabResult(data);
          }
        }
        handleGetListOfPatients();
      } else {
        notification.error({
          message: res.message,
          placement: "topRight",
          duration: 5,
        });
      }
    }
  };
  const items: MenuProps["items"] = [
    {
      key: "A",
      label: "Attending",
      onClick: () => {
        handleCall({ ...selectedRecord, Status: "A" });
        window.location.reload();
      },
    },
    {
      key: "D",
      label: "Done",
      onClick: (e) => {
        handleCall({ ...selectedRecord, Status: e.key });
        window.location.reload();
      },
    },
    {
      key: "E",
      label: "Deferred",
      onClick: (e) => {
        handleCall({ ...selectedRecord, Status: e.key });
        window.location.reload();
      },
    },
    {
      key: "O",
      label: "Out When Called",
      onClick: (e) => {
        handleCall({ ...selectedRecord, Status: e.key });
        window.location.reload();
      },
    },
    {
      key: "W",
      label: "Waiting",
      onClick: (e) => {
        handleCall({ ...selectedRecord, Status: e.key });
        window.location.reload();
      },
    },
  ];
  const handleLabResult = (data: any) => {
    router.navigate({
      to: "/laboratoryresults/$Id",
      params: {
        Id: data.fk_Appointments_Id,
      },
    });
  };

  const handleXrayResult = (data: any) => {
    router.navigate({
      to: "/xrayresult/$Id",
      params: {
        Id: data.fk_Appointments_Id,
      },
    });
  };

  const handleCardioResult = (data: any) => {
    router.navigate({
      to: "/cardioresult/$Id",
      params: {
        Id: data.fk_Appointments_Id,
      },
    });
  };

  const handleUltrasoundResult = (data: any) => {
    router.navigate({
      to: "/ultrasound/$Id",
      params: {
        Id: data.fk_Appointments_Id,
      },
    });
  };
  // const actionBodyElapseTime = (data: TAppointments) => {
  //   const [elapseTime, setElapseTime] = useState("");
  //   const handleSetElapseTime = () => {
  //     const e: number = dayjs().diff(dayjs(data.DateAdded), "m");
  //     const d: string = e.toString();
  //     setElapseTime(d);
  //   };
  //   if (data.Status !== "D") {
  //     setInterval(handleSetElapseTime, 1000);
  //   }

  //   return <p>{elapseTime}</p>;
  // };

  const actionBodyElapseTime = (data: TAppointments) => {
    const [elapseTime, setElapseTime] = useState("");
    const handleSetElapseTime = () => {
      const e: number = dayjs().diff(dayjs(data.DateAdded), "m");
      const d: string = e.toString();
      if (data.Status !== "D") {
        setElapseTime(d);
      }
    };

    if (data.Status !== "D") {
      setInterval(handleSetElapseTime, 1000);
    }
    if (data.Status !== "D") {
      return <p>{elapseTime}</p>;
    }

    return <p>{data.ElapseTime}</p>;
  };
  const handleUploadDocument = async (data: any) => {
    try {
      const res = await PostData("GetRecords", {
        sp: "udp_GetPatientInformationByAppointmentId",
        parameters: {
          AppointmentId: data.fk_Appointments_Id,
        },
      });

      if (res) {
        router.navigate({
          to: "/uploaddocuments/$Id",
          params: {
            Id: res.parameters.lst[0].Id,
          },
        });
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: "topRight",
        duration: 3,
      });
    }
  };
  const actionBodyTemplate = (data: TAppointments) => {
    return (
      <Space>
        <Tooltip title="Call">
          <Button
            type="primary"
            icon={<BsMegaphoneFill />}
            onClick={() => {
              setSelectedRecord({ ...data, Status: "C" });
              handleCall({ ...data, Status: "C" });
            }}
            className="text-center"
            loading={IsSubmitting}
            disabled={data.CurrentQStatus === "A"}
          />
        </Tooltip>
        <Tooltip title="Change Status">
          <Dropdown menu={{ items }} placement="top" trigger={["click"]}>
            <Button
              type="primary"
              icon={<BsClipboardCheck />}
              onClick={() => {
                setSelectedRecord(data);
              }}
            />
          </Dropdown>
        </Tooltip>
        {CounterCode === "LAB" && (
          <>
            <Tooltip title="Result">
              <Button
                type="primary"
                icon={<BiNotepad />}
                onClick={() => handleLabResult(data)}
              />
            </Tooltip>
          </>
        )}
        {CounterCode === "XRAY" && (
          <>
            <Tooltip title="Result">
              <Button
                type="primary"
                icon={<BiNotepad />}
                onClick={() => handleXrayResult(data)}
              />
            </Tooltip>
          </>
        )}

        {CounterCode === "ULT" && (
          <>
            <Tooltip title="Result">
              <Button
                type="primary"
                icon={<BiNotepad />}
                onClick={() => handleUltrasoundResult(data)}
              />
            </Tooltip>
          </>
        )}
        {CounterCode === "CARDIO" && (
          <>
            <Tooltip title="Result">
              <Button
                type="primary"
                icon={<BiNotepad />}
                onClick={() => handleCardioResult(data)}
              />
            </Tooltip>
          </>
        )}
        <Tooltip title="Upload Document">
          <Button
            type="primary"
            icon={<FaUpload />}
            onClick={() => handleUploadDocument(data)}
          />
        </Tooltip>

        {data.Status === "D" && <BsCheckLg size={32} color="green" />}

        {data.WithMer === "Y" && (
          <Tooltip title="MER is available">
            <BsCheckLg size={32} color="green" />
          </Tooltip>
        )}
      </Space>
    );
  };
  useEffect(() => {
    handleGetListOfPatients();
  }, [CounterCode]);
  return (
    <div className="cardBackGround">
      <DataTable
        value={listOfPatients}
        // rows={10}
        // rowsPerPageOptions={[10, 25, 50]}
        filterDisplay="row"
        emptyMessage="No Records!"
        stripedRows
        size="normal"
        // rowExpansionTemplate={rowExpansionTemplate}
        // expandedRows={expandedRows as any}
        // onRowToggle={(e) => setExpandedRows(e.data as any)}
        tableStyle={{ fontSize: "12px", fontWeight: "bold" }}
      >
        <Column
          field="action"
          header="Action"
          body={(data) => actionBodyTemplate(data)}
        ></Column>
        <Column field="AppointmentNo" header="Appointment No."></Column>
        <Column field="Name" header="Name" filter></Column>
        <Column
          field="CurrentCounterAndStatus"
          header="Current Counter"
          filter
        ></Column>

        <Column field="QueueNo" header="Queue No." filter></Column>

        <Column
          field="ElapseTime"
          header="Elapse Time(mins)"
          body={(data) => actionBodyElapseTime(data)}
        ></Column>
      </DataTable>
      <Modal
        open={showModal}
        destroyOnClose
        onCancel={() => {
          setShowModal(false);
        }}
        okText="Accept"
        cancelText="Cancel"
        footer={false}
      >
        <Calling size={200} />
        <div className="font-bold text-2xl text-center">
          Calling-{selectedRecord?.QueueNo}
        </div>
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            type="primary"
            danger
            onClick={() => {
              handleCall({ ...selectedRecord, Status: "O" });
              setShowModal(false);
            }}
          >
            Out When Called
          </Button>
          <Button
            type="primary"
            onClick={() => {
              if (Station==="1") {
                handleCall({ ...selectedRecord, Status: "A" });
              }
            
              setShowModal(false);
            }}
          >
            Accept
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default PatientsPerCounter;
