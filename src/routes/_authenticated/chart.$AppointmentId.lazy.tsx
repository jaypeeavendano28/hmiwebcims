import { createLazyFileRoute } from '@tanstack/react-router';
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  notification,
  Select,
  Tag,
  Tooltip,
} from 'antd';
import { TAppointments, TChart, TDoctors, TICd10 } from '../../types';
import { useQuery } from '@tanstack/react-query';
import { PostData } from '../../helpers';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import useAppStore from '../../store';
import axios from 'axios';
import SearchICD from '../../components/SearchICD';
import { BiArrowBack } from 'react-icons/bi';
import { MdOutlinePrint, MdSave, MdSearch } from 'react-icons/md';
import PatientInfoHeader from '../../components/PatientInfoHeader';

export const Route = createLazyFileRoute(
  '/_authenticated/chart/$AppointmentId',
)({
  component: () => <Chart />,
});
const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API;
const devApi = import.meta.env.VITE_DEV_API;
const apiUrl = isDev ? devApi : prodApi;
const Chart = () => {
  const [showModal, setShowModal] = useState(false);
  const store = useAppStore();
  const [selected, setSelected] = useState<TChart | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const { AppointmentId } = Route.useParams();
  const [Id, setId] = useState<number>(0);
  const [isPrintingMedicalRecordSheet, setIsPrintingMedicalRecordSheet] =
    useState(false);
  const [isPrintingChart, setIsPrintingChart] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (v: TChart) => {
    const valuesToSave = {
      ...v,
      fk_Appointments_Id: AppointmentId,
      Id,
      Started: dayjs(v.Started).format(),
      Ended: dayjs(v.Ended).format(),
    };

    try {
      setIsProcessing(true);
      const res = await PostData('SaveChart', valuesToSave);
      if (res) {
        if (res.status === 1) {
          notification.success({
            message: 'Successfully saved!',
            placement: 'topRight',
            duration: 3,
          });
          await handleGetDetails();
        } else {
          notification.error({
            message: res.message,
            placement: 'topRight',
            duration: 3,
          });
        }
      }
    } catch (error: any) {
      console.log(error.message);
    } finally {
      setIsProcessing(false);
    }
  };
  const handleClose = (Icd10: TICd10) => {
    form.setFieldsValue({
      Icd10: Icd10.ITEM_CODE,
      Ruv: Icd10.ITEM_DESC,
      AssessmentDiagnosis: Icd10.ITEM_DESC,
    });

    setShowModal(false);
  };

  const appointmentDetails = useQuery<TAppointments>({
    queryKey: ['chart-appointment-details', AppointmentId],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetAppointmentDetails',
        parameters: { Id: AppointmentId },
      });
      if (res) {
        return res.parameters.lst[0];
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const specialists = useQuery<TDoctors[]>({
    queryKey: ['chart-specialists'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetDoctors',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const handleGetDetails = async () => {
    const res = await PostData('GetRecords', {
      sp: 'udp_GetChart',
      parameters: { AppointmentId },
    });
    if (res) {
      if (res.parameters.lst.length > 0) {
        const x: TChart = res.parameters.lst[0];
        setSelected(x);
        setId(x.Id);
        form.setFieldsValue({
          Started: dayjs(x.Started),
          Ended: dayjs(x.Ended),
          Specialist: x.Specialist,
          RequestingPhysician: x.RequestingPhysician,
          AssessmentDiagnosis: x.AssessmentDiagnosis,
          Icd10: x.Icd10,
          Ruv: x.Ruv,
          Planx: x.Planx,
          AddedBy: x.AddedBy,
          DateAdded: dayjs(x.DateAdded).format('MM/DD/YYYY hh:mm A'),
          UpdatedBy: x.UpdatedBy,
          DateUpdated: dayjs(x.DateAdded).format('MM/DD/YYYY hh:mm A'),
        });
      } else {
        setId(0);
        form.setFieldsValue({
          Started: dayjs(),
        });
      }
    }
  };

  const handlePrintPatientMedicalRecordSheet = async (id: number) => {
    axios.defaults.headers.common['Authorization'] =
      'Bearer ' + store.tokenIdWebCims;
    setIsPrintingMedicalRecordSheet(true);
    const url = apiUrl + 'GenerateReport';
    try {
      // setIsProccessing(true);
      await axios({
        url: url,
        method: 'GET',
        responseType: 'blob',
        params: {
          ReportName: 'PatientMedicalRecordSheet.rdl',
          AppointmentId: id,
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
      setIsPrintingMedicalRecordSheet(false);
    }
  };

  const handlePrint = async () => {
    axios.defaults.headers.common['Authorization'] =
      'Bearer ' + store.tokenIdWebCims;

    const url = apiUrl + '/api/GenerateReport';
    try {
      setIsPrintingChart(true);
      await axios({
        url: url, //your url
        method: 'GET',
        responseType: 'blob',
        params: {
          ReportName: 'chart.rdl',
          AppointmentId: AppointmentId,
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
      });
    } catch (error: any) {
      let errorString = error.response.data;
      errorString = JSON.parse(await error.response.data.text());
      return { Status: 0, Message: errorString.Message };
    } finally {
      setIsPrintingChart(false);
    }
  };
  useEffect(() => {
    handleGetDetails();
  }, []);
  const patient = appointmentDetails.data;
  const patientAge = [
    patient?.AgeYears ? patient.AgeYears + 'Y' : '',
    patient?.AgeMonths ? patient.AgeMonths + 'M' : '',
    patient?.AgeDays ? patient.AgeDays + 'D' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const company = patient?.HmoCompanyName || patient?.Company || '-';
  const doctorOptions = (specialists.data ?? [])
    .filter((doctor) => doctor.Id !== undefined)
    .map((doctor) => ({
      value: doctor.Id!,
      label: doctor.NameAndSpecialty || doctor.Name || '',
    }));
  const formatAuditDate = (value?: Date) =>
    value ? dayjs(value).format('MM/DD/YYYY hh:mm A') : '-';

  return (
    <div className="cardBackGround min-h-full overflow-hidden">
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <header className="border-b border-slate-200 px-3 py-3 md:px-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Tooltip title="Back">
                <Button
                  type="text"
                  icon={<BiArrowBack size={20} />}
                  aria-label="Back"
                  onClick={() => window.history.back()}
                />
              </Tooltip>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-semibold text-slate-900">
                    Clinical Chart
                  </h1>
                  <Tag color={Id > 0 ? 'success' : 'default'}>
                    {Id > 0 ? 'Saved' : 'New'}
                  </Tag>
                </div>
                <p className="truncate text-xs text-slate-500">
                  Appointment {patient?.AppointmentNo || AppointmentId}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                icon={<MdOutlinePrint />}
                loading={isPrintingMedicalRecordSheet}
                onClick={() =>
                  handlePrintPatientMedicalRecordSheet(parseInt(AppointmentId))
                }
              >
                Medical Record
              </Button>
              <Button
                icon={<MdOutlinePrint />}
                loading={isPrintingChart}
                disabled={Id === 0}
                onClick={handlePrint}
              >
                Print Chart
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<MdSave />}
                loading={isProcessing}
              >
                Save Chart
              </Button>
            </div>
          </div>
        </header>

        <PatientInfoHeader
          appointmentId={AppointmentId}
          patientId={patient?.fk_PatientInformation_Id}
          name={patient?.Name}
          age={patientAge}
          sex={patient?.Sex}
          appointmentNo={patient?.AppointmentNo || AppointmentId}
          className="bg-slate-50 px-4 py-3"
          fields={[
            { label: 'Member No.', value: patient?.MemberNo },
            { label: 'Company', value: company },
            {
              label: 'Appointment Date',
              value: patient?.DateStr || patient?.DateOnly,
            },
          ]}
        />

        <main className="space-y-5 p-4">
          <section>
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-800">
                Encounter Details
              </h2>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-2 xl:grid-cols-4">
              <Form.Item
                name="Specialist"
                label="Specialist"
                className="!mb-0"
                rules={[
                  {
                    required: true,
                    message: 'Specialist is required!',
                  },
                ]}
              >
                <Select
                  className="w-full"
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  options={doctorOptions}
                />
              </Form.Item>

              <Form.Item
                name="RequestingPhysician"
                label="Requesting Physician"
                className="!mb-0"
              >
                <Select
                  className="w-full"
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  options={doctorOptions}
                />
              </Form.Item>

              <Form.Item
                name="Started"
                label="Started"
                className="!mb-0"
                rules={[
                  {
                    required: true,
                    message: 'Started is required!',
                  },
                ]}
              >
                <DatePicker
                  className="w-full"
                  format="MM/DD/YYYY hh:mm A"
                  showTime
                />
              </Form.Item>

              <Form.Item
                name="Ended"
                label="Ended"
                className="!mb-0"
                rules={[
                  {
                    required: true,
                    message: 'Ended is required!',
                  },
                ]}
              >
                <DatePicker
                  className="w-full"
                  format="MM/DD/YYYY hh:mm A"
                  showTime
                />
              </Form.Item>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <section className="min-w-0 border-t border-slate-200 pt-3">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-800">
                  Assessment / Diagnosis
                </h2>
                <Button
                  icon={<MdSearch />}
                  onClick={() => setShowModal(true)}
                >
                  Search ICD-10 / RVS
                </Button>
              </div>

              <Form.Item
                name="AssessmentDiagnosis"
                className="!mb-3"
                rules={[
                  {
                    required: true,
                    message: 'Assessment/Diagnosis is required!',
                  },
                ]}
              >
                <Input.TextArea rows={8} />
              </Form.Item>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Form.Item name="Icd10" label="ICD-10" className="!mb-0">
                  <Input />
                </Form.Item>
                <Form.Item name="Ruv" label="RVS / RUV" className="!mb-0">
                  <Input />
                </Form.Item>
              </div>
            </section>

            <section className="min-w-0 border-t border-slate-200 pt-3">
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-slate-800">Plan</h2>
              </div>
              <Form.Item name="Planx" className="!mb-0">
                <Input.TextArea rows={12} />
              </Form.Item>
            </section>
          </div>

          <section className="border-t border-slate-200 bg-slate-50 px-3 py-3">
            <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-xs md:grid-cols-4">
              <div>
                <p className="font-semibold uppercase text-slate-500">
                  Added By
                </p>
                <p className="mt-1 font-medium text-slate-800">
                  {selected?.AddedBy || '-'}
                </p>
              </div>
              <div>
                <p className="font-semibold uppercase text-slate-500">
                  Date Added
                </p>
                <p className="mt-1 font-medium text-slate-800">
                  {formatAuditDate(selected?.DateAdded)}
                </p>
              </div>
              <div>
                <p className="font-semibold uppercase text-slate-500">
                  Updated By
                </p>
                <p className="mt-1 font-medium text-slate-800">
                  {selected?.UpdatedBy || '-'}
                </p>
              </div>
              <div>
                <p className="font-semibold uppercase text-slate-500">
                  Date Updated
                </p>
                <p className="mt-1 font-medium text-slate-800">
                  {formatAuditDate(selected?.DateUpdated)}
                </p>
              </div>
            </div>
          </section>
        </main>
      </Form>

      <Modal
        title="Search ICD-10 / RVS"
        open={showModal}
        onCancel={() => setShowModal(false)}
        footer={null}
        width={1200}
        destroyOnClose
      >
        <SearchICD handleClose={handleClose} />
      </Modal>
    </div>
  );
};
