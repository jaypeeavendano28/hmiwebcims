import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
import { Button, Form, Input, notification } from 'antd';
import axios from 'axios';
import { useEffect, useState } from 'react';
import SignatureBuilder from '../../../components/SignatureBuilder';
import { PostData } from '../../../helpers';
import useAppStore from '../../../store';
import { TMedtechs } from '../../../types';

export const Route = createLazyFileRoute('/_authenticated/utilities/psychometrician/$Id')({
  component: PsychometricianProfile,
});

const apiRoot = String(
  import.meta.env.DEV ? import.meta.env.VITE_DEV_API : import.meta.env.VITE_PROD_API,
).replace(/\/$/, '');

function PsychometricianProfile() {
  const { Id } = Route.useParams();
  const router = useRouter();
  const store = useAppStore();
  const [form] = Form.useForm<TMedtechs>();
  const [id, setId] = useState(Number(Id));
  const [signature, setSignature] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const name = Form.useWatch('Name', form);
  const licenseNo = Form.useWatch('LicenseNo', form);
  const title = Form.useWatch('Title', form);

  useEffect(() => {
    if (Number(Id) === 0) {
      form.setFieldsValue({ Id: 0, Title: 'PSYCHOMETRICIAN' });
      return;
    }

    const load = async () => {
      try {
        const res = await PostData('GetRecords', {
          sp: 'udp_GetMedtechProfile',
          parameters: { Id },
        });
        const record = res?.parameters?.lst?.[0] as TMedtechs | undefined;
        if (!record || record.Type !== 'P') {
          notification.error({ message: 'Psychometrician was not found.' });
          void router.navigate({ to: '/utilities/psychometricians' });
          return;
        }
        form.setFieldsValue(record);
        const signatureRes = await PostData('GetRecords', {
          sp: 'udp_GetMedtechSignature',
          parameters: { Id },
        });
        setSignature(signatureRes?.parameters?.lst?.[0]?.Signature ?? null);
      } catch (error) {
        notification.error({
          message: error instanceof Error ? error.message : 'Unable to load psychometrician.',
        });
      }
    };

    void load();
  }, [Id, form, router]);

  const saveProfile = async (values: TMedtechs, notify = true): Promise<number> => {
    setSaving(true);
    try {
      const res = await PostData('SaveMedtech', {
        ...values,
        Id: id,
        Type: 'P',
        IsQA: false,
      });
      if (res?.status !== 1) throw new Error(res?.message || 'Unable to save psychometrician.');
      const savedId = Number(res.parameters?.Id ?? 0);
      setId(savedId);
      form.setFieldValue('Id', savedId);
      if (notify) notification.success({ message: 'Psychometrician saved.' });
      return savedId;
    } catch (error) {
      notification.error({
        message: error instanceof Error ? error.message : 'Unable to save psychometrician.',
      });
      return 0;
    } finally {
      setSaving(false);
    }
  };

  const saveSignature = async (image: string): Promise<boolean> => {
    try {
      const values = await form.validateFields();
      const savedId = await saveProfile(values, false);
      if (!savedId) return false;

      const data = new FormData();
      data.append('image', image);
      data.append('Id', String(savedId));
      const response = await axios.post(`${apiRoot}/api/UploadMedtechSignature`, data, {
        headers: { Authorization: `Bearer ${store.tokenIdWebCims}` },
      });
      if (response.data?.status !== 1) {
        throw new Error(response.data?.message || 'Unable to save signature.');
      }
      setSignature(image);
      notification.success({ message: 'Psychometrician signature saved.' });
      return true;
    } catch (error) {
      notification.error({
        message: error instanceof Error ? error.message : 'Unable to save signature.',
      });
      return false;
    }
  };

  return (
    <div className="cardBackGround">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Psychometrician Profile</h1>
        <Button onClick={() => router.navigate({ to: '/utilities/psychometricians' })}>Back</Button>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => { void saveProfile(values); }}
        >
          <Form.Item name="Id" label="Id"><Input readOnly /></Form.Item>
          <Form.Item
            name="Name"
            label="Name"
            normalize={(value: string) => value.toUpperCase()}
            rules={[{ required: true, message: 'Name is required.' }]}
          >
            <Input autoFocus maxLength={200} />
          </Form.Item>
          <Form.Item name="LicenseNo" label="License No.">
            <Input maxLength={100} />
          </Form.Item>
          <Form.Item name="Title" label="Position/Title">
            <Input maxLength={100} />
          </Form.Item>
          <div className="flex justify-end">
            <Button type="primary" htmlType="submit" loading={saving}>Save</Button>
          </div>
        </Form>
        <SignatureBuilder
          currentImage={signature}
          disabled={id === 0}
          fullName={name}
          licenseNo={licenseNo}
          positionTitle={title}
          defaultTitle="PSYCHOMETRICIAN"
          onLicenseNoChange={(value) => form.setFieldValue('LicenseNo', value)}
          onTitleChange={(value) => form.setFieldValue('Title', value)}
          onSave={saveSignature}
        />
      </div>
    </div>
  );
}
