import { createFileRoute, useRouter } from '@tanstack/react-router';
import { PostData, WithAccess } from '../../../helpers';
import { TBranches } from '../../../types';
import { useEffect, useRef, useState } from 'react';
import { Button, Divider, Form, Image, Input, notification } from 'antd';
import Cookies from 'js-cookie';
import axios from 'axios';
import useAppStore from '../../../store';
const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API + '/api/';
const devApi = import.meta.env.VITE_DEV_API + '/api/';
const apiUrl = isDev ? devApi : prodApi;

export const Route = createFileRoute('/_authenticated/branchprofile/$code')({
  component: () => <BranchProfile />,
});

const BranchProfile = () => {
  const store = useAppStore();

  const fileInput = useRef<HTMLInputElement | null>(null);
  const fileInputWatermark = useRef<HTMLInputElement | null>(null);

  const [picture, setPicture] = useState<string | null>(null);
  const [waterMark, setWaterMark] = useState<string | null>(null);

  const router = useRouter();
  const [form] = Form.useForm();
  const { code } = Route.useParams();
  const handleGetDetails = async () => {
    let res = await PostData('GetRecords', {
      sp: 'udp_GetBranchDetails',
      parameters: {
        BranchCode: code,
      },
    });
    if (res) {
      const x: TBranches = res.parameters.lst[0];
      form.setFieldsValue({
        Code: x.Code,
        Name: x.Name,
        AddressLine1: x.AddressLine1,
        AddressLine2: x.AddressLine2,
        AddressLine3: x.AddressLine3,
        AddressLine4: x.AddressLine4,
        DohAccreditationNo: x.DohAccreditationNo,
      });
    }
    res = await PostData('GetRecordsImages', {
      sp: 'udp_GetBranchHeader',
      parameters: {
        Code: code,
      },
    });
    if (res) {
      setPicture(res.parameters.lst[0].Image);
    }

    res = await PostData('GetRecordsImages', {
      sp: 'udp_GetBranchWatermark',
      parameters: {
        Code: code,
      },
    });
    if (res) {
      setWaterMark(res.parameters.lst[0].Image);
    }
  };
  const handleSubmitForm = async (v: TBranches) => {
    const res = await PostData('SaveBranchProfile', v);
    if (res) {
      if (res.status === 1) {
        notification.success({
          message: 'Successfully saved!',
          placement: 'topRight',
          duration: 3,
        });
        router.navigate({
          to: '/branches',
        });
      } else {
        notification.error({
          message: res.message,
          placement: 'topRight',
          duration: 3,
        });
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

  const handleUploadHeader = async (image: any) => {
    try {
      const fd = new FormData();

      fd.append('image', image);
      fd.append('Code', code);
      axios.defaults.baseURL = apiUrl;
      axios.defaults.headers.common['Authorization'] = ('Bearer ' +
        Cookies.get('WebCimsTokenId')) as string;

      await axios({
        method: 'post',
        url: 'UploadBranchHeader',
        data: fd,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
        .then((res: any) => {
          if (res.data.status === 1) {
            notification.success({
              message: 'Successfully saved!',
              placement: 'topRight',
              duration: 3,
            });
          } else {
            notification.error({
              message: res.data.message,
              placement: 'topRight',
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

  const handleUploadWatermark = async (image: any) => {
    try {
      const fd = new FormData();

      fd.append('image', image);
      fd.append('Code', code);
      axios.defaults.baseURL = apiUrl;
      axios.defaults.headers.common['Authorization'] = ('Bearer ' +
        Cookies.get('WebCimsTokenId')) as string;

      await axios({
        method: 'post',
        url: 'UploadBranchWatermark',
        data: fd,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
        .then((res: any) => {
          if (res.data.status === 1) {
            notification.success({
              message: 'Successfully saved!',
              placement: 'topRight',
              duration: 3,
            });
          } else {
            notification.error({
              message: res.data.message,
              placement: 'topRight',
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
    if (filename.lastIndexOf('.') <= 0) {
      notification.error({
        message: 'Invalid image file!',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    if (files[0].size >= 2000000) {
      notification.error({
        message: 'File must not be greater than 2MB!',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }
    setPicture(URL.createObjectURL(files?.[0]));

    const p = await blobToBase64(files?.[0]);
    if (p) {
      handleUploadHeader(p);
    }
  };
  const handleWithAccess = async () => {
    const res = await WithAccess({
      sp: 'udp_WithAccess',
      parameters: {
        Username: store.username,
        ModuleId: 5,
      },
    });
    if (res) {
      if (res.status === 0) {
        notification.error({
          message: 'Access denied for module-Branches-Edit',
          placement: 'topRight',
          duration: 3,
        });
        router.navigate({
          to: '/',
        });
      }
    }
  };
  const handleSelectImage = () => {
    fileInput.current?.click();
  };
  const handleSelectImageWatermark = () => {
    fileInputWatermark.current?.click();
  };
  const onFilePickedWatermark = async (files: any) => {
    if (files[0] === undefined) return false;

    let filename = files[0].name;
    if (filename.lastIndexOf('.') <= 0) {
      notification.error({
        message: 'Invalid image file!',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    if (files[0].size >= 2000000) {
      notification.error({
        message: 'File must not be greater than 2MB!',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }
    setWaterMark(URL.createObjectURL(files?.[0]));

    const p = await blobToBase64(files?.[0]);
    if (p) {
      handleUploadWatermark(p);
    }
  };
  useEffect(() => {
    store.setHideSideBar('N');
    handleWithAccess();
    handleGetDetails();
  }, []);

  return (
    <div className="cardBackGround">
      <div className="p-2">
        <Divider>Branch Profile</Divider>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Form form={form} layout="vertical" onFinish={handleSubmitForm}>
              <Form.Item name="Code" label="Code">
                <Input readOnly />
              </Form.Item>
              <Form.Item
                name="Name"
                label="Name"
                rules={[
                  {
                    required: true,
                    message: 'Name is required!',
                  },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="AddressLine1"
                label="Address Line 1"
                rules={[
                  {
                    required: true,
                    message: 'Address line 1 is required!',
                  },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="AddressLine2" label="Address Line 2">
                <Input />
              </Form.Item>
              <Form.Item name="AddressLine3" label="Address Line 3">
                <Input />
              </Form.Item>
              <Form.Item name="AddressLine4" label="Address Line 4">
                <Input />
              </Form.Item>
              <Form.Item
                name="DohAccreditationNo"
                label="DOH Accreditation No."
              >
                <Input />
              </Form.Item>
              <div className="flex justify-end">
                <Button type="primary" htmlType="submit">
                  Submit
                </Button>
              </div>
            </Form>
          </div>
          <div>
            <Divider>Header</Divider>
            <div className="text-center">
              <Image src={picture!} />
            </div>
            <div className="mt-5">
              <Button type="primary" onClick={() => handleSelectImage()}>
                Upload from computer
              </Button>
              <input
                style={{ display: 'none' }}
                ref={fileInput}
                type="file"
                accept=".jpg"
                onChange={(e) => onFilePicked(e.target.files)}
              />
            </div>

            <Divider>Watermark</Divider>
            <div className="text-center">
              <Image src={waterMark!} />
            </div>
            <div className="mt-5">
              <Button
                type="primary"
                onClick={() => handleSelectImageWatermark()}
              >
                Upload from computer
              </Button>
              <input
                style={{ display: 'none' }}
                ref={fileInputWatermark}
                type="file"
                accept=".jpg"
                onChange={(e) => onFilePickedWatermark(e.target.files)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
