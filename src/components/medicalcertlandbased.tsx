import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, DatePicker, Form, Radio, Select } from 'antd';
import { PostData } from '../helpers';
import { TAppointments, TDoctors, TMedicalCertificateLandBase } from '../types';
import dayjs from 'dayjs';
import axios, { AxiosError } from 'axios';
import useAppStore from '../store';

type Props = {
  AppointmentId: number;
};

const formatDatePayload = (value: any) =>
  value ? dayjs(value).format('YYYY-MM-DD') : null;

const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API;
const devApi = import.meta.env.VITE_DEV_API;
const apiUrl = isDev ? devApi : prodApi;

export default function MedicalCertificateLand({ AppointmentId }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notification } = App.useApp();
  const store = useAppStore();
  const [form] = Form.useForm();
  const [hasSavedData, setHasSavedData] = useState(false);
  const doctors = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
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

  const appointmentDetails = useQuery({
    queryKey: ['appointmentDetails'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetAppointmentDetails',
        parameters: {
          Id: AppointmentId,
        },
      });
      if (res) {
        form.setFieldsValue({
          PassportNo: res.parameters.lst[0].PassportNo,
        });
        return res.parameters.lst[0] as TAppointments;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
  const queryClient = useQueryClient();
  useQuery({
    queryKey: ['medicalCertificate'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_MedicalCertificateLandBased',
        parameters: {
          AppointmentId: AppointmentId,
        },
      });
      if (res) {
        if (res.parameters.lst.length > 0) {
          setHasSavedData(true);
          const data = res.parameters.lst[0];
          form.setFieldsValue({
            ...res.parameters.lst[0],
            DateOfExpiration: data.DateOfExpiration
              ? dayjs(data.DateOfExpiration)
              : null,
            DateOfExamination: data.DateOfExamination
              ? dayjs(data.DateOfExamination)
              : null,
            DateOfAssuancePemeCert: data.DateOfAssuancePemeCert
              ? dayjs(data.DateOfAssuancePemeCert)
              : null,
            DateOfPatientSignature: data.DateOfPatientSignature
              ? dayjs(data.DateOfPatientSignature)
              : null,
          });
        } else {
          form.setFieldsValue({
            DateOfExpiration: dayjs().add(3, 'month'),
            SatisfactoryHearing: 'Y',
            SatisfactorySight: 'Y',
            SatisfactoryColorVision: 'Y',
            SatisfactoryPsycho: 'Y',
            IsApplicantSuffering: 'N',
            Result: 'F',
            PassportNo: appointmentDetails.data?.PassportNo,
            DateOfExamination: dayjs(),
            DateOfAssuancePemeCert: dayjs(),
            DateOfPatientSignature: dayjs(),
          });
        }
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  async function handleSubmit(values: TMedicalCertificateLandBase) {
    try {
      setIsSubmitting(true);
      const res = await PostData('SaveMedicalCertificateLandBased', {
        ...values,
        fk_Appointments_Id: AppointmentId,
        DateOfExpiration: formatDatePayload(values.DateOfExpiration),
        DateOfExamination: formatDatePayload(values.DateOfExamination),
        DateOfAssuancePemeCert: formatDatePayload(
          values.DateOfAssuancePemeCert,
        ),
        DateOfPatientSignature: formatDatePayload(
          values.DateOfPatientSignature,
        ),
      });
      if (res.status === 1) {
        setHasSavedData(true);
        queryClient.invalidateQueries({
          queryKey: ['medicalCertificate'],
        });
        setIsSubmitting(false);
        notification.success({
          message: 'Successully Saved!',
          placement: 'topRight',
          duration: 2,
        });
      } else {
        notification.error({
          message: res.message,
          placement: 'topRight',
          duration: 3,
        });
      }
    } catch (error: AxiosError | any) {
      setIsSubmitting(false);
      notification.error({
        message: error.response?.data,
        placement: 'topRight',
        duration: 3,
      });
    }
  }

  const handlePrint = async () => {
    axios.defaults.headers.common['Authorization'] =
      'Bearer ' + store.tokenIdWebCims;

    const url = apiUrl + '/api/GenerateReport';
    try {
      setIsSubmitting(true);
      await axios({
        url: url, //your url
        method: 'GET',
        responseType: 'blob',
        params: {
          ReportName: 'MedCertLandBased.rdl',
          AppointmentId: AppointmentId,
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
        setIsSubmitting(false);
      });
    } catch (error: any) {
      setIsSubmitting(false);
      let errorString = error.response.data;
      errorString = JSON.parse(await error.response.data.text());
      return { Status: 0, Message: errorString.Message };
    }
  };

  return (
    <>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div className="grid grid-cols-4 gap-4">
          <Form.Item name="SatisfactoryHearing" label="Satisfactory Hearing?">
            <Radio.Group>
              <Radio value="Y">Yes</Radio>
              <Radio value="N">No</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="SatisfactorySight" label="Satisfactory Sight?">
            <Radio.Group>
              <Radio value="Y">Yes</Radio>
              <Radio value="N">No</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="SatisfactoryColorVision"
            label="Satisfactory Color Vision?"
          >
            <Radio.Group>
              <Radio value="Y">Yes</Radio>
              <Radio value="N">No</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="SatisfactoryPsycho"
            label="Satisfactory Psychological Test?"
          >
            <Radio.Group>
              <Radio value="Y">Yes</Radio>
              <Radio value="N">No</Radio>
            </Radio.Group>
          </Form.Item>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <Form.Item
            name="IsApplicantSuffering"
            label="Is the applicant suffering from any medical condition?"
            className="col-span-2"
          >
            <Radio.Group>
              <Radio value="Y">Yes</Radio>
              <Radio value="N">No</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="Result" label="Result">
            <Radio.Group>
              <Radio value="F">Fit</Radio>
              <Radio value="U">Unfit</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="DateOfExamination" label="Date Of Examination">
            <DatePicker format={'MM/DD/YYYY'} />
          </Form.Item>
          <Form.Item
            name="DateOfAssuancePemeCert"
            label="Date of Issuance of PEME Certificate"
          >
            <DatePicker format={'MM/DD/YYYY'} />
          </Form.Item>{' '}
          <Form.Item
            name="DateOfExpiration"
            label="Date Of Expiration of PEME Certificate"
          >
            <DatePicker format={'MM/DD/YYYY'} />
          </Form.Item>
          <Form.Item
            name="DateOfPatientSignature"
            label="Date Of Patient Signature"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <DatePicker format={'MM/DD/YYYY'} />
          </Form.Item>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <Form.Item
            label="Doctor"
            name="Doctor"
            className="col-span-2"
            rules={[
              {
                required: true,
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
              {doctors.data &&
                doctors.data.map((d: TDoctors) => (
                  <Select.Option
                    key={d.Id}
                    value={d.Id}
                    title={d.NameAndSpecialty}
                  >
                    {d.NameAndSpecialty}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Approved By"
            name="ApprovedBy"
            rules={[
              {
                required: true,
              },
            ]}
            className="col-span-2"
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
              {doctors.data &&
                doctors.data.map((d: TDoctors) => (
                  <Select.Option
                    key={d.Id}
                    value={d.Id}
                    title={d.NameAndSpecialty}
                  >
                    {d.NameAndSpecialty}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            Submit
          </Button>
          <Button
            type="primary"
            loading={isSubmitting}
            disabled={!hasSavedData}
            onClick={handlePrint}
          >
            Print
          </Button>
        </div>
      </Form>
    </>
  );
}
