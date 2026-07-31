import { createLazyFileRoute } from "@tanstack/react-router";
import { Button, Checkbox, Form, Input, notification } from "antd";
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
export const Route = createLazyFileRoute("/_authenticated/medtech/$Id")({
  component: () => <MedtechProfile />,
});

const MedtechProfile = () => {
  const params = Route.useParams();
  const [Id, setId] = useState(params.Id);
  const [form] = Form.useForm();
  const store = useAppStore();
  const [picture, setPicture] = useState<string | null>(null);
  const [qaPicture, setQaPicture] = useState<string | null>(null);
  const medtechName = Form.useWatch("Name", form);
  const medtechLicenseNo = Form.useWatch("LicenseNo", form);
  const medtechTitle = Form.useWatch("Title", form);
  const isQA = Form.useWatch("IsQA", form);

  const handleUploadPicture = async (
    image: string,
    signatureType: "M" | "Q" = "M",
  ) => {
    try {
      const fd = new FormData();

      fd.append("image", image);
      fd.append("Id", Id);
      fd.append("SignatureType", signatureType);
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
        if (signatureType === "Q") {
          setQaPicture(image);
        } else {
          setPicture(image);
        }
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
  const saveMedtechProfile = async (
    values: TMedtechs,
    showSuccessNotification = true
  ) => {
    try {
      const res = await PostData("SaveMedtech", {
        ...values,
        Type: "M",
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
    await saveMedtechProfile(values);
  };

  const handleSaveSignature = async (image: string) => {
    try {
      const values = await form.validateFields();
      const saved = await saveMedtechProfile(values, false);

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

  const handleSaveQaSignature = async (image: string) => {
    try {
      const values = await form.validateFields();
      const saved = await saveMedtechProfile(values, false);

      if (!saved) {
        return false;
      }

      return handleUploadPicture(image, "Q");
    } catch (error: any) {
      notification.error({
        message:
          error.message ??
          "Please complete the profile before saving the quality control signature.",
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
          Title: x.Title ?? "MEDICAL TECHNOLOGIST",
          IsQA: Boolean(x.IsQA),
        });

        res = await PostData("GetRecords", {
          sp: "udp_GetMedtechSignature",
          parameters: { Id, SignatureType: "M" },
        });
        if (res) {
          setPicture(res.parameters.lst?.[0]?.Signature ?? null);
        }

        res = await PostData("GetRecords", {
          sp: "udp_GetMedtechSignature",
          parameters: { Id, SignatureType: "Q" },
        });
        if (res) {
          setQaPicture(res.parameters.lst?.[0]?.Signature ?? null);
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
        Title: "MEDICAL TECHNOLOGIST",
        IsQA: false,
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
            <Form.Item name="IsQA" valuePropName="checked">
              <Checkbox>Quality Control</Checkbox>
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
            title="Medical Technologist E-Sign"
            currentImage={picture}
            disabled={Id === "0"}
            fullName={medtechName}
            licenseNo={medtechLicenseNo}
            positionTitle={medtechTitle}
            defaultTitle="MEDICAL TECHNOLOGIST"
            onLicenseNoChange={(value) =>
              form.setFieldValue("LicenseNo", value)
            }
            onTitleChange={(value) => form.setFieldValue("Title", value)}
            onSave={handleSaveSignature}
          />
          {isQA && (
            <SignatureBuilder
              title="Quality Control E-Sign"
              buttonLabel="Create QC e-sign"
              currentImage={qaPicture}
              disabled={Id === "0"}
              fullName={medtechName}
              licenseNo={medtechLicenseNo}
              positionTitle="QUALITY CONTROL"
              defaultTitle="QUALITY CONTROL"
              titleReadOnly
              onLicenseNoChange={(value) =>
                form.setFieldValue("LicenseNo", value)
              }
              onSave={handleSaveQaSignature}
            />
          )}
        </div>
      </div>
    </div>
  );
};
