import { useQueryClient } from '@tanstack/react-query';
import { App, Button, Form, Input, Popover, Tooltip } from 'antd';
import { AxiosError } from 'axios';
import { useState } from 'react';
import { BiPlus } from 'react-icons/bi';
import { PostData } from '../helpers';

export default function AddReqPhysician() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const q = useQueryClient();
  const { notification } = App.useApp();
  const [form] = Form.useForm();
  const handleSubmitForm = async (values: any) => {
    try {
      setIsSubmitting(true);
      const res = await PostData('SaveDoctorProfile', {
        ...values,
        Type: 'DOC',
        Lastname: '',
        Firstname: '',
      });
      if (res) {
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
      }
      form.resetFields();
      q.invalidateQueries({
        queryKey: ['cardiology-result-requesting-physicians'],
      });
      q.invalidateQueries({
        queryKey: ['requesting-physicians'],
      });
      q.invalidateQueries({
        queryKey: ['consultation-specialists'],
      });
      q.invalidateQueries({
        queryKey: ['doctors'],
      });
    } catch (error: AxiosError | any) {
      notification.error({
        message: error.response?.data,
        placement: 'topRight',
        duration: 3,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div>
      <Tooltip title="Add Requesting Physician">
        {/* */}
        <Popover
          content={() => {
            return (
              <Form
                form={form}
                layout="vertical"
                onFinish={(values) => handleSubmitForm(values)}
              >
                <Form.Item
                  name="Name"
                  className="!m-1"
                  label="Physician Name"
                  rules={[
                    {
                      required: true,
                      message: 'Physician Name is required!',
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
                <div className="w-full grid items-end">
                  <Button type="primary" htmlType="submit">
                    Submit
                  </Button>
                </div>
              </Form>
            );
          }}
          title="New Requesting Physician"
          trigger="click"
        >
          <Button type="dashed" className="!h-[32px]" loading={isSubmitting}>
            <BiPlus />
          </Button>
        </Popover>
      </Tooltip>
    </div>
  );
}
