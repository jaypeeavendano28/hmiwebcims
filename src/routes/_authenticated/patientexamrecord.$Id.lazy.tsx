import { createLazyFileRoute } from '@tanstack/react-router';
import {
  App,
  AutoComplete,
  Avatar,
  Button,
  Card,
  Divider,
  Form,
  Input,
  Select,
  Tag,
  TimePicker,
} from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { useEffect, useState } from 'react';
import {
  TAppointments,
  TBranches,
  TCharges,
  TDoctors,
  TPatientExaminationRecord,
} from '../../types';
import { PostData } from '../../helpers';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useQuery } from '@tanstack/react-query';
import useAppStore from '../../store';
import dayjs from 'dayjs';
import Loading from '../../components/loading';
import axios from 'axios';

export const Route = createLazyFileRoute(
  '/_authenticated/patientexamrecord/$Id',
)({
  component: () => <PatientExaminationRecord />,
});

type PatExamFieldType = {
  processedBy: string;
  therapist: string;
  msu: string;
  reqPhysician: number;
  diagnosis: string;
  opanOr: string;
  timeIn: string;
  timeOut: string;
  remarks: string;
};

const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API;
const devApi = import.meta.env.VITE_DEV_API;
const apiUrl = isDev ? devApi : prodApi;

const PatientExaminationRecord = () => {
  const { Id } = Route.useParams();
  const [picture, setPicture] = useState<string | null>(null);
  const [appointmentDetails, setAppointmentDetails] = useState<
    TAppointments | undefined
  >();
  const [charges, setCharges] = useState<TCharges[] | undefined>([]);
  const store = useAppStore();
  const { notification, message } = App.useApp();
  const [isProcessing, setIsProccessing] = useState(false);
  const [form] = Form.useForm();

  const branches = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await PostData('GetRecords2', {
        sp: 'udp_GetBranches',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const doctors = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const res = await PostData('GetRecords2', {
        sp: 'udp_GetDoctors',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const { data: patientExamDetails, isLoading } = useQuery({
    queryKey: ['patient_examination_record', Id],
    queryFn: async () =>
      await PostData('GetRecords', {
        sp: 'udp_GetPatientExamination',
        parameters: {
          AppointmentId: Id,
        },
      }).then((res) => res.parameters.lst[0] as TPatientExaminationRecord),
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  useEffect(() => {
    if (patientExamDetails) {
      form.setFieldsValue({
        processedBy: patientExamDetails.fk_Branches_Code,
        therapist: patientExamDetails.Therapist,
        msu: patientExamDetails.Msu,
        reqPhysician: patientExamDetails.fk_Doctors_Id,
        diagnosis: patientExamDetails.Diagnosis,
        opanOr: patientExamDetails.OrNo,
        timeIn: patientExamDetails.TimeIn
          ? dayjs(patientExamDetails.TimeIn, 'HH:mm')
          : undefined,
        timeOut: patientExamDetails.TimeOut
          ? dayjs(patientExamDetails.TimeOut, 'HH:mm')
          : undefined,
        remarks: patientExamDetails.Remarks,
      });
    }
  }, [patientExamDetails]);

  const handleGetAppoinmentDetails = async () => {
    try {
      let res = await PostData('GetRecords', {
        sp: 'udp_GetAppointmentDetails',
        parameters: {
          Id: Id,
        },
      });
      if (res) {
        const x: TAppointments = res.parameters.lst[0];
        setAppointmentDetails(x);
      }

      res = await PostData('GetRecords', {
        sp: 'udp_GetAppointmentImage',
        parameters: {
          AppointmentId: Id,
        },
      });
      if (res) {
        setPicture(res.parameters.lst[0].Image);
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 3,
      });
    }
  };

  const handleGetCharges = async () => {
    try {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetChargesByAppointmentId',
        parameters: {
          AppointmentId: Id,
        },
      });
      if (res) {
        setCharges(res.parameters.lst);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSave = async (values: PatExamFieldType) => {
    try {
      setIsProccessing(true);
      const payload: TPatientExaminationRecord = {
        Id: patientExamDetails ? patientExamDetails.Id : 0,
        fk_Appointments_Id: parseInt(Id),
        fk_Branches_Code: values.processedBy,
        Therapist: values.therapist,
        Msu: values.msu,
        fk_Doctors_Id: values.reqPhysician,
        Diagnosis: values.diagnosis,
        OrNo: values.opanOr,
        TimeIn: values.timeIn
          ? dayjs(values.timeIn).format('HH:mm')
          : undefined,
        TimeOut: values.timeOut
          ? dayjs(values.timeOut).format('HH:mm')
          : undefined,
        Remarks: values.remarks,
      };
      const res = await PostData('SavePatientExaminationRecord', payload);

      if (res.status === 1) {
        notification.success({
          message: 'Successfully saved!',
          placement: 'topRight',
          duration: 3,
        });
      } else {
        notification.error({
          message: res.message,
          placement: 'topRight',
          duration: 3,
        });
      }
    } catch (error) {
      console.log(error);
      message.error('An error occurred while submitting the form.');
    } finally {
      setIsProccessing(false);
    }
  };

  useEffect(() => {
    handleGetAppoinmentDetails();
    handleGetCharges();
  }, []);

  const handlePrint = async () => {
    axios.defaults.headers.common['Authorization'] =
      'Bearer ' + store.tokenIdWebCims;

    const url = apiUrl + '/api/GenerateReport';
    try {
      setIsProccessing(true);
      await axios({
        url: url,
        method: 'GET',
        responseType: 'blob',
        params: {
          ReportName: 'PatientExamination.rdl',
          AppointmentId: Id,
          BranchCode: store.branchCode,
        },
      }).then((response) => {
        let newBlob;
        newBlob = new Blob([response.data], {
          type: 'application/pdf',
        });

        const data = window.URL.createObjectURL(newBlob);

        const a = document.createElement('a');

        a.setAttribute('href', data);
        a.setAttribute('target', '_blank');

        a.click();
        // setIsSubmitting(false);
      });
    } catch (error: any) {
      // setIsSubmitting(false);
      let errorString = error.response.data;
      errorString = JSON.parse(await error.response.data.text());
      return { Status: 0, Message: errorString.Message };
    } finally {
      setIsProccessing(false);
    }
  };

  return appointmentDetails === undefined ? (
    <div>Appointment record not found!</div>
  ) : (
    <>
      <Divider orientation="left" orientationMargin="0" className="m-0!">
        {' '}
        <h1 className="font-medium text-lg">Patient Examination Record</h1>
      </Divider>
      <div className="grid gap-3 lg:grid-cols-3 items-start">
        <Card className="">
          <div className="flex lg:flex-col lg:items-center gap-x-2">
            <Avatar size={100} src={picture as string} />
            <div className="space-y-1 ">
              <div className="lg:text-center">
                <h4 className="font-bold lg:text-center">
                  {appointmentDetails?.Name}
                </h4>
                <Tag>ID: {appointmentDetails?.fk_PatientInformation_Id}</Tag>
              </div>
              <div className="flex leading-tight gap-x-2 lg:gap-x-5">
                <div className="lg:text-right">
                  <div>HMO:</div>
                  <div>Contact No.:</div>
                  <div>Appointment Type:</div>
                </div>
                <div className="font-bold">
                  <div>{appointmentDetails?.HmoCompanyName ?? '-'}</div>
                  <div>{appointmentDetails?.ContactNos ?? '-'}</div>
                  <div>{appointmentDetails?.AppointmentTypeDesc ?? '-'}</div>
                </div>
              </div>
            </div>
          </div>
          <div className=" border mt-5">
            <DataTable value={charges} emptyMessage="No Records!" size="small">
              <Column
                field="Description"
                header="Examination"
                className="py-0 leading-normal"
              />
              <Column
                field="Status"
                header="Status"
                body={(rowData) => rowData.Status ?? '-'}
                className="py-0 leading-normal"
              />
            </DataTable>
          </div>
        </Card>
        <Card className="lg:col-span-2">
          {/* <Divider>Patient Examination Record</Divider> */}
          {isLoading ? (
            <Loading size={64} />
          ) : (
            <Form
              form={form}
              labelCol={{
                style: {
                  width: 150,
                },
              }}
              onFinish={handleSave}
              labelAlign="left"
              initialValues={{
                processedBy: store.branchCode,
              }}
            >
              <Form.Item<PatExamFieldType>
                label="Processed By"
                name="processedBy"
              >
                <Select
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  loading={branches.isLoading}
                  options={branches.data?.map((d: TBranches) => ({
                    value: d.Code,
                    label: d.Name,
                  }))}
                />
              </Form.Item>
              <div className="grid grid-cols-2 gap-x-5">
                <Form.Item<PatExamFieldType> label="Therapist" name="therapist">
                  <AutoComplete />
                </Form.Item>
                <Form.Item<PatExamFieldType>
                  labelCol={{
                    style: {
                      width: 85,
                    },
                  }}
                  labelAlign="left"
                  label="MSU"
                  name="msu"
                >
                  <AutoComplete />
                </Form.Item>
              </div>
              <Form.Item<PatExamFieldType>
                label="Requesting Physician"
                name="reqPhysician"
              >
                {/* <Select
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
                  {doctors &&
                    doctors.data.map((d: TDoctors) => (
                      <Select.Option
                        key={d.Id}
                        value={d.Id}
                        title={d.NameAndSpecialty}
                      >
                        {d.NameAndSpecialty}
                      </Select.Option>
                    ))}
                </Select> */}
                <Select
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  loading={doctors.isLoading}
                  options={doctors.data?.map((d: TDoctors) => ({
                    value: d.Id,
                    label: d.NameAndSpecialty,
                  }))}
                />
              </Form.Item>
              <div className="grid grid-cols-2 gap-x-5">
                <Form.Item<PatExamFieldType>
                  label="Diagnosis"
                  name="diagnosis"
                  labelAlign="left"
                  labelCol={{
                    style: {
                      width: 85,
                    },
                  }}
                >
                  <Input />
                </Form.Item>
                <Form.Item<PatExamFieldType>
                  labelCol={{
                    style: {
                      width: 85,
                    },
                  }}
                  labelAlign="left"
                  label="OPAN/OR#"
                  name="opanOr"
                >
                  <Input />
                </Form.Item>
                <Form.Item<PatExamFieldType>
                  labelCol={{
                    style: {
                      width: 85,
                    },
                  }}
                  labelAlign="left"
                  label="Time-in"
                  name="timeIn"
                >
                  <TimePicker use12Hours needConfirm={false} format="h:mm A" />
                </Form.Item>
                <Form.Item<PatExamFieldType>
                  labelCol={{
                    style: {
                      width: 85,
                    },
                  }}
                  labelAlign="left"
                  label="Time-out"
                  name="timeOut"
                >
                  <TimePicker use12Hours needConfirm={false} format="h:mm A" />
                </Form.Item>
              </div>
              <Form.Item<PatExamFieldType>
                labelCol={{
                  style: {
                    width: 85,
                  },
                }}
                labelAlign="left"
                label="Remarks"
                name="remarks"
              >
                <TextArea rows={6} />
              </Form.Item>

              <div className="flex justify-end gap-x-2">
                <Button loading={isProcessing} onClick={handlePrint}>
                  Print
                </Button>
                <Button htmlType="submit" type="primary" loading={isProcessing}>
                  Save
                </Button>
              </div>
            </Form>
          )}
        </Card>
      </div>
    </>
  );
};
