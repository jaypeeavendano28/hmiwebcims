import { App, Button, DatePicker, Form, Modal } from 'antd';
import { CompanyDataType } from '../routes/_authenticated/utilities/portal';
import { BiEdit } from 'react-icons/bi';
import { useState } from 'react';
import dayjs from 'dayjs';
import { useQueryClient } from '@tanstack/react-query';
import { PostData } from '../helpers';

type FieldType = {
  validUntil: string;
};

export default function UpdatePortalAccValidity({
  data,
}: {
  data: CompanyDataType;
}) {
  const [form] = Form.useForm<FieldType>();
  const [submitting, setIsSubmitting] = useState(false);
  const { notification } = App.useApp();
  const [isOpen, setIsOpen] = useState(false);

  const queryClient = useQueryClient();

  const handleOpen = () => {
    form.resetFields();
    setIsOpen(true);
  };
  const handleClose = () => setIsOpen(false);

  const handleSave = async (values: FieldType) => {
    try {
      setIsSubmitting(true);
      const res = await PostData('portal/ValidDateUpdate', {
        Id: data.Id,
        ValidUntil: dayjs(values.validUntil).format('YYYY-MM-DDTHH:mm:ss'),
      });
      if (res.status === 1) {
        notification.success({
          message: res.message,
          placement: 'topRight',
          duration: 5,
        });

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
    <>
      <Button type="text" onClick={handleOpen}>
        <BiEdit />
      </Button>
      <Modal
        title={`Update ${data.CompanyName} Account Date Validity`}
        onCancel={handleClose}
        open={isOpen}
        onOk={form.submit}
        centered
        okText="Save"
        okButtonProps={{
          loading: submitting,
        }}
      >
        <Form
          form={form}
          initialValues={{
            validUntil: dayjs(data.ValidUntil),
          }}
          onFinish={handleSave}
        >
          <Form.Item<FieldType>
            label="Date"
            name="validUntil"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker format="MM/DD/YYYY" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
