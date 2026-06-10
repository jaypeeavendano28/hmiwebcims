import { App, Button, Form, Modal, Tooltip } from 'antd';
import { HiOutlineArchiveBoxXMark } from 'react-icons/hi2';
import { TPurchaseReceiving } from '../types';
import { useState } from 'react';
import TextArea from 'antd/es/input/TextArea';
import { PostData } from '../helpers';
import { useQueryClient } from '@tanstack/react-query';

interface CancelPrProps {
  data: TPurchaseReceiving;
}

type FieldType = {
  remarks: string;
};

export default function CancelPr({ data }: CancelPrProps) {
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
      const res = await PostData('CancelPr', {
        TransNo: data.TransNo,
        Remarks: values.remarks,
      });
      if (res.status === 1) {
        notification.success({
          message: 'P.R Canceled Successfully!',
          placement: 'topRight',
          duration: 3,
        });
        queryClient.invalidateQueries({
          queryKey: ['receiving'],
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
      <Tooltip title="Cancel Purchase Receiving">
        <Button
          size="small"
          type="primary"
          onClick={handleOpen}
          disabled={data.DeletedDate ? true : false}
        >
          <HiOutlineArchiveBoxXMark size={14} />
        </Button>
        <Modal
          open={isOpen}
          onCancel={handleClose}
          title="Purchase Receiving"
          okText="Cancel"
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
              Cancel Purchase Receiving with Trans. No{' '}
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
