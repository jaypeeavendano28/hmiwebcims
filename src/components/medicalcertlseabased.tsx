import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Form,
  Input,
  Radio,
  Select,
} from 'antd';
import { useState } from 'react';
import { PostData } from '../helpers';
import { TDoctors, TMedicalCertificateSeaBase } from '../types';
import dayjs from 'dayjs';
import axios from 'axios';
import useAppStore from '../store';
import Loading from './loading';
type Props = {
  AppointmentId: number;
};

const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API;
const devApi = import.meta.env.VITE_DEV_API;
const apiUrl = isDev ? devApi : prodApi;

type MedCertFieldType = {
  identificationConfirmationDoc: string;
  hearingMeetsSTCWStandard: string;
  unaidedHearingStisfactory: string;
  visualAcuityMeetsSTCWStandard: string;
  colourVisionMeetsSTCWStandard: string;
  lastDateColourVisionTest: string;
  visualAidsSpectacles: boolean;
  visualAidsContactLenses: boolean;
  fitForLookoutDuty: string;
  restrictionsOnDuty: string;
  restrictionSpecify: string;
  seaMedicalRestrictions: string;
  result: string;
  doctor: number;
  approvedBy: number;
  dateOfExpiration: string;
  dateOfPatientSignature: string;
  dateOfExamination: string;
  dateOfAssuancePemeCert: string;
};

const formatDatePayload = (value: any) =>
  value ? dayjs(value).format('YYYY-MM-DD') : null;

