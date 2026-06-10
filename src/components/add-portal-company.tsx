import { App, Button, DatePicker, Form, Input, Modal, Select } from 'antd';
import { useState } from 'react';
import { BiPlus } from 'react-icons/bi';
import { PostData } from '../helpers';
import { THmoCompany } from '../types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

type FieldType = {
  id: number;
  validUntil: string;
  email: string;
};

type RegisterCompanyRes = {
  message: string;
  status: number;
  parameters: {
    email: string;
    password: string;
  };
};

export default function AddPortalCompany() {
  const [form] = Form.useForm<FieldType>();
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setIsSubmitting] = useState(false);
  const { notification } = App.useApp();

  const hmoCompany = useQuery({
    queryKey: ['hmoCompany'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetHmoCompany',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst as THmoCompany[];
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
  const queryClient = useQueryClient();
  const handleSave = async (values: FieldType) => {
    try {
      setIsSubmitting(true);
      const res: RegisterCompanyRes = await PostData('portal/RegisterCompany', {
        Id: values.id,
        ValidUntil: dayjs(values.validUntil).format('YYYY-MM-DDTHH:mm:ss'),
        Email: values.email,
      });
      if (res.status === 1) {
        notification.success({
          message: res.message,
          placement: 'topRight',
          duration: 5,
        });
        const blob = new Blob([JSON.stringify(res.parameters, null, 2)], {
          type: 'text/plain',
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `RegisterCompany_${values.id}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsOpen(false);

        queryClient.invalidateQueries({
          queryKey: ['portal_company'],
        });
      } else {
        notification.error({
          message: res.message,
          placement: 'topRight',
          duration: 5,
        });
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 5,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Button
        type="primary"
        onClick={() => {
          form.resetFields();
          setIsOpen(true);
        }}
      >
        <div className="flex items-center gap-x-1">
          <BiPlus />
          <div>New</div>
        </div>
      </Button>
      <Modal
        open={isOpen}
        title="New Company Portal Account"
        onCancel={() => setIsOpen(false)}
        centered
        onOk={form.submit}
        okButtonProps={{
          loading: submitting,
        }}
        okText="Save"
      >
        <Form
          layout="vertical"
          className="space-y-3"
          form={form}
          initialValues={{
            validUntil: dayjs().add(1, 'month'),
          }}
          onFinish={handleSave}
        >
          <Form.Item<FieldType>
            label="Company"
            name="id"
            rules={[{ required: true, message: 'Please Select Department' }]}
            className="!m-0"
          >
            <Select
              showSearch
              className="!min-w-[300px]"
              optionFilterProp="label"
              onSelect={(value) => {
                const selectedVal = hmoCompany.data?.filter(
                  (item) => item.Id === value,
                )[0];
                console.log({ value, selectedVal });

                if (selectedVal) {
                  form.setFieldsValue({
                    email: selectedVal.EmailAddress,
                  });
                }
              }}
              options={hmoCompany.data?.map((d) => ({
                value: d.Id,
                label: d.Name,
              }))}
            />
          </Form.Item>
          <Form.Item<FieldType>
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input your email' },
              { type: 'email', message: 'Please enter a valid email address' },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item<FieldType>
            name="validUntil"
            label="Valid Until"
            rules={[
              {
                required: true,
                message: 'Please input company account validity',
              },
            ]}
          >
            <DatePicker format={'MM/DD/YYYY'} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
