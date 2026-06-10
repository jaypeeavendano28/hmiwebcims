import { useQuery } from '@tanstack/react-query';
import { createLazyFileRoute, Link, useRouter } from '@tanstack/react-router';
import { PostData, WithAccess } from '../../helpers';
import { TAppointments } from '../../types';
import dayjs from 'dayjs';
import { App, Button, Divider, Form, Tabs, TabsProps } from 'antd';
import { useEffect } from 'react';
import useAppStore from '../../store';
import MedicalExaminationSeabased from '../../components/medicalexaminationseabased';
import MedicalCertificateSeaBased from '../../components/medicalcertlseabased';

export const Route = createLazyFileRoute(
  '/_authenticated/medicalexaminationseabased/$AppointmentId',
)({
  component: () => <MedicalExaminationSeaBasedAppointment />,
});

function MedicalExaminationSeaBasedAppointment() {
  const [form] = Form.useForm();
  const { notification } = App.useApp();
  const router = useRouter();
  const store = useAppStore();
  const { AppointmentId } = Route.useParams();
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
        const data = res.parameters.lst[0] as TAppointments;
        form.setFieldsValue({
          PassportNo: data.PassportNo,
          CountryOfDestination: data.CountryOfDestination,
          PositionAppliedFor: data.PositionAppliedFor,
          Employer: data.Employer,
        });
        return data;
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  const items: TabsProps['items'] = [
    {
      key: '1',
      label: <div className="font-semibold">Medical Examination</div>,
      children: (
        <MedicalExaminationSeabased AppointmentId={Number(AppointmentId)} />
      ),
    },
    {
      key: '2',
      label: <div className="font-semibold">Medical Certificate</div>,
      children: (
        <MedicalCertificateSeaBased AppointmentId={Number(AppointmentId)} />
      ),
    },
  ];

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
  // async function handleSubmit(values: TAppointments) {}
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
      <div className="grid grid-cols-8 gap-4 mb-2">
        <div>
          <div>Passport No.</div>
          <div className="font-semibold">
            {appointmentDetails.data?.PassportNo}
          </div>
        </div>
        <div className="col-span-3">
          <div>Country Of Destination</div>
          <div className="font-semibold">
            {appointmentDetails.data?.CountryOfDestination}
          </div>
        </div>
        <div>
          <div>Position Applied For</div>
          <div className="font-semibold">
            {appointmentDetails.data?.PositionAppliedFor}
          </div>
        </div>
        <div className="col-span-2">
          <div>Employer</div>
          <div className="font-semibold">
            {appointmentDetails.data?.Employer}
          </div>
        </div>
      </div>
      <Link
        to="/appointmentdetails/$Id"
        params={{
          Id: AppointmentId,
        }}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button type="primary">Appointment Details</Button>
      </Link>
      <Divider>OFW-Seabased</Divider>
      <Tabs defaultActiveKey="1" items={items} />
    </>
  );
}
