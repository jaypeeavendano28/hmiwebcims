import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
import {
  TAppointments,
  TDoctors,
  TMedicalCertificateLandBase,
  TSettings,
} from '../../types';
import { useQuery } from '@tanstack/react-query';
import { PostData, WithAccess } from '../../helpers';
import dayjs from 'dayjs';
import {
  App,
  AutoComplete,
  Button,
  DatePicker,
  Divider,
  Form,
  Input,
  Radio,
  Select,
} from 'antd';
import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import useAppStore from '../../store';

export const Route = createLazyFileRoute(
  '/_authenticated/medicalcertland/$AppointmentId',
)({
  component: () => <MedicalCertificateLand />,
});

function MedicalCertificateLand() {
  const router = useRouter();
  const store = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notification } = App.useApp();
  const { AppointmentId } = Route.useParams();
  const [form] = Form.useForm();

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

  const PositionAppliedFor = useQuery({
    queryKey: ['PositionAppliedFor'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetSettings',
        parameters: {
          Code: 'POSITIONAPPLIEDFOR',
        },
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
          form.setFieldsValue({
            ...res.parameters.lst[0],
            DateOfExpiration: dayjs(res.parameters.lst[0].DateOfExpiration),
          });
        } else {
          form.setFieldsValue({
            DateOfExpiration: dayjs(appointmentDetails.data?.Date).add(
              1,
              'month',
            ),
            SatisfactoryHearing: 'Y',
            SatisfactorySight: 'Y',
            SatisfactoryColorVision: 'Y',
            SatisfactoryPsycho: 'Y',
            IsApplicantSuffering: 'N',
            Result: 'F',
            PassportNo: appointmentDetails.data?.PassportNo,
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
      });
      if (res.status === 1) {
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

  const handleWithAccess = async (ModuleId: number, Description: string) => {
    const res = await WithAccess({
      sp: 'udp_WithAccess',
      parameters: {
        Username: store.username,
        ModuleId: ModuleId,
      },
    });
    if (res) {
      if (res.status === 0) {
        notification.error({
          message: 'Access denied for module-' + Description,
          placement: 'topRight',
          duration: 3,
        });
        router.navigate({
          to: '/',
        });
      }
    }
  };

  useEffect(() => {
    handleWithAccess(62, 'Medical Certificate OFW-Landbased');
  }, []);
  return (
    <>
      <div className="grid grid-cols-8 gap-4">
        <div>
          <div>Appointment No.</div>
          <div className="font-semibold">
            {appointmentDetails.data?.AppointmentNo}
          </div>
        </div>

        <div>
          <div>Appointment Date</div>
          <div className="font-semibold">
            {dayjs(appointmentDetails.data?.Date).format('MM/DD/YYYY')}
          </div>
        </div>
        <div className="col-span-2">
          <div>Name</div>
          <div className="font-semibold ">{appointmentDetails.data?.Name}</div>
        </div>
        <div>
          <div>Date of Birth</div>
          <div className="font-semibold ">
            {appointmentDetails.data?.DateOfBirthStr}
          </div>
        </div>
        <div>
          <div>Age</div>
          <div className="font-semibold ">
            {appointmentDetails.data?.AgeYears}
          </div>
        </div>
        <div>
          <div>Sex</div>
          <div className="font-semibold ">{appointmentDetails.data?.Sex}</div>
        </div>
        <div>
          <div>Religion</div>
          <div className="font-semibold ">
            {appointmentDetails.data?.Religion}
          </div>
        </div>
      </div>
      <Divider>Medical Certificate Landbased</Divider>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div className="grid grid-cols-4 gap-4">
          <Form.Item
            name="PassportNo"
            label="Passport No."
            rules={[
              {
                required: true,
                message: 'Passport no. is required!',
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="CountryOfDestination"
            label="Country Of Destination"
            rules={[
              {
                required: true,
                message: 'Country Of Destination is required!',
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
            rules={[
              {
                required: true,
                message: 'Position applied for is required!',
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
              {PositionAppliedFor.data &&
                PositionAppliedFor.data!.map((v: TSettings) => (
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
          <Form.Item name="Employer" label="Employer">
            <Input />
          </Form.Item>
        </div>
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
          <Form.Item name="DateOfExpiration" label="Date Of Expiration">
            <DatePicker format="MM/DD/YYYY" />
          </Form.Item>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <Form.Item label="Doctor" name="Doctor" className="col-span-2">
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
          <Button type="primary" loading={isSubmitting}>
            Print
          </Button>
        </div>
      </Form>
    </>
  );
}

export default MedicalCertificateLand;
