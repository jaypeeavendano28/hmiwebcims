import { FC, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PostData } from "../helpers";
import useAppStore from "../store";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { TAppointments, TQueueDetail } from "../types";
import {
  Button,
  Dropdown,
  MenuProps,
  Modal,
  Radio,
  Space,
  Tag,
  Tooltip,
  notification,
} from "antd";
import { BsCheckLg, BsClipboardCheck, BsMegaphoneFill } from "react-icons/bs";
import Calling from "./calling";
import { BiNotepad } from "react-icons/bi";
import { useRouter } from "@tanstack/react-router";
import dayjs from "dayjs";
import { FaUpload } from "react-icons/fa6";
import { GiMedicines } from "react-icons/gi";
import RequestForMedicines from "./RequestForMedicines";

type Props = {
  CounterCode?: string;
  DepartmentId?: number;
  DateFrom: string;
  DateTo: string;
  Station: string;
  isDone: boolean;
  MemberNo: string;
  Name: string;
  IsMobile: boolean;
};

const statusTagColors: Record<string, string> = {
  A: "processing",
  C: "blue",
  D: "success",
  E: "warning",
  O: "error",
  W: "default",
};

const PatientsPerCounter: FC<Props> = ({
  CounterCode,
  DepartmentId,
  DateFrom,
  DateTo,
  Station,
  isDone,
  MemberNo,
  Name,
  IsMobile,
}) => {
  const [showRequest, setShowRequest] = useState(false);
  const router = useRouter();
  const [selectedRecord, setSelectedRecord] = useState<any | undefined>();
  const [showModal, setShowModal] = useState(false);
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [pendingQueueDetails, setPendingQueueDetails] = useState<
    TQueueDetail[]
  >([]);
  const [selectedQueueDetailId, setSelectedQueueDetailId] = useState<
    number | undefined
  >();
  const [IsSubmitting, setIsSubmitting] = useState(false);
  const [now, setNow] = useState(dayjs());
  const store = useAppStore();
  const queryClient = useQueryClient();
  const effectiveIsDone = IsMobile || isDone;

  const patientsQueryKey = [
    "patientsPerCounter",
    store.branchCode,
    CounterCode,
    DepartmentId,
    DateFrom,
    DateTo,
    effectiveIsDone,
    Name,
    MemberNo,
    IsMobile,
  ] as const;

  const patients = useQuery({
    queryKey: patientsQueryKey,
    queryFn: async () => {
      const useDepartmentView = DepartmentId !== undefined;
      const useProcedureCompletedList = isDone && !IsMobile && Station !== "0";
      const sp = useDepartmentView
        ? useProcedureCompletedList
          ? "udp_GetCompletedProceduresByDepartment"
          : "udp_GetPatientsPerDepartment"
        : useProcedureCompletedList
          ? "udp_GetCompletedProcedures"
          : "udp_GetPatientsPerCounter";
      const parameters = useDepartmentView
        ? {
            BranchCode: store.branchCode,
            DepartmentId,
            DateFrom,
            DateTo,
            Station,
            UserId: store.userId,
            IsDone: effectiveIsDone,
            Name,
            MemberNo,
            IsMobile,
          }
        : {
            BranchCode: store.branchCode,
            CounterCode,
            DateFrom,
            DateTo,
            IsDone: effectiveIsDone,
            Name,
            MemberNo,
            IsMobile,
          };
      const res = await PostData("GetRecords", {
        sp,
        parameters,
      });

      return res?.parameters.lst ?? [];
    },
    refetchOnWindowFocus: true,
  });

  const listOfPatients = patients.data ?? [];

  const refreshPatientQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: patientsQueryKey,
        exact: true,
      }),
      queryClient.invalidateQueries({
        queryKey: ["patientPerCounter"],
      }),
    ]);
  };

  const handleCall = async (data: any) => {
    setIsSubmitting(true);

    try {
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
      if (!res) return;

      if (res.status === 2) {
        setSelectedRecord({ ...data, Status: "C" });
        setPendingQueueDetails(res.parameters ?? []);
        setSelectedQueueDetailId(undefined);
        setShowProcedureModal(true);
        return;
      }

      if (res.status === 1) {
        const responseDetailId =
          res.parameters?.QueueDetailId ??
          res.parameters?.queueDetailId ??
          data.QueueDetailId;
        const activeRecord = {
          ...data,
          QueueDetailId: responseDetailId,
          CurrentQueueDetailId: responseDetailId,
        };

        if (data.Status === "C") {
          setSelectedRecord(activeRecord);
          setShowModal(true);
        } else if (data.Status === "O") {
          setSelectedRecord({});
          setShowModal(false);
        } else if (data.Status === "A") {
          setSelectedRecord(activeRecord);
          setShowModal(false);
          openProcedureWorkspace(activeRecord);
        }
        await refreshPatientQueries();
        queryClient.invalidateQueries({
          queryKey: ["patientsPerCounter"],
        });
      } else {
        notification.error({
          message: res.message,
          placement: "topRight",
          duration: 5,
        });
      }
    } catch (error: any) {
      notification.error({
        message: error?.message ?? "Unable to update the queue.",
        placement: "topRight",
        duration: 5,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const beginCall = async (data: any) => {
    setIsSubmitting(true);
    try {
      const res = await PostData("GetPendingQueueDetails", {
        QueueId: data.Id,
      });

      if (!res || res.status !== 1) {
        notification.error({
          message: res?.message ?? "Unable to load pending procedures.",
          placement: "topRight",
          duration: 5,
        });
        return;
      }

      const details: TQueueDetail[] = res.parameters ?? [];
      if (details.length > 1) {
        setSelectedRecord({ ...data, Status: "C" });
        setPendingQueueDetails(details);
        setSelectedQueueDetailId(undefined);
        setShowProcedureModal(true);
        return;
      }

      const queueDetailId =
        details[0]?.QueueDetailId ?? (details[0] as any)?.queueDetailId;
      await handleCall({
        ...data,
        Status: "C",
        QueueDetailId: queueDetailId,
      });
    } catch (error: any) {
      notification.error({
        message: error?.message ?? "Unable to load pending procedures.",
        placement: "topRight",
        duration: 5,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const items: MenuProps["items"] = [
    {
      key: "A",
      label: "Attending",
      onClick: () => {
        void handleCall({ ...selectedRecord, Status: "A" });
      },
    },
    {
      key: "D",
      label: "Done",
      onClick: (e) => {
        void handleCall({ ...selectedRecord, Status: e.key });
      },
    },
    {
      key: "E",
      label: "Deferred",
      onClick: (e) => {
        void handleCall({ ...selectedRecord, Status: e.key });
      },
    },
    {
      key: "O",
      label: "Out When Called",
      onClick: (e) => {
        void handleCall({ ...selectedRecord, Status: e.key });
      },
    },
    {
      key: "W",
      label: "Waiting",
      onClick: (e) => {
        void handleCall({ ...selectedRecord, Status: e.key });
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
    // router.navigate({
    //   to: '/cardioresult/$Id',
    //   params: {
    //     Id: data.fk_Appointments_Id,
    //   },
    // });

    router.navigate({
      to: "/cardiologyresult/$Id",
      params: {
        Id: data.fk_Appointments_Id.toString(),
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

  const openProcedureWorkspace = (data: any) => {
    switch (data.CounterCode ?? CounterCode) {
      case "LAB":
        handleLabResult(data);
        break;
      case "XRAY":
        handleXrayResult(data);
        break;
      case "CARDIO":
        handleCardioResult(data);
        break;
      case "ULT":
        handleUltrasoundResult(data);
        break;
    }
  };
  const actionBodyElapseTime = (data: TAppointments) => {
    if (data.Status === "D") return data.ElapseTime ?? "-";
    if (!data.DateAdded) return "-";

    const dateAdded = dayjs(data.DateAdded);
    if (!dateAdded.isValid()) return "-";

    const elapsedSeconds = Math.max(now.diff(dateAdded, "second"), 0);
    const days = Math.floor(elapsedSeconds / 86400);
    const hours = Math.floor((elapsedSeconds % 86400) / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ${hours
        .toString()
        .padStart(2, "0")} hr`;
    }

    if (hours > 0) {
      return `${hours} hr ${minutes.toString().padStart(2, "0")} min`;
    }

    return `${minutes} min ${seconds.toString().padStart(2, "0")} sec`;
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
    const rowCounterCode = data.CounterCode ?? CounterCode;
    return (
      <Space>
        {!IsMobile && !effectiveIsDone && (
          <Tooltip title="Call">
            <Button
              type="primary"
              icon={<BsMegaphoneFill />}
              onClick={() => {
                void beginCall(data);
              }}
              className="text-center"
              loading={IsSubmitting}
              disabled={data.CurrentQStatus === "A" || data.cantCall}
            />
          </Tooltip>
        )}
        {!IsMobile && !effectiveIsDone && (
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
        )}
        {rowCounterCode === "LAB" && effectiveIsDone && (
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
        {rowCounterCode === "XRAY" && effectiveIsDone && (
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

        {rowCounterCode === "ULT" && effectiveIsDone && (
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
        {rowCounterCode === "CARDIO" && effectiveIsDone && (
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
        {(rowCounterCode === "DIA" || rowCounterCode === "AMB") && (
          <>
            <Tooltip title="Request for Medicines">
              <Button
                type="primary"
                icon={<GiMedicines />}
                onClick={() => handleRequest(data)}
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
  const descriptionsRowTemplate = (data: any) => {
    return (
      <div className="whitespace-normal break-words px-4 py-2 font-normal leading-5 text-gray-600">
        {data.Descriptions}
      </div>
    );
  };
  const statusBodyTemplate = (data: any) => {
    const statusDescription = data.StatusDesc ?? data.StatusDescription ?? "-";
    const color = statusTagColors[data.Status] ?? "default";

    return (
      <Tag color={color} className="m-0 font-semibold">
        {statusDescription}
      </Tag>
    );
  };
  const handleRequest = (data: any) => {
    setSelectedRecord(data);
    setShowRequest(true);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(dayjs());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const expandedDescriptionRows = listOfPatients.filter(
    (patient: any) => patient.Descriptions,
  );

  return (
    <div className="cardBackGround">
      <DataTable
        value={listOfPatients}
        loading={patients.isFetching}
        // rows={10}
        // rowsPerPageOptions={[10, 25, 50]}
        filterDisplay="row"
        emptyMessage="No Records!"
        stripedRows
        size="normal"
        // rowExpansionTemplate={rowExpansionTemplate}
        // expandedRows={expandedRows as any}
        // onRowToggle={(e) => setExpandedRows(e.data as any)}
        rowExpansionTemplate={descriptionsRowTemplate}
        expandedRows={expandedDescriptionRows as any}
        tableStyle={{ fontSize: "12px", fontWeight: "bold" }}
      >
        <Column
          field="action"
          header="Action"
          body={(data) => actionBodyTemplate(data)}
        ></Column>
        {/* <Column field="AppointmentNo" header="Appointment No."></Column> */}
        <Column
          field="AppointmentDate"
          header="Appointment Date"
          filter
          body={(data) =>
            data.AppointmentDate
              ? dayjs(data.AppointmentDate).format("MMM D, YYYY")
              : "-"
          }
        ></Column>
        <Column field="Name" header="Name" filter></Column>
        <Column
          field="CurrentCounterAndStatus"
          header="Current Counter"
          hidden={isDone}
          filter
        ></Column>

        <Column field="QueueNo" header="Queue No." filter></Column>
        <Column field="MemberNo" header="Member No." filter></Column>

        {/* <Column field="Company" header="Company" filter></Column> */}
        <Column
          hidden={IsMobile}
          field="StatusDesc"
          header="Status"
          filter
          body={(data) => statusBodyTemplate(data)}
        ></Column>
        <Column
          hidden={!isDone}
          field="DateCompleted"
          header="Date Completed"
          body={(data) =>
            data.DateCompleted
              ? dayjs(data.DateCompleted).format("MMM D, YYYY")
              : "-"
          }
        ></Column>

        <Column
          hidden={isDone}
          field="ElapseTime"
          header="Elapsed Time"
          body={(data) => actionBodyElapseTime(data)}
        ></Column>
      </DataTable>
      <Modal
        open={showProcedureModal}
        title={`Select procedure for ${selectedRecord?.QueueNo ?? "queue"}`}
        okText="Call selected procedure"
        confirmLoading={IsSubmitting}
        okButtonProps={{ disabled: selectedQueueDetailId === undefined }}
        onCancel={() => {
          setShowProcedureModal(false);
          setSelectedQueueDetailId(undefined);
        }}
        onOk={() => {
          if (selectedQueueDetailId === undefined) return;
          setShowProcedureModal(false);
          void handleCall({
            ...selectedRecord,
            Status: "C",
            QueueDetailId: selectedQueueDetailId,
          });
        }}
      >
        <Radio.Group
          className="w-full"
          value={selectedQueueDetailId}
          onChange={(event) => setSelectedQueueDetailId(event.target.value)}
        >
          <Space direction="vertical" className="w-full">
            {pendingQueueDetails.map((detail) => {
              const detailId =
                detail.QueueDetailId ?? (detail as any).queueDetailId;
              return (
                <Radio key={detailId} value={detailId}>
                  {detail.Description ??
                    (detail as any).description ??
                    `Charge ${detail.ChargeId ?? (detail as any).chargeId}`}
                </Radio>
              );
            })}
          </Space>
        </Radio.Group>
      </Modal>
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
              if (Station === "1") {
                handleCall({ ...selectedRecord, Status: "A" });
              }

              setShowModal(false);
            }}
          >
            Accept
          </Button>
        </div>
      </Modal>
      <Modal
        open={showRequest}
        destroyOnClose
        onCancel={() => setShowRequest(false)}
        footer={false}
        width={window.innerWidth - 100}
      >
        <RequestForMedicines
          Name={selectedRecord?.Name}
          AppointmentId={selectedRecord?.fk_Appointments_Id}
        />
      </Modal>
    </div>
  );
};

export default PatientsPerCounter;
