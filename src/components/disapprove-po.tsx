import { App, Button, Form, Modal, Tooltip } from 'antd';
import { HiOutlineArchiveBoxXMark } from 'react-icons/hi2';
import { TPurchaseOrder } from '../types';
import { useState } from 'react';
import TextArea from 'antd/es/input/TextArea';
import { PostData } from '../helpers';
import { useQueryClient } from '@tanstack/react-query';

interface DisapprovePoProps {
  data: TPurchaseOrder;
}

type FieldType = {
  remarks: string;
};

export default function DisapprovePo({ data }: DisapprovePoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [form] = Form.useForm<FieldType>();
  const { notification } = App.useApp();
  const queryClient = useQueryClient();
  const handleOpen = () => {
    setIsOpen(true);
  };
  const handleClose = () => {
    setIsOpen(false);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (values: FieldType) => {
    try {
      const res = await PostData('DisapprovePO', {
        TransNo: data.TransNo,
        Remarks: values.remarks,
      });
      if (res.status === 1) {
        notification.success({
          message: 'P.O Disapproved Successfully!',
          placement: 'topRight',
          duration: 3,
        });
        queryClient.invalidateQueries({
          queryKey: ['purchase-order'],
        });
        handleClose();
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
      <Tooltip title="Disapprove Purchase Order">
        <Button
          size="small"
          type="primary"
          onClick={handleOpen}
          disabled={data.Status !== 'PENDING'}
        >
          <HiOutlineArchiveBoxXMark size={14} />
        </Button>
        <Modal
          open={isOpen}
          onCancel={handleClose}
          title="Purchase Order"
          okText="Disapprove"
          okButtonProps={{
            danger: true,
            loading: isSaving,
          }}
          onOk={form.submit}
          closeIcon={false}
          centered
          maskClosable={false}
        >
          <div className="mb-2">
            <p>
              Disapprove Purchase Order with Trans. No{' '}
              <span className="font-medium">{data.TransNo}</span>
            </p>
          </div>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item<FieldType>
              name="remarks"
              label="Reason"
              rules={[{ required: true, message: 'Please input your reason' }]}
            >
              <TextArea />
            </Form.Item>
          </Form>
        </Modal>
      </Tooltip>
    </>
  );
}
