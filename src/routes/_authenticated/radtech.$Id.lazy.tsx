import { createLazyFileRoute } from "@tanstack/react-router";
import {
  Button,
  Form,
  Input,
  notification,
  Select,
} from "antd";
import { PostData } from "../../helpers";
import { useEffect, useState } from "react";
import { TMedtechs } from "../../types";
import axios from "axios";
import useAppStore from "../../store";
import SignatureBuilder from "../../components/SignatureBuilder";
const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API + "/api";
const devApi = import.meta.env.VITE_DEV_API + "/api";
const apiUrl = isDev ? devApi : prodApi;

export const Route = createLazyFileRoute("/_authenticated/radtech/$Id")({
  component: () => <RadtechProfile />,
});

const RadtechProfile = () => {
  const params = Route.useParams();
  const [Id, setId] = useState(params.Id);
  const [form] = Form.useForm();
  const store = useAppStore();
  const [picture, setPicture] = useState<string | null>(null);
  const radtechName = Form.useWatch("Name", form);
  const radtechLicenseNo = Form.useWatch("LicenseNo", form);
  const radtechTitle = Form.useWatch("Title", form);

  const handleUploadPicture = async (image: any) => {
    try {
      const fd = new FormData();

      fd.append("image", image);
      fd.append("Id", Id);
      axios.defaults.baseURL = apiUrl;
      axios.defaults.headers.common["Authorization"] = ("Bearer " +
        store.tokenIdWebCims) as string;

      const res = await axios({
        method: "post",
        url: apiUrl + "/UploadMedtechSignature",
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
  const saveRadtechProfile = async (
    values: TMedtechs,
    showSuccessNotification = true
  ) => {
    try {
      const res = await PostData("SaveMedtech", {
        ...values,
        Type: values.Department,
      });
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
          form.setFieldValue("Id", res.parameters.Id);
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

  const handleSubmitForm = async (values: TMedtechs) => {
    await saveRadtechProfile(values);
  };

  const handleSaveSignature = async (image: string) => {
    try {
      const values = await form.validateFields();
      const saved = await saveRadtechProfile(values, false);

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
  const handleGetMedtechProfile = async () => {
    try {
      let res = await PostData("GetRecords", {
        sp: "udp_GetMedtechProfile",
        parameters: { Id },
      });
      if (res) {
        const x: TMedtechs = res.parameters.lst[0];
        form.setFieldsValue({
          Id: x.Id,
          Name: x.Name,
          LicenseNo: x.LicenseNo,
          Title: x.Title ?? "RADIOLOGIC TECHNOLOGIST",
          Department: x.Type ?? x.Department,
        });

        res = await PostData("GetRecords", {
          sp: "udp_GetMedtechSignature",
          parameters: { Id },
        });
        if (res) {
          setPicture(res.parameters.lst[0].Signature);
        }
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: "topRight",
        duration: 3,
      });
    }
  };

  useEffect(() => {
    if (Id === "0") {
      form.setFieldsValue({
        Id: "0",
        Sonologist: false,
        Pathologist: false,
        Title: "RADIOLOGIC TECHNOLOGIST",
      });
    } else {
      handleGetMedtechProfile();
    }
  }, []);
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
            <Form.Item name="LicenseNo" label="License No.">
              <Input />
            </Form.Item>
            <Form.Item
              name="Title"
              label="Position/Title"
              normalize={(v) => v.toUpperCase()}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="Department"
              label="Department"
              rules={[
                {
                  required: true,
                  message: "Department is required!",
                },
              ]}
            >
              <Select>
                <Select.Option key="R" value="R">
                  X-Ray
                </Select.Option>
                <Select.Option key="U" value="U">
                  Ultrasound
                </Select.Option>
              </Select>
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
            fullName={radtechName}
            licenseNo={radtechLicenseNo}
            positionTitle={radtechTitle}
            defaultTitle="RADIOLOGIC TECHNOLOGIST"
            onLicenseNoChange={(value) =>
              form.setFieldValue("LicenseNo", value)
            }
            onTitleChange={(value) => form.setFieldValue("Title", value)}
            onSave={handleSaveSignature}
          />
        </div>
      </div>
    </div>
  );
};
