import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  AutoComplete,
  Avatar,
  Button,
  DatePicker,
  Divider,
  Dropdown,
  Form,
  Input,
  MenuProps,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Tooltip,
  notification,
} from "antd";
import { PostData, isNullOrUndefinedOrBlank } from "../../helpers";
import {
  TAppointmentType,
  TAppointments,
  TCharges,
  THmoCompany,
  TPatientInformation,
  TQNo,
  TSettings,
} from "../../types";
import { useCallback, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import useAppStore from "../../store";
import ListOfPatients from "../../components/ListOfPatients";
import { BiSearch } from "react-icons/bi";
import Loading from "../../components/loading";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { MdOutlineDelete } from "react-icons/md";
import Webcam from "react-webcam";
import axios from "axios";
import AddCharge from "../../components/AddCharge";
import { FaRegEdit } from "react-icons/fa";
import { ColumnGroup } from "primereact/columngroup";
import { Row } from "primereact/row";
export const Route = createFileRoute("/_authenticated/appointmentdetails/$Id")({
  component: () => <AppointmentDetails />,
});
const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API;
const devApi = import.meta.env.VITE_DEV_API;

const ApiUrl = isDev ? devApi : prodApi;

const AppointmentDetails = () => {
  const q = useQueryClient();
  const [Net, setNet] = useState<number>(0);
  const [qCounters, setQCounters] = useState<MenuProps["items"]>([]);
  const [showAddCharge, setShowAddCharge] = useState(false);
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [showWebCam, setShowWebCam] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const videoConstraints = {
    width: 400,
    height: 400,
    facingMode: "user",
  };

  const [picture, setPicture] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState(null);
  const store = useAppStore();
  const [form] = Form.useForm();
  const [form2] = Form.useForm();
  const [showPatients, setShowPatient] = useState(false);
  const [Id, setId] = useState(Route.useParams().Id);
  const [PatientId, setPatientId] = useState<number>(0);
  const [selectedRecord, setSelectedRecord] = useState<TCharges | undefined>();
  const [showDelete, setShowDelete] = useState(false);
  const [charges, setCharges] = useState<TCharges[] | undefined>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [gender, setGender] = useState("");

  useQuery({
    queryKey: ["patientDetails"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetPatientInformationById",
        parameters: {
          Id: PatientId,
        },
      });
      if (res) {
        const x: TPatientInformation = res.parameters.lst[0];
        form.setFieldsValue({
          PatientNo: x.PatientNo,
          Name: x.Name,
          fk_PatientInformation_Id: PatientId,
        });
        setGender(x.Sex!);
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const appointmentType = useQuery({
    queryKey: ["appointmentType"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetAppointmentType",
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const company = useQuery({
    queryKey: ["company"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetCompany",
        parameters: {},
      });
      if (res) {
        console.log(res);
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  // const hmoCompany = useQuery({
  //   queryKey: ["hmoCompany"],
  //   queryFn: async () => {
  //     const res = await PostData("GetRecords", {
  //       sp: "udp_GetHmoCompany",
  //       parameters: {},
  //     });
  //     if (res) {
  //       return res.parameters.lst;
  //     }
  //   },
  //   refetchOnWindowFocus: false,
  //   staleTime: 0,
  // });

  const referredBy = useQuery({
    queryKey: ["referredBy"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetSettings",
        parameters: { Code: "REFERREDBY" },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  // const paymentTypes = useQuery({
  //   queryKey: ["paymentTypes"],
  //   queryFn: async () => {
  //     let res = await PostData("GetRecords", {
  //       sp: "udp_GetPaymentType",
  //       parameters: {},
  //     });
  //     if (res) {
  //       return res.parameters.lst;
  //     }
  //   },
  //   refetchOnWindowFocus: false,
  // });

  // const handleGetDoctors = async () => {
  //   const res = await PostData("GetRecords", {
  //     sp: "udp_GetDoctors",
  //     parameters: {},
  //   });
  //   if (res) {
  //     setDoctors(res.parameters.lst);
  //   }
  // };

  const occupation = useQuery({
    queryKey: ["occupation"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetOccupation",
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  //udp_CheckListQCounters
  const handlePrintCheckList = async (qCounter: string) => {
    if (qCounter === "*ALL*") {
      qCounters!.forEach(async (e: any) => {
        axios.defaults.headers.common["Authorization"] =
          "Bearer " + store.tokenIdWebCims;
        const url =
          ApiUrl +
          "/api/GenerateReport?ReportName=checklist.rdl&AppointmentId=" +
          Id +
          "&QCounter=" +
          e.label;

        try {
          await axios({
            url: url, //your url
            method: "GET",
            responseType: "blob",
            params: {},
          }).then((response) => {
            let newBlob;
            newBlob = new Blob([response.data], {
              type: "application/pdf",
            });

            const data = window.URL.createObjectURL(newBlob);

            const a = document.createElement("a");

            a.setAttribute("href", data);
            a.setAttribute("target", "_blank");

            a.click();
          });
        } catch (error: any) {
          let errorString = error.response.data;
          errorString = JSON.parse(await error.response.data.text());
          return { Status: 0, Message: errorString.Message };
        }
      });
    } else {
      axios.defaults.headers.common["Authorization"] =
        "Bearer " + store.tokenIdWebCims;
      const url =
        ApiUrl +
        "/api/GenerateReport?ReportName=checklist.rdl&AppointmentId=" +
        Id +
        "&QCounter=" +
        qCounter;

      try {
        await axios({
          url: url, //your url
          method: "GET",
          responseType: "blob",
          params: {},
        }).then((response) => {
          let newBlob;
          newBlob = new Blob([response.data], {
            type: "application/pdf",
          });

          const data = window.URL.createObjectURL(newBlob);

          const a = document.createElement("a");

          a.setAttribute("href", data);
          a.setAttribute("target", "_blank");

          a.click();
        });
      } catch (error: any) {
        let errorString = error.response.data;
        errorString = JSON.parse(await error.response.data.text());
        return { Status: 0, Message: errorString.Message };
      }
    }
  };
  const handlePrintCs = async () => {
    axios.defaults.headers.common["Authorization"] =
      "Bearer " + store.tokenIdWebCims;
    const url =
      ApiUrl + "/api/GenerateReport?ReportName=cs.rdl&AppointmentId=" + Id;

    try {
      await axios({
        url: url, //your url
        method: "GET",
        responseType: "blob",
        params: {},
      }).then((response) => {
        let newBlob;
        newBlob = new Blob([response.data], {
          type: "application/pdf",
        });

        const data = window.URL.createObjectURL(newBlob);

        const a = document.createElement("a");

        a.setAttribute("href", data);
        a.setAttribute("target", "_blank");

        a.click();
      });
    } catch (error: any) {
      let errorString = error.response.data;
      errorString = JSON.parse(await error.response.data.text());
      return { Status: 0, Message: errorString.Message };
    }
  };

  const handlePrintSoa = async () => {
    axios.defaults.headers.common["Authorization"] =
      "Bearer " + store.tokenIdWebCims;
    const url =
      ApiUrl +
      "/api/GenerateReport?ReportName=soa.rdl&AppointmentId=" +
      Id +
      "&BranchCode=" +
      store.branchCode;

    try {
      await axios({
        url: url, //your url
        method: "GET",
        responseType: "blob",
        params: {},
      }).then((response) => {
        let newBlob;
        newBlob = new Blob([response.data], {
          type: "application/pdf",
        });

        const data = window.URL.createObjectURL(newBlob);

        const a = document.createElement("a");

        a.setAttribute("href", data);
        a.setAttribute("target", "_blank");

        a.click();
      });
    } catch (error: any) {
      let errorString = error.response.data;
      errorString = JSON.parse(await error.response.data.text());
      return { Status: 0, Message: errorString.Message };
    }
  };

  const handleGetCharges = async () => {
    try {
      setIsLoading(true);
      const res = await PostData("GetRecords", {
        sp: "udp_GetChargesByAppointmentId",
        parameters: {
          AppointmentId: Id,
        },
      });
      if (res) {
        setCharges(res.parameters.lst);
        setIsLoading(false);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleGetAppointmentDetails = async () => {
    if (Id === "0") {
      form.setFieldsValue({
        Date: dayjs(),
        IsSeniorOrPwd: "N",
      });
    } else {
      sessionStorage.setItem("Id", Id);
      let res = await PostData("GetRecords", {
        sp: "udp_GetAppointmentDetails",
        parameters: {
          Id: Id,
        },
      });
      if (res) {
        const x: TAppointments = res.parameters.lst[0];
        setPatientId(x.fk_PatientInformation_Id!);
        form.setFieldsValue({
          PatientNo: x.PatientNo,
          Name: x.Name,
          Date: dayjs(x.Date),
          AppountmentType: x.AppointmentType,
          CivilStatus: x.CivilStatus,
          ReferredBy: x.ReferredBy,
          QueueNo: x.QueueNo,
          HmoCompany: x.HmoCompany,
          ChiefComplaint: x.ChiefComplaint,
          Diastolic: x.Diastolic,
          Systolic: x.Systolic,
          Rr: x.Rr,
          Hr: x.Hr,
          Pr: x.Pr,
          AppointmentNo: x.AppointmentNo,
          AppointmentType: x.AppointmentType,
          IsSeniorOrPwd: x.IsSeniorOrPwd,
          Occupation: x.Occupation,
        });
      }

      res = await PostData("GetRecords", {
        sp: "udp_GetAppointmentImage",
        parameters: {
          AppointmentId: Id,
        },
      });
      if (res) {
        setPicture(res.parameters.lst[0].Image);
      }
    }
  };
  function blobToBase64(blob: any) {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }
  const handleSubmitForm = async (v: TAppointments) => {
    // if (isNullOrUndefinedOrBlank(picture)) {
    //   notification.error({
    //     message: "Please upload a picture!",
    //     placement: "topRight",
    //     duration: 3,
    //   });
    //   return;
    // }
    const QNo: TQNo = !isNullOrUndefinedOrBlank(
      sessionStorage.getItem("selectedInReception")
    )
      ? JSON.parse(sessionStorage.getItem("selectedInReception")!)
      : undefined;

    const res = await PostData("SaveAppointment", {
      ...v,
      Id: Id,
      Date: dayjs(v.Date).format("YYYY-MM-DD"),
      BranchCode: store.branchCode,
      fk_PatientInformation_Id: PatientId,
      fk_QNo_Id: QNo === undefined ? 0 : QNo.Id,
    });
    if (res) {
      if (res.status === 1) {
        notification.success({
          message: "Appointment successfully saved!",
          placement: "topRight",
          duration: 3,
        });

        setId(res.parameters.AppointmentId);
        sessionStorage.setItem("Id", res.parameters.AppointmentId);
        form.setFieldsValue({
          AppointmentNo: res.parameters.AppointmentNo,
          QueueNo: res.parameters.QueueNo,
        });
        handleUploadPatientPicture(picture);
        router.navigate({
          to: "/appointmentdetails/$Id",
          params: {
            Id: res.parameters.AppointmentId,
          },
        });
      } else {
        notification.error({
          message: res.message,
          placement: "topRight",
          duration: 3,
        });
      }
    }
  };
  const handleUploadPatientPicture = async (image: any) => {
    try {
      const fd = new FormData();

      fd.append("image", image);
      fd.append("AppointmentId", sessionStorage.getItem("Id") as string);
      axios.defaults.headers.common["Authorization"] =
        "Bearer " + store.tokenIdWebCims;
      const url = ApiUrl + "/api/" + "UploadApppointmentPicture";

      await axios({
        method: "post",
        url: url,
        data: fd,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
        .then((res: any) => {
          if (res.data.status === 1) {
            notification.success({
              message: "Image successfully uploaded!",
              placement: "topRight",
              duration: 3,
            });
          } else {
            notification.error({
              message: res.data.message,
              placement: "topRight",
              duration: 3,
            });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (error) {
      console.log(error);
    }
  };
  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();

    if (imageSrc) {
      setPicture(imageSrc);
    }

    setShowWebCam(false);

    // handleUploadPatientPicture(imageSrc);
  }, [webcamRef]);
  const onFilePicked = async (files: any) => {
    if (files[0] === undefined) return false;

    let filename = files[0].name;
    if (filename.lastIndexOf(".") <= 0) {
      notification.error({
        message: "Invalid image file!",
        placement: "topRight",
        duration: 3,
      });
      return;
    }

    if (files[0].size >= 2000000) {
      notification.error({
        message: "File must not be greater than 2MB!",
        placement: "topRight",
        duration: 3,
      });
      return;
    }
    setPicture(URL.createObjectURL(files?.[0]));

    const p = await blobToBase64(files?.[0]);
    if (p) {
      handleUploadPatientPicture(p);
    }
  };
  const handleSelect = async (patientId: number) => {
    setShowPatient(false);
    setPatientId(patientId);
    const res = await PostData("GetRecords", {
      sp: "udp_GetPatientInformationById",
      parameters: {
        Id: patientId,
      },
    });
    if (res) {
      const patientDetails: TPatientInformation = res.parameters.lst[0];
      form.setFieldsValue({
        PatientNo: patientDetails.PatientNo,
        Name: patientDetails.Name,
      });
    }
  };

  const handleEdit = (data: TCharges) => {
    setSelectedRecord(data);
    setShowAddCharge(true);
  };
  const actionBodyTemplate = (data: TCharges) => {
    return (
      <Space>
        <Tooltip title="Edit">
          <FaRegEdit
            onClick={() => {
              handleEdit(data);
              // setShowDelete(true);
            }}
            color="green"
            size="20"
            className="cursor-pointer"
          />
        </Tooltip>
        <Tooltip title="Delete">
          <Popconfirm
            title="Delete this record?"
            okText="Yes"
            cancelText="No"
            onConfirm={handleDelete}
          >
            {/* <Button
              type="primary"
              icon={<MdOutlineDelete />}
              onClick={() => {
                setSelectedRecord(data);
                // setShowDelete(true);
              }}
              danger
            /> */}
            <MdOutlineDelete
              onClick={() => {
                setSelectedRecord(data);
                // setShowDelete(true);
              }}
              color="red"
              size="20"
              className="cursor-pointer"
            />
          </Popconfirm>
        </Tooltip>
      </Space>
    );
  };

  const rowExpansionTemplate = (data: TCharges) => {
    return (
      <div className="p-3">
        <div>Doctor</div>
        <div>
          <strong>{data.DoctorName}</strong>
        </div>
        <div>Hmo/Company</div>
        <div>
          <strong>{data.HmoCompany}</strong>
        </div>
        <div>Added By</div>
        <div>
          <strong>{data.AddedBy}</strong>
        </div>
        <div>Date Added</div>
        <div>
          <strong>{data.DateAdded}</strong>
        </div>
        <div>Updated By</div>
      </div>
    );
  };
  const handleDelete = async () => {
    const res = await PostData("DeleteCharge", {
      Id: selectedRecord!.Id,
      fk_Appointments_Id: selectedRecord?.fk_Appointments_Id,
      Qty: selectedRecord?.Qty,
      fk_Items_Id: selectedRecord?.fk_Items_Id,
    });
    if (res) {
      if (res.status === 1) {
        notification.success({
          message: "Successfully deleted!",
          placement: "topRight",
          duration: 3,
        });
        setShowDelete(false);

        form2.resetFields();
        handleGetCharges();
      } else {
        notification.error({
          message: res.message,
          placement: "topRight",
          duration: 3,
        });
      }
    }
  };
  const handleGetQCounters = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_CheckListQCounters",
      parameters: {
        AppointmentId: Id,
      },
    });
    if (res) {
      // let q: MenuProps["items"] = [] as MenuProps["items"];
      // x.forEach((e: MenuProps["items"]) => {
      //   q.push({
      //     key: e.key!,
      //     label: e.label,
      //   });
      // });
      setQCounters(res.parameters.lst);
    }
  };

  const onMenuClick: MenuProps["onClick"] = ({ key }) => {
    const f: any = qCounters?.filter((f: any) => f.key == key)[0];

    handlePrintCheckList(f.label);
  };
  const formatCurrency = (value: number) => {
    return value.toLocaleString("en-PH");
  };

  const net = () => {
    let total = 0;

    for (let sale of charges!) {
      total += sale.Net!;
    }
    setNet(total);
    return formatCurrency(total);
  };
  const footerGroup = (
    <ColumnGroup>
      <Row>
        <Column
          footer="Totals:"
          colSpan={3}
          footerStyle={{
            textAlign: "right",
            fontWeight: "bold",
          }}
        />
        <Column footer="" />
        <Column footer="" />
        <Column footer="" />
        <Column footer={net} />
      </Row>
    </ColumnGroup>
  );
  useEffect(() => {
    handleGetAppointmentDetails();
    handleGetCharges();
    handleGetQCounters();
    // handleGetDoctors();
  }, []);

  return (
    <div className="cardBackGround">
      <Divider>Appointment Details</Divider>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmitForm}
            scrollToFirstError
          >
            <div className="grid place-items-center">
              <Avatar size={128} src={picture as string} />
              <Space className="mt-2" direction="vertical">
                <Button
                  type="primary"
                  onClick={() => {
                    setShowWebCam(true);
                  }}
                  // disabled={Id === "0"}
                >
                  Capture from Webcam
                </Button>
              </Space>
            </div>
            <div className="grid md:grid-cols-3 gap-2">
              <Form.Item
                name="PatientNo"
                label="Patient No."
                // className="md:w-[120px]"
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Input readOnly />
              </Form.Item>
              <div className="flex justify-start items-center">
                <Tooltip title="Search Patient">
                  <Button
                    type="primary"
                    icon={<BiSearch />}
                    onClick={() => setShowPatient(true)}
                  />
                </Tooltip>
              </div>
            </div>
            <div className="grid lg:grid-cols-3 gap-4">
              <Form.Item name="Name" label="Name" className="col-span-2">
                <Input readOnly />
              </Form.Item>
              <Form.Item
                label="Senior/PWD?"
                name="IsSeniorOrPwd"
                rules={[
                  {
                    required: true,
                    message: "This field is required!",
                  },
                ]}
              >
                <Radio.Group>
                  <Radio value="Y">Yes</Radio>
                  <Radio value="N">No</Radio>
                </Radio.Group>
              </Form.Item>
            </div>
            <div className="grid lg:grid-cols-3 gap-4">
              <Form.Item name="AppointmentNo" label="Appointment No.">
                <Input readOnly className="font-bold" />
              </Form.Item>

              <Form.Item name="Date" label="Date">
                <DatePicker format="MM/DD/YYYY" style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                label="Appointment Type"
                name="AppointmentType"
                rules={[
                  {
                    required: true,
                    message: "Appointment type is required!",
                  },
                ]}
              >
                <Select
                  style={{ width: "100%" }}
                  showSearch
                  allowClear
                  filterOption={(input, option) =>
                    (
                      option!.children
                        ?.toString()
                        .toLocaleLowerCase() as unknown as string
                    ).includes(input.toLocaleLowerCase())
                  }
                >
                  {appointmentType.data &&
                    appointmentType.data.map((d: TAppointmentType) => (
                      <Select.Option
                        key={d.Code}
                        value={d.Code}
                        title={d.Description}
                      >
                        {d.Description}
                      </Select.Option>
                    ))}
                </Select>
              </Form.Item>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Form.Item label="Civil Status" name="CivilStatus">
                <Select
                  style={{ width: "100%" }}
                  showSearch
                  allowClear
                  filterOption={(input, option) =>
                    (
                      option!.children
                        ?.toString()
                        .toLocaleLowerCase() as unknown as string
                    ).includes(input.toLocaleLowerCase())
                  }
                >
                  <Select.Option key="L" value="L" title="Legally Separated">
                    Legally Separated
                  </Select.Option>
                  <Select.Option key="M" value="M" title="Married">
                    Married
                  </Select.Option>
                  <Select.Option key="S" value="S" title="Single">
                    Single
                  </Select.Option>
                  <Select.Option key="W" value="W" title="Widowed">
                    Widowed
                  </Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="ReferredBy"
                label="Referred By"
                normalize={(v) => v.toUpperCase()}
              >
                <AutoComplete
                  filterOption={(inputValue, option) =>
                    option!
                      .value!.toString()
                      .toUpperCase()
                      .indexOf(inputValue.toUpperCase()) !== -1
                  }
                >
                  {referredBy.data &&
                    referredBy.data!.map((v: TSettings) => (
                      <AutoComplete.Option
                        key={v.Id}
                        value={v.Value}
                        title={v.Value}
                      >
                        {v.Value}
                      </AutoComplete.Option>
                    ))}
                </AutoComplete>
              </Form.Item>
            </div>
            {/* <div>
              <Form.Item name="Diagnosis" label="Diagnosis">
                    <Input.TextArea rows={4}/>
              </Form.Item>
            </div> */}

            <div className="grid md:grid-cols-3 gap-4">
              <Form.Item
                name="HmoCompany"
                label="Company"
                className="col-span-2"
              >
                <Select
                  style={{ width: "100%" }}
                  showSearch
                  allowClear
                  filterOption={(input, option) =>
                    (
                      option!.children
                        ?.toString()
                        .toLocaleLowerCase() as unknown as string
                    ).includes(input.toLocaleLowerCase())
                  }
                >
                  {company.data &&
                    company.data.map((d: THmoCompany) => (
                      <Select.Option key={d.Id} value={d.Id} title={d.Name}>
                        {d.Name}
                      </Select.Option>
                    ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="Occupation"
                label="Occupation"
                normalize={(v) => v.toUpperCase()}
              >
                <AutoComplete
                  filterOption={(inputValue, option) =>
                    option!
                      .value!.toString()
                      .toUpperCase()
                      .indexOf(inputValue.toUpperCase()) !== -1
                  }
                >
                  {occupation.data &&
                    occupation.data!.map((v: any) => (
                      <AutoComplete.Option
                        key={v.Value}
                        value={v.Value}
                        title={v.Value}
                      >
                        {v.Value}
                      </AutoComplete.Option>
                    ))}
                </AutoComplete>
              </Form.Item>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Form.Item name="QueueNo" label="Queue No.">
                <Input readOnly className="font-bold" />
              </Form.Item>
              <div className="flex justify-end items-center col-span-2">
                <Button type="primary" htmlType="submit">
                  Submit
                </Button>
              </div>
            </div>
          </Form>
        </div>
        <div>
          <Button
            type="primary"
            onClick={() => {
              setSelectedRecord(undefined);
              setShowAddCharge(true);
            }}
            disabled={Id === "0"}
          >
            Add Charges
          </Button>
          <div className="mt-2">
            {isLoading ? (
              <Loading size={64} />
            ) : (
              <DataTable
                value={charges}
                // paginator
                // rows={10}
                // rowsPerPageOptions={[10, 25, 50]}
                emptyMessage="No Records!"
                stripedRows
                size="small"
                filterDisplay="row"
                rowExpansionTemplate={rowExpansionTemplate}
                expandedRows={expandedRows as any}
                onRowToggle={(e) => setExpandedRows(e.data as any)}
                footerColumnGroup={footerGroup}
              >
                <Column
                  expander={charges!.length > 0}
                  style={{ width: "2rem" }}
                />
                <Column
                  field="action"
                  header="Action"
                  body={(data: any) => actionBodyTemplate(data)}
                ></Column>
                <Column field="Description" header="Description"></Column>
                <Column field="Gross" header="Gross"></Column>
                <Column field="HmoAmount" header="Hmo"></Column>
                <Column field="CashPayment" header="Cash Payment"></Column>
                <Column field="Net" header="Net"></Column>
                <Column field="PaymentType" header="Payment Type"></Column>
              </DataTable>
            )}
            <div className="flex justify-end">
              <Space>
                <Button
                  disabled={charges!.length <= 0}
                  type="primary"
                  onClick={handlePrintCs}
                >
                  Print Charge Slip
                </Button>
                {/* <Button
                  disabled={charges!.length <= 0}
                  type="primary"
                  onClick={handlePrintCheckList}
                >
                  Print Check List
                </Button> */}

                <Button
                  disabled={charges!.length <= 0 || Number(Net) > 0}
                  type="primary"
                  onClick={handlePrintSoa}
                >
                  Print Charge SOA
                </Button>
                <Dropdown
                  menu={{ items: qCounters, onClick: onMenuClick }}
                  disabled={charges!.length <= 0 || Number(Net) > 0}
                >
                  <Button type="primary">Print Checklist</Button>
                </Dropdown>
              </Space>
            </div>
          </div>
        </div>
      </div>
      <Modal
        open={showPatients}
        onCancel={() => setShowPatient(false)}
        width={1200}
        footer={false}
        destroyOnClose
      >
        <ListOfPatients handleSelect={handleSelect} />
      </Modal>
      <Modal
        open={showDelete}
        onCancel={() => setShowDelete(false)}
        okText="Yes"
        cancelText="No"
        onOk={handleDelete}
        title=<p className="font-bold">{selectedRecord?.Description}</p>
      >
        Delete this item?
      </Modal>
      <Modal
        open={showWebCam}
        footer={false}
        onCancel={() => setShowWebCam(false)}
      >
        <Webcam
          audio={false}
          height={400}
          ref={webcamRef}
          width={400}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
        />
        <Button type="primary" onClick={() => handleCapture()} className="mt-2">
          Capture
        </Button>
      </Modal>
      <input
        style={{ display: "none" }}
        ref={fileInput}
        type="file"
        accept=".jpg"
        onChange={(e) => onFilePicked(e.target.files)}
      />
      <Modal
        open={showAddCharge}
        onCancel={() => {
          setShowAddCharge(false);
          handleGetCharges();
          q.invalidateQueries({ queryKey: ["qcounters"] });
          window.location.reload();
        }}
        title="Add Charges"
        footer={false}
        width={screen.width - 80}
        destroyOnClose
      >
        <AddCharge Id={Id} ChargeDetails={selectedRecord} Gender={gender} />
      </Modal>
    </div>
  );
};
