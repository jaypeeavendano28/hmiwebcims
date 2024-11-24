import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TUserBranches, TUsers } from "../../../types";
import { PostData, WithAccess } from "../../../helpers";
import { Form, Input, Transfer, notification } from "antd";
import { TransferDirection } from "antd/es/transfer";
import useAppStore from "../../../store";

export const Route = createFileRoute("/_authenticated/userbranches/$Id")({
  component: () => <UserBranches />,
});

const UserBranches = () => {
  const store = useAppStore();
  const router = useRouter();
  const [form] = Form.useForm();
  const [branches, setBranches] = useState([]);
  const { Id } = Route.useParams();
  const [targetKeys, setTargetKeys] = useState([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const handleInitialized = async () => {
    let res = await PostData("GetRecords", {
      sp: "udp_GetBranches",
      parameters: {},
    });

    if (res) {
      setBranches(res.parameters.lst);
    }

    res = await PostData("GetRecords", {
      sp: "udp_GetUserBranches",
      parameters: { UserId: Id },
    });

    if (res) {
      let x = [] as any;
      res.parameters.lst.forEach((element: TUserBranches) => {
        x.push(element.fk_Branches_Code);
      });

      setTargetKeys(x);
    }
  };
  const filterOption = (inputValue: any, option: any) =>
    option.ModuleName.toLowerCase().indexOf(inputValue.toLowerCase()) > -1;
  const onChange = async (
    _: string[],
    direction: TransferDirection,
    moveKeys: string[]
  ) => {
    const res = await PostData("SaveUserBranches", {
      lst: moveKeys,
      Direction: direction,
      Id: Id,
    });
    if (res) {
      if (res.status === 1) {
        handleInitialized();
        notification.success({
          message:
            direction === "right"
              ? "Successfully added!"
              : "Successfully removed!",
          placement: "topRight",
          duration: 3,
        });
      }
    }
  };
  const onSelectChange = (sourceSelectedKeys: any, targetSelectedKeys: any) => {
    setSelectedKeys([...sourceSelectedKeys, ...targetSelectedKeys]);
  };
  const handleGetUserDetails = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetUserDetailsById",
      parameters: {
        Id: Id,
      },
    });
    if (res) {
      const x: TUsers = res.parameters.lst[0];
      form.setFieldsValue({
        Username: x.Username,
        Fullname: x.Fullname,
      });
    }
  };
  const handleWithAccess = async () => {
    const res = await WithAccess({
      sp: "udp_WithAccess",
      parameters: {
        Username: store.username,
        ModuleId: 11,
      },
    });
    if (res) {
      if (res.status === 0) {
        notification.error({
          message: "Access denied for module-Users-Users-User Branches",
          placement: "topRight",
          duration: 3,
        });
        router.navigate({
          to: "/",
        });
      }
    }
  };

  useEffect(() => {
    store.setHideSideBar("N");
    handleWithAccess();
    handleInitialized();
    handleGetUserDetails();
  }, []);
  return (
    <div className="cardBackGround p-2">
      <Form form={form} layout="vertical">
        <div className="p-2 grid md:grid-cols-6 gap-4">
          <Form.Item name="Username" label="Username">
            <Input readOnly />
          </Form.Item>
          <Form.Item name="Fullname" label="Fullname">
            <Input readOnly />
          </Form.Item>
        </div>
      </Form>
      <div className="font-bold text-center text-md mb-2">User Branches</div>
      <Transfer
        showSearch
        filterOption={filterOption}
        rowKey={(record) => record.Code}
        dataSource={branches}
        titles={["List of branches", "Added branches"]}
        targetKeys={targetKeys}
        selectedKeys={selectedKeys}
        onChange={onChange}
        onSelectChange={onSelectChange}
        render={(item) => item.Name!}
        listStyle={{
          width: 500,
          height: 500,
        }}
      />
    </div>
  );
};
