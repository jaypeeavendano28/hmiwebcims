import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AutoComplete,
  Button,
  DatePicker,
  Divider,
  Form,
  Input,
  Radio,
  Modal,
  Select,
  Popover,
  App,
} from 'antd';
import { FC, ReactNode, useEffect, useRef, useState } from 'react';
import { isNullOrUndefinedOrBlank, PostData } from '../helpers';
import { THmoCompany, TPatientInformation, TSettings } from '../types';
import useAppStore from '../store';
import dayjs from 'dayjs';
import Webcam from 'react-webcam';
import { AxiosError } from 'axios';

const sexLabels: Record<string, string> = {
  M: 'Male',
  F: 'Female',
};

const civilStatusLabels: Record<string, string> = {
  D: 'Divorced',
  L: 'Legally Separated',
  M: 'Married',
  S: 'Single',
  W: 'Widowed',
};

const positionAppliedForOptions = [
  { value: 'Deck' },
  { value: 'Catering' },
  { value: 'Engine' },
];

type Props = {
  Id: number;
  handleCloseModal: (PatientNo: string, PatientId: number) => void;
  embedded?: boolean;
  submitText?: string;
  onSubmit?: (values: TPatientInformation) => void | Promise<void>;
  formHeader?: ReactNode;
};
// const isDev = import.meta.env.DEV;
// const prodApi = import.meta.env.VITE_PROD_API;
// const devApi = import.meta.env.VITE_DEV_API;

