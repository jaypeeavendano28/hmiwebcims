import { useQuery } from "@tanstack/react-query";
import {
  AutoComplete,
  Button,
  DatePicker,
  Divider,
  Form,
  Input,
  Radio,
  notification,
  Modal,
} from "antd";
import { FC, useEffect, useRef, useState } from "react";
import { PostData } from "../helpers";
import { TPatientInformation, TSettings } from "../types";
import useAppStore from "../store";
import dayjs from "dayjs";
import Webcam from "react-webcam";
type Props = {
  Id: number;
  handleCloseModal: (PatientNo: string) => void;
};
// const isDev = import.meta.env.DEV;
// const prodApi = import.meta.env.VITE_PROD_API;
// const devApi = import.meta.env.VITE_DEV_API;

// const ApiUrl = isDev ? devApi : prodApi;
const PatientProfile: FC<Props> = ({ Id, handleCloseModal }) => {
  // const [patientId, setPatientId] = useState(Id);
  // const [picture, setPicture] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);
  const [showWebCam, setShowWebCam] = useState(false);
  const store = useAppStore();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoConstraints = {
    width: 400,
    height: 400,
    facingMode: "user",
  };
  const city = useQuery({
    queryKey: ["city"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetSettings",
        parameters: {
          Code: "CITY",
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const barangay = useQuery({
    queryKey: ["barangay"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetSettings",
        parameters: {
          Code: "BARANGAY",
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const handleSubmitForm = async (v: TPatientInformation) => {
    setIsSubmitting(true);
    const res = await PostData("SavePatientProfile", {
      ...v,
      BranchCode: store.branchCode,
      DateOfBirth: dayjs(v.DateOfBirth).format("YYYY-MM-DD"),
      PatientId: sessionStorage.getItem("PatientId"),
    });
    if (res) {
      setIsSubmitting(false);

      if (res.status === 1) {
        notification.success({
          message: "Successfully saved!",
          placement: "topRight",
          duration: 3,
        });
        form.setFieldValue("Id", res.parameters.Id);
        sessionStorage.setItem("PatientId", res.parameters.Id);
        // setPatientId(res.parameters.Id);

        handleCloseModal(res.parameters.PatientNo);
      } else {
        notification.error({
          message: res.message,
          placement: "topRight",
          duration: 3,
        });
      }
    }
  };
  const handleGetDetails = async () => {
    if (Id > 0) {
      const res = await PostData("GetRecords", {
        sp: "udp_GetPatientInformationById",
        parameters: {
          Id,
        },
      });
      if (res) {
        const x: TPatientInformation = res.parameters.lst[0];
        form.setFieldsValue({
          Id: Id,
          PatientNo: x.PatientNo,
          Lastname: x.Lastname,
          Firstname: x.Firstname,
          Middlename: x.Middlename,
          Suffix: x.Suffix,
          Street: x.Street,
          City: x.City,
          Barangay: x.Barangay,
          DateOfBirth: dayjs(x.DateOfBirth),
          Sex: x.Sex,
          MemberNo: x.MemberNo,
          ContactNos: x.ContactNos,
          Occupation: x.Occupation,
        });
      }
    } else {
      form.setFieldsValue({
        Id: 0,
      });
    }

    // const resPic = await PostData("GetRecordsImages", {
    //   sp: "udp_GetPatientPicture",
    //   parameters: {
    //     PatientId: sessionStorage.getItem("PatientId"),
    //   },
    // });
    // if (resPic) {
    //   setPicture(resPic.parameters.lst[0].Image);
    // }
  };
  // const handleUploadPatientPicture = async (image: any) => {
  //   try {
  //     const fd = new FormData();

  //     fd.append("image", image);
  //     fd.append("PatientId", sessionStorage.getItem("PatientId") as string);
  //     axios.defaults.baseURL = ApiUrl;
  //     axios.defaults.headers.common["Authorization"] = ("Bearer " +
  //       Cookies.get("WebCimsTokenId")) as string;

  //     await axios({
  //       method: "post",
  //       url: ApiUrl + "/api/" + "UploadPatientPicture",
  //       data: fd,
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //       },
  //     })
  //       .then((res: any) => {
  //         if (res.data.status === 1) {
  //           notification.success({
  //             message: "Successfully saved!",
  //             placement: "topRight",
  //             duration: 3,
  //           });
  //         } else {
  //           notification.error({
  //             message: res.data.message,
  //             placement: "topRight",
  //             duration: 3,
  //           });
  //         }
  //       })
  //       .catch((err) => {
  //         console.log(err);
  //       });
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };
  // const handleCapture = useCallback(() => {
  //   const imageSrc = webcamRef.current?.getScreenshot();

  //   if (imageSrc) {
  //     setPicture(imageSrc);
  //   }

  //   setShowWebCam(false);

  //   handleUploadPatientPicture(imageSrc);
  // }, [webcamRef]);
  useEffect(() => {
    handleGetDetails();
  }, []);
  return (
    <div className="cardBackGround">
      <Divider>Patient Profile</Divider>
      <Form form={form} layout="vertical" onFinish={handleSubmitForm}>
        <div className="col-span-2">
          <div className="grid md:grid-cols-2 gap-4">
            <Form.Item name="Id" label="Patient Id">
              <Input readOnly />
            </Form.Item>
            <Form.Item name="PatientNo" label="Patient No.">
              <Input readOnly />
            </Form.Item>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <Form.Item
              name="Lastname"
              label="Lastname"
              rules={[
                {
                  required: true,
                  message: "Lastname is required!",
                },
              ]}
              normalize={(v) => v.toUpperCase()}
            >
              <Input autoFocus />
            </Form.Item>
            <Form.Item
              name="Firstname"
              label="Firstname"
              rules={[
                {
                  required: true,
                  message: "Firstname is required!",
                },
              ]}
              normalize={(v) => v.toUpperCase()}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="Middlename"
              label="Middlename"
              normalize={(v) => v.toUpperCase()}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="Suffix"
              label="Suffix"
              normalize={(v) => v.toUpperCase()}
            >
              <Input />
            </Form.Item>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <Form.Item
              name="DateOfBirth"
              label="Date Of Birth"
              rules={[
                {
                  required: true,
                  message: "Date of birth is required!",
                },
              ]}
            >
              <DatePicker format="MM/DD/YYYY" />
            </Form.Item>
            <Form.Item
              name="Sex"
              label="Gender"
              rules={[
                {
                  required: true,
                  message: "Gender is required!",
                },
              ]}
            >
              <Radio.Group>
                <Radio value="M">Male</Radio>
                <Radio value="F">Female</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="MemberNo" label="Member No.">
              <Input />
            </Form.Item>
            <Form.Item name="ContactNos" label="Contact Nos.">
              <Input />
            </Form.Item>
          </div>
          {/* <div className="grid md:grid-cols-4 gap-4">
            <Form.Item
              name="Occupation"
              label="Occupation"
              className="col-span-2"
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
          </div> */}
          <div className="grid md:grid-cols-4 gap-4">
            <Form.Item
              name="Street"
              label="Street"
              className="col-span-2"
              normalize={(v) => v.toUpperCase()}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="City"
              label="City/Municipality"
              normalize={(v) => v.toUpperCase()}
              rules={[
                {
                  required: true,
                  message: "City/Municipality is required!",
                },
              ]}
            >
              <AutoComplete
                filterOption={(inputValue, option) =>
                  option!
                    .value!.toString()
                    .toUpperCase()
                    .indexOf(inputValue.toUpperCase()) !== -1
                }
              >
                {city.data &&
                  city.data!.map((v: TSettings) => (
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
            <Form.Item
              name="Barangay"
              label="Barangay"
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
                {barangay.data &&
                  barangay.data!.map((v: TSettings) => (
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
          <div className="flex justify-end">
            <Button type="primary" htmlType="submit" loading={isSubmitting}>
              Submit
            </Button>
          </div>
        </div>
        {/* <div>
            <Divider>Patient Picture</Divider>
            <div className="grid place-items-center">
              <Avatar
                size={256}
                // width={200}
                // src="https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png"
                src={picture as string}
              />
              <Space className="mt-2" direction="vertical">
                <Button
                  type="primary"
                  onClick={() => {
                    setShowWebCam(true);
                  }}
                  disabled={patientId <= 0}
                >
                  Capture from Webcam
                </Button>
              </Space>
            </div>
          </div> */}
      </Form>
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
        {/* <Button type="primary" onClick={() => handleCapture()} className="mt-2">
          Capture
        </Button> */}
      </Modal>
    </div>
  );
};

export default PatientProfile;