export default function MedicalCertificateSeaBased({ AppointmentId }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { notification, message } = App.useApp();
  const store = useAppStore();
  const [form] = Form.useForm();

  const [hasSavedData, setHasSavedData] = useState(false);
  const queryClient = useQueryClient();

  const restrictionsOnDutyWatch = Form.useWatch('restrictionsOnDuty', form);

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

  const { isLoading } = useQuery({
    queryKey: ['medicalCertificateSeaBased', AppointmentId],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetMedicalCertificateSeaBase',
        parameters: { AppointmentId },
      });
      if (res) {
        const x: TMedicalCertificateSeaBase = res.parameters.lst[0];
        if (x) {
          setHasSavedData(true);
        }
        form.setFieldsValue({
          identificationConfirmationDoc: x.IdentificationConfirmationDoc,
          hearingMeetsSTCWStandard: x.HearingMeetsSTCWStandard,
          unaidedHearingStisfactory: x.UnaidedHearingStisfactory,
          visualAcuityMeetsSTCWStandard: x.VisualAcuityMeetsSTCWStandard,
          colourVisionMeetsSTCWStandard: x.ColourVisionMeetsSTCWStandard,
          lastDateColourVisionTest: x.LastDateColourVisionTest
            ? dayjs(x.LastDateColourVisionTest)
            : null,
          visualAidsSpectacles: x.VisualAidsSpectacles,
          visualAidsContactLenses: x.VisualAidsContactLenses,
          fitForLookoutDuty: x.FitForLookoutDuty,
          restrictionsOnDuty: x.RestrictionsOnDuty,
          restrictionSpecify: x.RestrictionSpecify,
          seaMedicalRestrictions: x.SeaMedicalRestrictions,
          result: x.Result,
          doctor: x.Doctor,
          approvedBy: x.ApprovedBy,
          dateOfExpiration: x.DateOfExpiration
            ? dayjs(x.DateOfExpiration)
            : null,
          dateOfPatientSignature: x.DateOfPatientSignature
            ? dayjs(x.DateOfPatientSignature)
            : null,
          dateOfExamination: x.DateOfExamination
            ? dayjs(x.DateOfExamination)
            : null,
          dateOfAssuancePemeCert: x.DateOfAssuancePemeCert
            ? dayjs(x.DateOfAssuancePemeCert)
            : null,
        });
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const handleSubmit = async (values: MedCertFieldType) => {
    try {
      setIsSubmitting(true);
      const payload: TMedicalCertificateSeaBase = {
        Id: 0,
        Fk_Appointments_Id: AppointmentId,
        IdentificationConfirmationDoc: values.identificationConfirmationDoc,
        HearingMeetsSTCWStandard: values.hearingMeetsSTCWStandard,
        VisualAcuityMeetsSTCWStandard: values.visualAcuityMeetsSTCWStandard,
        UnaidedHearingStisfactory: values.unaidedHearingStisfactory,
        ColourVisionMeetsSTCWStandard: values.colourVisionMeetsSTCWStandard,
        LastDateColourVisionTest: formatDatePayload(
          values.lastDateColourVisionTest,
        ),
        VisualAidsSpectacles: values.visualAidsSpectacles,
        VisualAidsContactLenses: values.visualAidsContactLenses,
        FitForLookoutDuty: values.fitForLookoutDuty,
        RestrictionsOnDuty: values.restrictionsOnDuty,
        RestrictionSpecify: values.restrictionSpecify,
        SeaMedicalRestrictions: values.seaMedicalRestrictions,
        Result: values.result,
        Doctor: values.doctor,
        ApprovedBy: values.approvedBy,
        DateOfExpiration: formatDatePayload(values.dateOfExpiration),
        DateOfPatientSignature: formatDatePayload(
          values.dateOfPatientSignature,
        ),
        DateOfExamination: formatDatePayload(values.dateOfExamination),
        DateOfAssuancePemeCert: formatDatePayload(
          values.dateOfAssuancePemeCert,
        ),
      };
      console.log(payload);

      const res = await PostData('SaveMedicalCertificateSeaBased', payload);
      if (res.status === 1) {
        notification.success({
          message: 'Successfully saved!',
          placement: 'topRight',
          duration: 3,
        });
        queryClient.invalidateQueries({
          queryKey: ['medicalCertificateSeaBased', AppointmentId],
        });
      } else {
        notification.error({
          message: res.message,
          placement: 'topRight',
          duration: 3,
        });
      }
    } catch (error) {
      message.error('An error occurred while submitting the form.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          ReportName: 'MedCertSeaBased.rdl',
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

  return isLoading ? (
    <Loading size={64} />
  ) : (
    <Card>
      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
        className="grid grid-cols-2 gap-x-4"
        initialValues={{
          identificationConfirmationDoc: 'Y',
          hearingMeetsSTCWStandard: 'Y',
          unaidedHearingStisfactory: 'Y',
          colourVisionMeetsSTCWStandard: 'Y',
          visualAcuityMeetsSTCWStandard: 'Y',
          fitForLookoutDuty: 'Y',
          restrictionsOnDuty: 'Y',
          seaMedicalRestrictions: 'N',
          result: 'F',
          dateOfExamination: dayjs(),
          dateOfAssuancePemeCert: dayjs(),
          dateOfExpiration: dayjs().add(2, 'year'),
          dateOfPatientSignature: dayjs(),
        }}
      >
        <Form.Item<MedCertFieldType>
          name="identificationConfirmationDoc"
          label="Confirmation that identification documents were checked at the point of examination"
        >
          <Radio.Group>
            <Radio value="Y">Yes</Radio>
            <Radio value="N">No</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item<MedCertFieldType>
          name="hearingMeetsSTCWStandard"
          label="Hearing meets the standards in STWC code, Section A-1/9"
        >
          <Radio.Group>
            <Radio value="Y">Yes</Radio>
            <Radio value="N">No</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item<MedCertFieldType>
          name="unaidedHearingStisfactory"
          label="Unaided hearing satisfactory"
        >
          <Radio.Group>
            <Radio value="Y">Yes</Radio>
            <Radio value="N">No</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item<MedCertFieldType>
          name="visualAcuityMeetsSTCWStandard"
          label="Visual acuity meets standards in STCW code, Section A-1/9"
        >
          <Radio.Group>
            <Radio value="Y">Yes</Radio>
            <Radio value="N">No</Radio>
          </Radio.Group>
        </Form.Item>
        <div className="flex items-center gap-x-2">
          <Form.Item<MedCertFieldType>
            name="colourVisionMeetsSTCWStandard"
            label="Colour vision meets standards in STCW code, Section A-1/9"
          >
            <Radio.Group>
              <Radio value="Y">Yes</Radio>
              <Radio value="N">No</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item<MedCertFieldType>
            name="lastDateColourVisionTest"
            label="Date of last colour vision test"
          >
            <DatePicker format={'MM/DD/YYYY'} />
          </Form.Item>
        </div>
        <div>
          <Form.Item label="Visual Aids (tick if worn)">
            <div className="flex items-center gap-x-5">
              <Form.Item<MedCertFieldType>
                name="visualAidsSpectacles"
                valuePropName="checked"
              >
                <Checkbox>Spectacles</Checkbox>
              </Form.Item>
              <Form.Item<MedCertFieldType>
                name="visualAidsContactLenses"
                valuePropName="checked"
              >
                <Checkbox>Contact Lenses</Checkbox>
              </Form.Item>
            </div>
          </Form.Item>
        </div>

        <Form.Item<MedCertFieldType>
          name="fitForLookoutDuty"
          label="Fit for Lookout Duty"
        >
          <Radio.Group>
            <Radio value="Y">Yes</Radio>
            <Radio value="N">No</Radio>
          </Radio.Group>
        </Form.Item>
        <div className="flex items-center gap-x-2">
          <Form.Item<MedCertFieldType>
            name="restrictionsOnDuty"
            label="No limitations or restrictions on fitness?"
            className="shrink-0"
          >
            <Radio.Group
              onChange={() => form.resetFields(['restrictionSpecify'])}
            >
              <Radio value="Y">Yes</Radio>
              <Radio value="N">No</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item<MedCertFieldType>
            name="restrictionSpecify"
            label="if 'No', Specify limitations or restrictions"
            className="grow"
            rules={[
              {
                required: restrictionsOnDutyWatch === 'N' ? true : false,
              },
            ]}
          >
            <Input disabled={restrictionsOnDutyWatch !== 'N'} />
          </Form.Item>
        </div>
        <Form.Item<MedCertFieldType>
          name="seaMedicalRestrictions"
          label="Is applicant suffering from any medical condition likely to be aggravated by service at sea or to render the seafarer unfit for such service or to endanger the health of other persons?"
          className="col-span-2"
        >
          <Radio.Group>
            <Radio value="Y">Yes</Radio>
            <Radio value="N">No</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item<MedCertFieldType> name="result" label="Result">
          <Radio.Group>
            <Radio value="F">Fit</Radio>
            <Radio value="U">Unfit</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item<MedCertFieldType>
          name="dateOfExamination"
          label="Date Of Examination"
        >
          <DatePicker format={'MM/DD/YYYY'} />
        </Form.Item>

        <Form.Item<MedCertFieldType>
          name="dateOfPatientSignature"
          label="Date Of Patient Signature"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <DatePicker format={'MM/DD/YYYY'} />
        </Form.Item>
        <div className="flex gap-x-2">
          <Form.Item<MedCertFieldType>
            name="dateOfAssuancePemeCert"
            label="Date of Issuance of PEME Certificate"
          >
            <DatePicker format={'MM/DD/YYYY'} />
          </Form.Item>{' '}
          <Form.Item<MedCertFieldType>
            name="dateOfExpiration"
            label="Date Of Expiration of PEME Certificate"
          >
            <DatePicker format={'MM/DD/YYYY'} />
          </Form.Item>
        </div>
        <Form.Item<MedCertFieldType>
          label="Doctor"
          name="doctor"
          rules={[{ required: true, message: 'Please select a doctor' }]}
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
        <Form.Item<MedCertFieldType>
          label="Approved By"
          name="approvedBy"
          rules={[
            { required: true, message: 'Please select who approved this' },
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

        <div className="col-span-2 flex gap-x-2 justify-end">
          <Button htmlType="submit" type="primary" loading={isSubmitting}>
            Submit
          </Button>
          <Button
            type="primary"
            onClick={handlePrint}
            disabled={!hasSavedData}
            loading={isSubmitting}
          >
            Print
          </Button>
        </div>
      </Form>
    </Card>
  );
}
