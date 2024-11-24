import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import {
  AutoComplete,
  Button,
  Checkbox,
  Divider,
  Form,
  Image,
  Input,
  notification,
} from "antd";
import { PostData } from "../../helpers";
import { useEffect, useRef, useState } from "react";
import { TDoctors } from "../../types";
import axios from "axios";
import useAppStore from "../../store";

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
  const fileInput = useRef<HTMLInputElement | null>(null);
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
    function blobToBase64(blob: any) {
      return new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    }
  const handleUploadPicture = async (image: any) => {
    try {
      const fd = new FormData();

      fd.append("image", image);
      fd.append("Id",Id);
      axios.defaults.baseURL = apiUrl;
      axios.defaults.headers.common["Authorization"] = ("Bearer " +
       store.tokenIdWebCims) as string;
      console.log(apiUrl  + "/UploadDoctorSignature");
      console.log(apiUrl);
      await axios({
        method: "post",
        url: apiUrl + "/UploadDoctorSignature",
        data: fd,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
        .then((res: any) => {
          if (res.data.status === 1) {
            notification.success({
              message: "Successfully saved!",
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
        handleUploadPicture(p);
      }
    };
  const handleSubmitForm = async (values: TDoctors) => {
    try {
      const res = await PostData("SaveDoctorProfile", {...values,Type:"DOC"});
      if (res) {
        if (res.status === 1) {
          setId(res.parameters.Id);
          notification.success({
            message: "Successfully saved!",
            placement: "topRight",
            duration: 3,
          });
          form.setFieldValue("Id",res.parameters.Id)
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
            Tin: x.Tin,
            Sonologist: x.Sonologist,
            Pathologist: x.Pathologist,
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


    const handleSelectImage = () => {
      fileInput.current?.click();
    };
  useEffect(() => {
    if (Id === "0") {
      form.setFieldsValue({
        Id: "0",
        Sonologist: false,
        Pathologist: false,
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
            <div className="flex justify-end">
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </div>
          </Form>
        </div>
        <div>
          <Divider>Signature</Divider>
          <div className="flex justify-center">
            <Image
              // size={128}
              // width={200}
              // src="https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png"
              src={picture as string}
              preview={false}
            />
          </div>

          <div className="flex justify-center mt-2">
            <Button
              type="primary"
              onClick={() => handleSelectImage()}
              disabled={Id === "0"}
            >
              Upload from computer
            </Button>
          </div>
        </div>
      </div>
      <input
        style={{ display: "none" }}
        ref={fileInput}
        type="file"
        accept=".jpg"
        onChange={(e) => onFilePicked(e.target.files)}
      />
    </div>
  );
};
