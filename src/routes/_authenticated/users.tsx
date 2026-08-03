import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import {
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Space,
  Tooltip,
  notification,
} from "antd";
import { PostData, WithAccess } from "../../helpers";
import { useEffect, useState } from "react";
import Loading from "../../components/loading";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { TUsers } from "../../types";
import { MdOutlineCountertops, MdOutlineDelete } from "react-icons/md";
import { BiBuilding } from "react-icons/bi";
import { FilterMatchMode } from "primereact/api";
import { FiKey, FiUserCheck, FiUsers } from "react-icons/fi";
import useAppStore from "../../store";
export const Route = createFileRoute("/_authenticated/users")({
  component: () => <Users />,
});

const Users = () => {
  const router = useRouter();
  const store = useAppStore();
  const [expandedRows, setExpandedRows] = useState(null);
  const [selectedData, setSeletectedData] = useState<TUsers | undefined>();
  const [list, setList] = useState<TUsers[] | undefined>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showPasswordOverride, setShowPasswordOverride] = useState(false);
  const [isOverridingPassword, setIsOverridingPassword] = useState(false);
  const [passwordForm] = Form.useForm();
  const [filters] = useState({
    Username: { value: null, matchMode: FilterMatchMode.CONTAINS },
    Fullname: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const handleGetUsers = async () => {
    setIsProcessing(true);
    const res = await PostData("GetRecords", {
      sp: "udp_GetUsers",
      parameters: {},
    });
    if (res) {
      setIsProcessing(false);
      if (res.status === 1) {
        setList(res.parameters.lst);
      }
    }
  };
  const handleDelete = async () => {
    try {
      const res = await PostData("DeleteUser", {
        ...selectedData,
        Username: "",
      });

      if (res) {
        if (res.status === 1) {
          notification.success({
            message: "User successfully deleted!",
            placement: "topRight",
            duration: 3,
          });
          handleGetUsers();
          setShowDelete(false);
        } else {
          notification.error({
            message: res.message,
            placement: "topRight",
            duration: 3,
          });
        }
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: "topRight",
        duration: 3,
      });
    }
  };
  const actionBodyTemplate = (data: TUsers) => {
    return (
      <Space>
        <Tooltip title="Override Password">
          <Button
            type="primary"
            icon={<FiKey />}
            onClick={() => {
              setSeletectedData(data);
              passwordForm.resetFields();
              setShowPasswordOverride(true);
            }}
          />
        </Tooltip>
        <Tooltip title="Delete">
          <Button
            type="primary"
            icon={<MdOutlineDelete />}
            onClick={() => {
              handleWithAccess(3, "Users-Delete");
              setSeletectedData(data);
              setShowDelete(true);
            }}
          />
        </Tooltip>
        <Tooltip title="User Access">
          <Link
            to="/useraccess/$Id"
            params={{
              Id: data.Id.toString(),
            }}
          >
            <Button type="primary" icon={<FiUserCheck />} />
          </Link>
        </Tooltip>
        <Tooltip title="User Departments">
          <Link
            to="/userdepartments/$Id"
            params={{
              Id: data.Id.toString(),
            }}
          >
            <Button type="primary" icon={<BiBuilding />} />
          </Link>
        </Tooltip>
        <Tooltip title="User Queue Counters">
          <Link
            to="/userqcounters/$Id"
            params={{
              Id: data.Id.toString(),
            }}
          >
            <Button type="primary" icon={<MdOutlineCountertops />} />
          </Link>
        </Tooltip>
        <Tooltip title="User Branches">
          <Link
            to="/userbranches/$Id"
            params={{
              Id: data.Id.toString(),
            }}
          >
            <Button type="primary" icon={<FiUsers />} />
          </Link>
        </Tooltip>
      </Space>
    );
  };

  const handleOverridePassword = async (values: {
    Password: string;
    ConfirmPassword: string;
  }) => {
    if (!selectedData) {
      return;
    }

    try {
      setIsOverridingPassword(true);
      const res = await PostData("OverrideUserPassword", {
        Id: selectedData.Id,
        Username: selectedData.Username,
        Password: values.Password,
      });

      if (res?.status !== 1) {
        notification.error({
          message: res?.message ?? "Unable to override the password.",
          placement: "topRight",
          duration: 3,
        });
        return;
      }

      notification.success({
        message: "Password successfully overridden!",
        placement: "topRight",
        duration: 3,
      });
      passwordForm.resetFields();
      setShowPasswordOverride(false);
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: "topRight",
        duration: 3,
      });
    } finally {
      setIsOverridingPassword(false);
    }
  };

  const rowExpansionTemplate = (data: TUsers) => {
    return (
      <div className="p-3">
        <div>Added By</div>
        <div>
          <strong>{data.AddedBy}</strong>
        </div>
        <div>Date Added</div>
        <div>
          <strong>{data.DateAdded}</strong>
        </div>
        <div>Updated By</div>
        <div>
          <strong>{data.UpdatedBy}</strong>
        </div>
        <div>Date Updated</div>
        <div>
          <strong>{data.DateUpdated}</strong>
        </div>
      </div>
    );
  };
  const handleWithAccess = async (ModuleId: number, Description: string) => {
    const res = await WithAccess({
      sp: "udp_WithAccess",
      parameters: {
        Username: store.username,
        ModuleId: ModuleId,
      },
    });
    if (res) {
      if (res.status === 0) {
        notification.error({
          message: "Access denied for module-" + Description,
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
    handleWithAccess(1, "Users");
    handleGetUsers();
  }, []);
  return (
    <div className="cardBackGround">
      <Divider>Users</Divider>
      <Link
        to="/userprofile/$Id"
        params={{
          Id: "0",
        }}
      >
        <Button type="primary">New</Button>
      </Link>

      <div className="mt-2">
        {isProcessing ? (
          <Loading size={64} />
        ) : (
          <DataTable
            value={list}
            tableStyle={{ minWidth: "50rem" }}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 25, 50]}
            emptyMessage="No Records!"
            stripedRows
            size="small"
            filters={filters}
            filterDisplay="row"
            rowExpansionTemplate={rowExpansionTemplate}
            expandedRows={expandedRows as any}
            onRowToggle={(e) => setExpandedRows(e.data as any)}
          >
            <Column expander={list!.length > 0} style={{ width: "5rem" }} />
            <Column
              field="action"
              header="Action"
              body={(data: any) => actionBodyTemplate(data)}
            ></Column>
            <Column
              field="Username"
              header="Username"
              filter
              style={{ minWidth: "12rem" }}
            ></Column>
            <Column
              field="Fullname"
              header="Fullname"
              style={{ minWidth: "12rem" }}
              filter
            ></Column>
          </DataTable>
        )}
      </div>
      <Modal
        open={showDelete}
        onCancel={() => setShowDelete(false)}
        okText="Yes"
        cancelText="No"
        onOk={handleDelete}
      >
        <div className="font-bold">Delete user?</div>
      </Modal>
      <Modal
        title={`Override Password - ${selectedData?.Username ?? ""}`}
        open={showPasswordOverride}
        onCancel={() => {
          passwordForm.resetFields();
          setShowPasswordOverride(false);
        }}
        footer={null}
        destroyOnClose
        width={420}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleOverridePassword}
        >
          <Form.Item
            name="Password"
            label="New Password"
            rules={[
              {
                required: true,
                message: "New password is required!",
              },
            ]}
          >
            <Input.Password autoFocus autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="ConfirmPassword"
            label="Confirm New Password"
            dependencies={["Password"]}
            rules={[
              {
                required: true,
                message: "Please confirm the new password!",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("Password") === value) {
                    return Promise.resolve();
                  }

                  return Promise.reject(
                    new Error("The two passwords do not match!"),
                  );
                },
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                passwordForm.resetFields();
                setShowPasswordOverride(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isOverridingPassword}
            >
              Override Password
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
