import { FC, useEffect } from "react";
import { Button, Divider, Form, Input } from "antd";

type Props = {
  handleFinalizeResult: (v: any) => void;
  title?: string;
  submitText?: string;
};
const FinalizeForm: FC<Props> = ({
  handleFinalizeResult,
  title = "Finalize Result",
  submitText = "Submit",
}) => {
  const [form] = Form.useForm();
  const handleSubmitForm = async (v: any) => {
    handleFinalizeResult(v);
  };

  useEffect(() => {
    form.resetFields();
  }, []);
  return (
    <>
      <div>
        <Divider>{title}</Divider>
        <Form form={form} layout="vertical" onFinish={handleSubmitForm}>
          <Form.Item
            name="Username"
            label="Username"
            rules={[
              {
                required: true,
                message: "Username is required!",
              },
            ]}
          >
            <Input autoFocus />
          </Form.Item>
          <Form.Item
            name="Password"
            label="Password"
            rules={[
              {
                required: true,
                message: "Password is required!",
              },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <div className="flex justify-end">
            <Button type="primary" htmlType="submit">
              {submitText}
            </Button>
          </div>
        </Form>
      </div>
    </>
  );
};

export default FinalizeForm;
