import { FC, useEffect } from "react";
import { Button, Divider, Form, Input } from "antd";

type Props = {
  handleFinalizeResult: (v: any) => void;
};
const FinalizeForm: FC<Props> = ({ handleFinalizeResult }) => {
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
        <Divider>FInalize Result</Divider>
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
              Submit
            </Button>
          </div>
        </Form>
      </div>
    </>
  );
};

export default FinalizeForm;
