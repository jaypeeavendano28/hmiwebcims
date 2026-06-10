import { useQueryClient } from '@tanstack/react-query';
import { App, Button, Form, Input, InputNumber, Modal } from 'antd';
import { useState } from 'react';
import { BiNote } from 'react-icons/bi';
import { TSaveVendor } from '../types';
import { PostData } from '../helpers';

type FieldType = {
  name: string;
  contactPerson: string;
  position: string;
  address: string;
  tin: string;
  emailAddress: string;
  tax: number;
};

export default function AddVendor() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { notification } = App.useApp();
  const [form] = Form.useForm<FieldType>();
  const queryClient = useQueryClient();

  const handleOpen = () => {
    form.resetFields();
    setIsOpen(true);
  };
  const handleClose = () => setIsOpen(false);

  const handleSubmit = async (values: FieldType) => {
    try {
      setIsSaving(true);

      const payload: TSaveVendor = {
        Id: 0,
        Name: values.name,
        ContactPerson: values.contactPerson,
        Position: values.position,
        Address: values.address,
        Tin: values.tin,
        EmailAddress: values.emailAddress,
        Tax: values.tax,
      };
      const res = await PostData('SaveSuppliers', payload);
      if (res.status === 1) {
        notification.success({
          message: 'New Vendor Successfully Save!',
          placement: 'topRight',
          duration: 3,
        });
        queryClient.invalidateQueries({
          queryKey: ['vendors'],
        });
        setIsOpen(false);
      } else {
        notification.error({
          message: res.message,
          placement: 'topRight',
          duration: 3,
        });
      }
    } catch (err) {
      console.log(err);
      notification.error({
        message: 'Something went wrong please try again later',
        placement: 'topRight',
        duration: 3,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button type="primary" icon={<BiNote />} onClick={handleOpen}>
        New
      </Button>
      <Modal
        open={isOpen}
        onCancel={handleClose}
        title="New Vendor"
        width={800}
        centered
        onOk={form.submit}
        okText="Submit"
        okButtonProps={{
          loading: isSaving,
        }}
      >
        <Form
          layout="vertical"
          className="grid md:grid-cols-2 gap-x-3"
          onFinish={handleSubmit}
          form={form}
        >
          <Form.Item<FieldType>
            name="name"
            label="Name"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item<FieldType> name="contactPerson" label="Contact Person">
            <Input />
          </Form.Item>
          <Form.Item<FieldType> name="position" label="Position">
            <Input />
          </Form.Item>

          <Form.Item<FieldType>
            name="emailAddress"
            label="Email Address"
            rules={[{ type: 'email' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item<FieldType>
            name="address"
            label="Address"
            className="md:col-span-2"
          >
            <Input />
          </Form.Item>
          <Form.Item<FieldType> name="tin" label="Tin No">
            <Input />
          </Form.Item>
          <Form.Item<FieldType> name="tax" label="Tax Percent">
            <InputNumber />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