// const ApiUrl = isDev ? devApi : prodApi;
const PatientProfile: FC<Props> = ({
  Id,
  handleCloseModal,
  embedded = false,
  submitText = 'Submit',
  onSubmit,
  formHeader,
}) => {
  // const [patientId, setPatientId] = useState(Id);
  // const [picture, setPicture] = useState<string | null>(null);
  const q = useQueryClient();
  const { notification } = App.useApp();
  const webcamRef = useRef<Webcam>(null);
  const [showWebCam, setShowWebCam] = useState(false);
  const store = useAppStore();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const videoConstraints = {
    width: 400,
    height: 400,
    facingMode: 'user',
  };
  const city = useQuery({
    queryKey: ['city'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetSettings',
        parameters: {
          Code: 'CITY',
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
    queryKey: ['barangay'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetSettings',
        parameters: {
          Code: 'BARANGAY',
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const PlaceOfBirth = useQuery({
    queryKey: ['PlaceOfBirth'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetSettings',
        parameters: {
          Code: 'PLACEOFBIRTH',
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const Nationality = useQuery({
    queryKey: ['Nationality'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetSettings',
        parameters: {
          Code: 'NATIONALITY',
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const CountryOfDestination = useQuery({
    queryKey: ['CountryOfDestination'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetSettings',
        parameters: {
          Code: 'COUNTRYOFDESTINATION',
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const Religion = useQuery({
    queryKey: ['Religion'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetSettings',
        parameters: {
          Code: 'RELIGION',
        },
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const company = useQuery({
    queryKey: ['company'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetCompany',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const hmo = useQuery({
    queryKey: ['hmo'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetHmo',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const occupation = useQuery({
    queryKey: ['occupation'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetOccupation',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const handleSubmitForm = async (v: TPatientInformation) => {
    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(v);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    const res = await PostData('SavePatientProfile', {
      ...v,
      BranchCode: store.branchCode,
      DateOfBirth: dayjs(v.DateOfBirth).format('YYYY-MM-DD'),
      PatientId: sessionStorage.getItem('PatientId'),
      Company: isNullOrUndefinedOrBlank(v.Company) ? 0 : v.Company,
    });

    if (res) {
      setIsSubmitting(false);

      if (res.status === 1) {
        notification.success({
          message: 'Successfully saved!',
          placement: 'topRight',
          duration: 3,
        });
        form.setFieldValue('Id', res.parameters.Id);
        sessionStorage.setItem('PatientId', res.parameters.Id);
        // setPatientId(res.parameters.Id);

        handleCloseModal(res.parameters.PatientNo, Number(res.parameters.Id));
      } else {
        notification.error({
          message: res.message,
          placement: 'topRight',
          duration: 3,
        });
      }
    }
  };
  const handleGetDetails = async () => {
    if (Id > 0) {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetPatientInformationById',
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
          Sex: x.Sex ? sexLabels[x.Sex] ?? x.Sex : x.Sex,
          MemberNo: x.MemberNo,
          ContactNos: x.ContactNos,
          Occupation: x.Occupation,
          Company: x.Company,
          PlaceOfBirth: x.PlaceOfBirth,
          Nationality: x.Nationality,
          CivilStatus: x.CivilStatus
            ? civilStatusLabels[x.CivilStatus] ?? x.CivilStatus
            : x.CivilStatus,
          Religion: x.Religion,
          PassportNo: x.PassportNo,
          SeamanBookNo: x.SeamanBookNo,
          CountryOfDestination: x.CountryOfDestination,
          PositionAppliedFor: x.PositionAppliedFor,
          HMO: x.HMO,
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

  const content = (type: 'C' | 'H') => {
    const [formCompany] = Form.useForm();
    const handleSubmitForm = async () => {
      try {
        setIsSubmitting(true);
        const res = await PostData('SaveHmoCompany', {
          Name: formCompany.getFieldValue('Name'),
          Type: type,
          Balance: 0,
        });
        if (res) {
          if (res.status === 1) {
            notification.success({
              message: 'Successfully saved!',
              placement: 'topRight',
              duration: 3,
            });
            formCompany.resetFields();
            if (type === 'C') {
              q.invalidateQueries({ queryKey: ['company'] });
            } else {
              q.invalidateQueries({ queryKey: ['hmo'] });
            }
            setIsSubmitting(false);
          } else {
            notification.error({
              message: res.message,
              placement: 'topRight',
              duration: 3,
            });
            setIsSubmitting(false);
          }
        }
      } catch (error: AxiosError | any) {
        notification.error({
          message: error.response?.data,
          placement: 'topRight',
          duration: 3,
        });
      }
    };
    return (
      <div>
        <Form
          form={formCompany}
          layout="vertical"
          onFinish={() => handleSubmitForm()}
        >
          <Form.Item
            name="Name"
            label="Company Name"
            rules={[
              {
                required: true,
                message: 'Company Name is required!',
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form>
      </div>
    );
  };
  useEffect(() => {
    handleGetDetails();
  }, []);
  return (
    <div className={embedded ? '' : 'cardBackGround'}>
      {!embedded && <Divider>Patient Profile</Divider>}
      <Form form={form} layout="vertical" onFinish={handleSubmitForm}>
        {formHeader}
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
                  message: 'Lastname is required!',
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
                  message: 'Firstname is required!',
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
                  message: 'Date of birth is required!',
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
                  message: 'Gender is required!',
                },
              ]}
            >
              <Radio.Group>
                <Radio value="Male">Male</Radio>
                <Radio value="Female">Female</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item name="MemberNo" label="Member No.">
              <Input />
            </Form.Item>
            <Form.Item name="ContactNos" label="Contact Nos.">
              <Input />
            </Form.Item>
          </div>
          <div>
            {/* <Form.Item
              name="Street"
              label="Street"
              className="col-span-2"
              normalize={(v) => v.toUpperCase()}
            >
              <Input />
            </Form.Item> */}
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
                  message: 'City/Municipality is required!',
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
            <Form.Item name="Barangay" label="Barangay">
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

          <div className="grid grid-cols-12 gap-4">
            <Form.Item name="HMO" label="HMO" className="col-span-5">
              <Select
                style={{ width: '100%' }}
                showSearch
                allowClear
                filterOption={(input, option) =>
                  String(option?.title ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {hmo.data?.map((d: THmoCompany) => (
                  <Select.Option key={d.Id} value={d.Id} title={d.Name}>
                    {d.Name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <div className="flex justify-start items-center">
              <Popover
                content={content('H')}
                title="New Company/HMO"
                trigger="click"
              >
                <Button type="primary">New</Button>
              </Popover>
            </div>
            <Form.Item name="Company" label="Company" className="col-span-5">
              <Select
                showSearch
                allowClear
                filterOption={(input, option) =>
                  String(option?.title ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {company.data
                  ?.filter((d: THmoCompany) => d.Type === 'C')
                  .map((d: THmoCompany) => (
                    <Select.Option key={d.Id} value={d.Id} title={d.Name}>
                      {d.Name}
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>

            <div className="flex flex-col justify-center">
              <Popover
                content={content('C')}
                title="New Company"
                trigger="click"
              >
                <Button type="primary">New</Button>
              </Popover>
            </div>
            <Form.Item
              name="PlaceOfBirth"
              label="Place OF Birth"
              className="col-span-3"
            >
              <AutoComplete
                filterOption={(inputValue, option) =>
                  option!
                    .value!.toString()
                    .toUpperCase()
                    .indexOf(inputValue.toUpperCase()) !== -1
                }
              >
                {PlaceOfBirth.data &&
                  PlaceOfBirth.data!.map((v: TSettings) => (
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
              name="Nationality"
              label="Nationality"
              className="col-span-3"
            >
              <AutoComplete
                filterOption={(inputValue, option) =>
                  option!
                    .value!.toString()
                    .toUpperCase()
                    .indexOf(inputValue.toUpperCase()) !== -1
                }
              >
                {Nationality.data &&
                  Nationality.data!.map((v: TSettings) => (
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
              name="CivilStatus"
              label="Civil Status"
              className="col-span-3"
              rules={[
                {
                  required: true,
                  message: 'Civil Status is required!',
                },
              ]}
            >
              <Select
                style={{ width: '100%' }}
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
                <Select.Option key="Divorced" value="Divorced" title="Divorced">
                  Divorced
                </Select.Option>
                <Select.Option
                  key="Legally Separated"
                  value="Legally Separated"
                  title="Legally Separated"
                >
                  Legally Separated
                </Select.Option>
                <Select.Option key="Married" value="Married" title="Married">
                  Married
                </Select.Option>
                <Select.Option key="Single" value="Single" title="Single">
                  Single
                </Select.Option>
                <Select.Option key="Widowed" value="Widowed" title="Widowed">
                  Widowed
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="Religion" label="Religion" className="col-span-3">
              <AutoComplete
                filterOption={(inputValue, option) =>
                  option!
                    .value!.toString()
                    .toUpperCase()
                    .indexOf(inputValue.toUpperCase()) !== -1
                }
              >
                {Religion.data &&
                  Religion.data!.map((v: TSettings) => (
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
              name="PassportNo"
              label="Passport No."
              className="col-span-3"
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="SeamanBookNo"
              label="Seaman's Book No."
              className="col-span-3"
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="Occupation"
              label="Occupation"
              className="col-span-3"
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
            <Form.Item
              name="CountryOfDestination"
              label="Country Of Destination"
              className="col-span-3"
            >
              <AutoComplete
                filterOption={(inputValue, option) =>
                  option!
                    .value!.toString()
                    .toUpperCase()
                    .indexOf(inputValue.toUpperCase()) !== -1
                }
              >
                {CountryOfDestination.data &&
                  CountryOfDestination.data!.map((v: TSettings) => (
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
              name="PositionAppliedFor"
              label="Position Applied For"
              className="col-span-3"
              normalize={(v) => v.toUpperCase()}
            >
              <AutoComplete
                options={positionAppliedForOptions}
                filterOption={(inputValue, option) =>
                  option!
                    .value!.toString()
                    .toUpperCase()
                    .indexOf(inputValue.toUpperCase()) !== -1
                }
              />
            </Form.Item>
          </div>

          <div className="flex justify-end">
            <Button type="primary" htmlType="submit" loading={isSubmitting}>
              {submitText}
            </Button>
          </div>
        </div>
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
