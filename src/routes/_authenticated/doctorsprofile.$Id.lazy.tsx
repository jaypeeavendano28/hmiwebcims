
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import {
  AutoComplete,
  Button,
  Checkbox,
  Form,
  Input,
  notification,
} from "antd";
import { PostData } from "../../helpers";
import { useEffect, useState } from "react";
import { TDoctors } from "../../types";
import axios from "axios";
import useAppStore from "../../store";
import SignatureBuilder from "../../components/SignatureBuilder";

export const Route = createLazyFileRoute("/_authenticated/doctorsprofile/$Id")({
  component: () => <DoctorProfile />,
});
const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API + "/api";
const devApi = import.meta.env.VITE_DEV_API + "/api";
const apiUrl = isDev ? devApi : prodApi;

const DoctorProfile = () => {
  const params = Route.useParams();
  const [Id, setId] = useState(params.Id);
  const [form] = Form.useForm();

  const store = useAppStore()
  const [picture, setPicture] = useState<string | null>(null);
  const doctorName = Form.useWatch("Name", form);
  const doctorLicenseNo = Form.useWatch("LicNo", form);
  const doctorTitle = Form.useWatch("Title", form);
  const specialty = useQuery({
    queryKey: ["specialty"],
    queryFn: async () => {
      const res = await PostData("GetRecords", {
        sp: "udp_GetSpecialty",
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
  const handleUploadPicture = async (image: any) => {
    try {
      const fd = new FormData();

      fd.append("image", image);
      fd.append("Id",Id);
      axios.defaults.baseURL = apiUrl;
      axios.defaults.headers.common["Authorization"] = ("Bearer " +
       store.tokenIdWebCims) as string;
      const res = await axios({
        method: "post",
        url: apiUrl + "/UploadDoctorSignature",
        data: fd,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.status === 1) {
        setPicture(image);
        notification.success({
          message: "Successfully saved!",
          placement: "topRight",
          duration: 3,
        });
        return true;
      }

      notification.error({
        message: res.data.message,
        placement: "topRight",
        duration: 3,
      });
      return false;
    } catch (error) {
      console.log(error);
      return false;
    }
  };
  const saveDoctorProfile = async (
    values: TDoctors,
    showSuccessNotification = true
  ) => {
    try {
      const res = await PostData("SaveDoctorProfile", {...values,Type:"DOC"});
      if (res) {
        if (res.status === 1) {
          setId(res.parameters.Id);
          if (showSuccessNotification) {
            notification.success({
              message: "Successfully saved!",
              placement: "topRight",
              duration: 3,
            });
          }
          form.setFieldValue("Id",res.parameters.Id)
          return true;
        } else {
          notification.error({
            message: res.message,
            placement: "topRight",
            duration: 3,
          });
        }
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: "topRight",
        duration: 3,
      });
    }
    return false;
  };

  const handleSubmitForm = async (values: TDoctors) => {
    await saveDoctorProfile(values);
  };

  const handleSaveSignature = async (image: string) => {
    try {
      const values = await form.validateFields();
      const saved = await saveDoctorProfile(values, false);

      if (!saved) {
        return false;
      }

      return handleUploadPicture(image);
    } catch (error: any) {
      notification.error({
        message: error.message ?? "Please complete the profile before saving signature.",
        placement: "topRight",
        duration: 3,
      });
      return false;
    }
  };
  const handleGetDoctorsProfile = async()=>{
     try {
        let res = await PostData("GetRecords", {
          sp: "udp_GetDoctorById",
          parameters: {Id},
        });
        if (res) {
          const x:TDoctors = res.parameters.lst[0];
          form.setFieldsValue({
            Id: x.Id,
            Name: x.Name,
            Lastname: x.Lastname,
            Firstname: x.Firstname,
            Middlename: x.Middlename,
            Suffix: x.Suffix,
            Specialty: x.Specialty,
            PhicNo: x.PhicNo,
            LicNo: x.LicNo,
            Title: x.Title ?? "PHYSICIAN",
            Tin: x.Tin,
            Sonologist: x.Sonologist,
            Pathologist: x.Pathologist,
            Cardiologist: x.Cardiologist,
          });

             res = await PostData("GetRecords", {
              sp: "udp_GetDoctorSignature",
              parameters: { Id },
            });
            if (res) {
         
              setPicture(res.parameters.lst[0].Signature);
            }
        }

      
     } catch (error:any) {
        notification.error({
          message: error.message,
          placement: "topRight",
          duration: 3,
        });
     }
  }
  useEffect(() => {
    if (Id === "0") {
      form.setFieldsValue({
        Id: "0",
        Sonologist: false,
        Pathologist: false,
        Title: "PHYSICIAN",
      });
    } else {
      handleGetDoctorsProfile();
    }
  },[]);
  return (
    <div className="cardBackGround">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Form form={form} onFinish={handleSubmitForm} layout="vertical">
            <Form.Item name="Id" label="Id">
              <Input readOnly />
            </Form.Item>
            <Form.Item
              name="Name"
              label="Name"
              normalize={(v) => v.toUpperCase()}
              rules={[
                {
                  required: true,
                  message: "Name is required!",
                },
              ]}
            >
              <Input autoFocus />
            </Form.Item>
            <Form.Item
              name="Lastname"
              label="Lastname"
              normalize={(v) => v.toUpperCase()}
              rules={[
                {
                  required: true,
                  message: "Lastname is required!",
                },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="Firstname"
              label="Firstname"
              normalize={(v) => v.toUpperCase()}
              rules={[
                {
                  required: true,
                  message: "Firstname is required!",
                },
              ]}
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
            <Form.Item
              name="Specialty"
              label="Specialty"
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
                {specialty.data &&
                  specialty.data!.map((v: any) => (
                    <AutoComplete.Option
                      key={v.Id}
                      value={v.specialty}
                      title={v.specialty}
                    >
                      {v.specialty}
                    </AutoComplete.Option>
                  ))}
              </AutoComplete>
            </Form.Item>
            <Form.Item name="LicNo" label="License No.">
              <Input />
            </Form.Item>
            <Form.Item
              name="Title"
              label="Position/Title"
              normalize={(v) => v.toUpperCase()}
            >
              <Input />
            </Form.Item>
            <Form.Item name="PhicNo" label="Phic No.">
              <Input />
            </Form.Item>

            <Form.Item
              name="Sonologist"
              label="Sonologist"
              extra="Check if sonologist"
              valuePropName="checked"
            >
              <Checkbox />
            </Form.Item>
            <Form.Item
              name="Pathologist"
              label="Pathologist"
              extra="Check if pathologist"
              valuePropName="checked"
            >
              <Checkbox />
            </Form.Item>
            <Form.Item
              name="Cardiologist"
              label="Cardiologist"
              extra="Check if cardiologist"
              valuePropName="checked"
            >
              <Checkbox />
            </Form.Item>
            <div className="flex justify-end">
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </div>
          </Form>
        </div>
        <div>
          <SignatureBuilder
            currentImage={picture}
            disabled={Id === "0"}
            fullName={doctorName}
            licenseNo={doctorLicenseNo}
            positionTitle={doctorTitle}
            defaultTitle="PHYSICIAN"
            onLicenseNoChange={(value) => form.setFieldValue("LicNo", value)}
            onTitleChange={(value) => form.setFieldValue("Title", value)}
            onSave={handleSaveSignature}
          />
        </div>
      </div>
    </div>
  );
};
