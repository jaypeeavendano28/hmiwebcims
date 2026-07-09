import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { App, Button, Divider, Input, List, Modal, Popover } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import VirtualList from "rc-virtual-list";
import Loading from "../../components/loading";
import PatientProfile from "../../components/PatientProfile";
import { isNullOrUndefinedOrBlank, PostData } from "../../helpers";
import useAppStore from "../../store";
import {
  TAppointments,
  TCharges,
  TPatientInformation,
  TQNo,
} from "../../types";
import { saveAppointment } from "./appointmentdetails.$Id";

export const Route = createFileRoute("/_authenticated/appointmentdetails/new")({
  component: NewAppointment,
});

const patientResultsHeight = 360;

function NewAppointment() {
  const router = useRouter();
  const { notification } = App.useApp();
  const store = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [patientId, setPatientId] = useState(0);
  const [profileKey, setProfileKey] = useState(0);
  const [pendingPatient, setPendingPatient] = useState<TPatientInformation>();
  const [followUpExam, setFollowUpExam] = useState<TCharges[]>([]);
  const [lastAppointment, setLastAppointment] = useState<TAppointments>();
  const [confirmationModal, setConfirmationModal] = useState(false);

  const patients = useQuery({
    queryKey: ["appointment-patient-search"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetPatients",
        parameters: {},
      });

      return (res?.parameters?.lst ?? []) as TPatientInformation[];
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
    enabled: searchQuery.trim().length > 0,
  });

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return (patients.data ?? [])
      .filter((patient) =>
        [
          patient.Name,
          patient.PatientNo,
          patient.MemberNo,
          patient.ContactNos,
        ].some((value) => value?.toString().toLowerCase().includes(query)),
      )
      .slice(0, 50);
  }, [patients.data, searchQuery]);

  const usePatientForNewAppointment = (patient: TPatientInformation) => {
    setPatientId(patient.Id);
    setProfileKey((key) => key + 1);
    setSearchQuery(
      `${patient.Name ?? ""}${
        patient.PatientNo ? ` - ${patient.PatientNo}` : ""
      }`,
    );
    setSearchOpen(false);
    setConfirmationModal(false);
    setPendingPatient(undefined);
    setFollowUpExam([]);
    setLastAppointment(undefined);
  };

  const selectPatient = async (patient: TPatientInformation) => {
    const followUpRes = await PostData("GetRecords", {
      sp: "udp_GetPatientChargesFollowUp",
      parameters: {
        patientId: patient.Id,
      },
    });
    const pendingFollowUps = (followUpRes?.parameters?.lst ?? []) as TCharges[];

    const lastAppointmentRes = await PostData("GetRecords", {
      sp: "udp_GetLastAppointmentDetails",
      parameters: {
        PatientId: patient.Id,
      },
    });
    const previousAppointment = (lastAppointmentRes?.parameters?.lst?.[0] ??
      undefined) as TAppointments | undefined;

    if (pendingFollowUps.length > 0 || previousAppointment) {
      setPendingPatient(patient);
      setFollowUpExam(pendingFollowUps);
      setLastAppointment(previousAppointment);
      setSearchOpen(false);
      setConfirmationModal(true);
      return;
    }

    usePatientForNewAppointment(patient);
  };

  const continuePreviousAppointment = async () => {
    const appointmentId =
      followUpExam[0]?.fk_Appointments_Id ?? lastAppointment?.Id;
    if (!appointmentId) return;

    const QNo: TQNo | undefined = !isNullOrUndefinedOrBlank(
      sessionStorage.getItem("selectedInReception"),
    )
      ? JSON.parse(sessionStorage.getItem("selectedInReception")!)
      : undefined;

    const res = await PostData("GetRecords", {
      sp: "udp_FollowUpAppointmwents",
      parameters: {
        Id: appointmentId,
        QnoId: QNo?.Id ?? 0,
      },
    });

    if (res) {
      setConfirmationModal(false);
      router.navigate({
        to: "/appointmentdetails/$Id",
        params: {
          Id: appointmentId.toString(),
        },
      });
    }
  };

  const openExistingAppointment = () => {
    if (!lastAppointment?.Id) return;

    sessionStorage.setItem("Id", lastAppointment.Id.toString());
    setConfirmationModal(false);
    router.navigate({
      to: "/appointmentdetails/$Id",
      params: {
        Id: lastAppointment.Id.toString(),
      },
    });
  };

  const clearPatient = () => {
    setSearchQuery("");
    setSearchOpen(false);
    setPatientId(0);
    setProfileKey((key) => key + 1);
    setPendingPatient(undefined);
    setFollowUpExam([]);
    setLastAppointment(undefined);
    setConfirmationModal(false);
  };

  const formatAppointmentDate = (appointment?: TAppointments) => {
    const dateOnly = appointment?.DateOnly?.trim();
    if (dateOnly) return dateOnly;

    const dateStr = appointment?.DateStr?.trim();
    if (dateStr?.length === 8) {
      return `${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}/${dateStr.slice(0, 4)}`;
    }
    if (dateStr) return dateStr;

    return appointment?.Date
      ? dayjs(appointment.Date).format("MM/DD/YYYY")
      : undefined;
  };

  const getAppointmentDateKey = (appointment?: TAppointments) => {
    const dateOnly = appointment?.DateOnly?.trim();
    if (dateOnly) {
      const [month, day, year] = dateOnly.split("/");
      if (month && day && year)
        return `${year}${month.padStart(2, "0")}${day.padStart(2, "0")}`;
    }

    const dateStr = appointment?.DateStr?.trim();
    if (dateStr?.length === 8) return dateStr;

    return appointment?.Date
      ? dayjs(appointment.Date).format("YYYYMMDD")
      : undefined;
  };

  const lastAppointmentDate = formatAppointmentDate(lastAppointment);
  const isLastAppointmentToday =
    getAppointmentDateKey(lastAppointment) === dayjs().format("YYYYMMDD");
  const canContinuePreviousAppointment =
    !!followUpExam[0]?.fk_Appointments_Id || !!lastAppointment?.Id;

  const getAppointmentType = () => {
    const code = localStorage.getItem("code");

    if (code === "ape") return "APE";
    if (code === "amb") return "AMB";
    if (code === "hemo") return "HEM";
    if (code === "consultation") return "CON";
    if (code === "diag" || code === "sc") return "DIA";
    if (code === "ofw") return "OFW";

    return undefined;
  };

  const handleSave = async (values: TPatientInformation) => {
    let appointmentPatientId = patientId;

    if (appointmentPatientId === 0) {
      const patientRes = await PostData("SavePatientProfile", {
        ...values,
        BranchCode: store.branchCode,
        DateOfBirth: dayjs(values.DateOfBirth).format("YYYY-MM-DD"),
        PatientId: 0,
        Company: isNullOrUndefinedOrBlank(values.Company) ? 0 : values.Company,
      });

      if (!patientRes || patientRes.status !== 1) {
        notification.error({
          message: patientRes?.message ?? "Unable to save patient.",
          placement: "topRight",
          duration: 3,
        });
        return;
      }

      appointmentPatientId = Number(patientRes.parameters.Id);
    } else {
      const patientRes = await PostData("SavePatientProfile", {
        ...values,
        BranchCode: store.branchCode,
        DateOfBirth: dayjs(values.DateOfBirth).format("YYYY-MM-DD"),
        PatientId: patientId,
        Company: isNullOrUndefinedOrBlank(values.Company) ? 0 : values.Company,
      });

      if (!patientRes || patientRes.status !== 1) {
        notification.error({
          message: patientRes?.message ?? "Unable to save patient.",
          placement: "topRight",
          duration: 3,
        });
        return;
      }
    }

    const QNo: TQNo | undefined = !isNullOrUndefinedOrBlank(
      sessionStorage.getItem("selectedInReception"),
    )
      ? JSON.parse(sessionStorage.getItem("selectedInReception")!)
      : undefined;

    const appointmentValues: TAppointments = {
      Date: new Date(),
      IsSeniorOrPwd: "N",
      AppointmentType: getAppointmentType(),
      CivilStatus: values.CivilStatus,
      Occupation: values.Occupation,
      HmoCompany: values.Company,
      fk_HmoCompany_Id: values.HMO,
      CountryOfDestination: values.CountryOfDestination,
      PositionAppliedFor: values.PositionAppliedFor,
    };

    const appointmentRes = await saveAppointment({
      values: appointmentValues,
      appointmentId: 0,
      patientId: appointmentPatientId,
      branchCode: store.branchCode,
      qNoId: QNo?.Id,
    });

    if (!appointmentRes || appointmentRes.status !== 1) {
      notification.error({
        message: appointmentRes?.message ?? "Unable to save appointment.",
        placement: "topRight",
        duration: 3,
      });
      return;
    }

    notification.success({
      message: "Appointment successfully saved!",
      placement: "topRight",
      duration: 3,
    });
    sessionStorage.setItem("Id", appointmentRes.parameters.AppointmentId);
    router.navigate({
      to: "/appointmentdetails/$Id",
      params: {
        Id: appointmentRes.parameters.AppointmentId.toString(),
      },
    });
  };

  const patientResults = (
    <div className="w-[min(760px,85vw)]">
      {patients.isLoading ? (
        <div className="flex h-[160px] items-center justify-center">
          <Loading size={48} />
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="flex h-[120px] items-center justify-center text-gray-500">
          No patients found. Enter the patient details below to create one.
        </div>
      ) : (
        <List>
          <VirtualList
            data={filteredPatients}
            height={patientResultsHeight}
            itemHeight={64}
            itemKey="Id"
          >
            {(patient: TPatientInformation) => (
              <List.Item
                key={patient.Id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => selectPatient(patient)}
              >
                <List.Item.Meta
                  title={patient.Name}
                  description={[
                    patient.PatientNo && `Patient No: ${patient.PatientNo}`,
                    patient.MemberNo && `Member No: ${patient.MemberNo}`,
                    patient.DateOfBirth &&
                      `Birth date: ${dayjs(patient.DateOfBirth).format("MM/DD/YYYY")}`,
                  ]
                    .filter(Boolean)
                    .join(" | ")}
                />
              </List.Item>
            )}
          </VirtualList>
        </List>
      )}
    </div>
  );

  return (
    <div className="cardBackGround">
      <Divider>Create/Search Appointment</Divider>

      <div className="mb-4 rounded-md border p-4">
        <div className="mb-2 font-semibold">Search Patient</div>
        <div className="flex items-center gap-3">
          <Popover
            content={patientResults}
            open={searchOpen && searchQuery.trim().length > 0}
            onOpenChange={(open) => {
              if (!open) setSearchOpen(false);
            }}
            trigger={[]}
            placement="bottomLeft"
          >
            <Input
              className="flex-1"
              allowClear
              autoFocus
              placeholder="Search patient by name, patient no., or member no."
              value={searchQuery}
              onChange={(event) => {
                const value = event.target.value;
                if (patientId > 0) {
                  setPatientId(0);
                  setProfileKey((key) => key + 1);
                }
                setSearchQuery(value);
                setSearchOpen(value.trim().length > 0);
              }}
            />
          </Popover>
          <Button onClick={clearPatient}>Clear All</Button>
        </div>
      </div>

      <div className="rounded-md border p-4">
        <PatientProfile
          key={`${patientId}-${profileKey}`}
          Id={patientId}
          embedded
          submitText="Save Appointment"
          handleCloseModal={() => undefined}
          onSubmit={handleSave}
        />
      </div>

      <div className="mt-4 flex justify-center gap-2">
        <Button danger type="primary" onClick={() => router.history.back()}>
          Skip & Back to Reception List
        </Button>
      </div>

      <Modal
        open={confirmationModal}
        onCancel={() => {
          setConfirmationModal(false);
          setPendingPatient(undefined);
        }}
        width={700}
        centered
        footer={
          isLastAppointmentToday
            ? [
                <Button
                  key="open"
                  type="primary"
                  disabled={!lastAppointment?.Id}
                  onClick={openExistingAppointment}
                >
                  Open Existing Appointment
                </Button>,
              ]
            : [
                <Button
                  key="new"
                  onClick={() => {
                    if (pendingPatient) {
                      usePatientForNewAppointment(pendingPatient);
                    }
                  }}
                >
                  Create New Appointment
                </Button>,
                <Button
                  key="continue"
                  type="primary"
                  disabled={!canContinuePreviousAppointment}
                  onClick={continuePreviousAppointment}
                >
                  Continue Previous Appointment
                </Button>,
              ]
        }
      >
        {lastAppointment && (
          <div className="mb-3 rounded-md border bg-gray-50 p-3">
            <div className="font-semibold">Last appointment</div>
            <div>Date: {lastAppointmentDate ?? "-"}</div>
            <div>Appointment No: {lastAppointment.AppointmentNo ?? "-"}</div>
            <div>
              Type:{" "}
              {lastAppointment.AppointmentTypeDesc ??
                lastAppointment.AppointmentType ??
                "-"}
            </div>
          </div>
        )}

        {isLastAppointmentToday ? (
          <p className="mb-0">
            Appointment already exists for today. Open the existing appointment
            to continue.
          </p>
        ) : followUpExam.length > 0 ? (
          <>
            <p className="mb-2">
              This patient has pending follow-up examinations from a previous
              appointment:
            </p>
            <ul className="list-disc pl-5">
              {followUpExam.map((item) => (
                <li key={item.Id}>{item.Description}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mb-0">
            This patient has a previous appointment. Continue it or create a new
            appointment?
          </p>
        )}
      </Modal>
    </div>
  );
}
