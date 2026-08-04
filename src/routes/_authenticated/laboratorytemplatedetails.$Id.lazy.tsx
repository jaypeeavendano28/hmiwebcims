import { createLazyFileRoute } from "@tanstack/react-router";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  notification,
  Radio,
  Select,
  Space,
  Tooltip,
} from "antd";
import { useForm } from "antd/lib/form/Form";
import { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { BiEdit, BiTrash } from "react-icons/bi";
import useAppStore from "../../store";
import { isNullOrUndefinedOrBlank, PostData } from "../../helpers";
export const Route = createLazyFileRoute(
  "/_authenticated/laboratorytemplatedetails/$Id"
)({
  component: () => <LaboratoryTemplateDetails />,
});

type LaboratoryTemplateSection = {
  Id: number;
  fk_LaboratoryResultTemplates_Id: number;
  Description: string;
  ItemIds?: string;
  Procedures?: string;
};

type LaboratoryProcedureItem = {
  Id: number;
  Description: string;
};

const LaboratoryTemplateDetails = () => {
  const store = useAppStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [Id] = useState(Route.useParams().Id);
  const [rowId, setRowId] = useState<number>(0);
  const [form] = useForm();
  const [sectionForm] = useForm();
  const [tests, setTests] = useState<any[]>([]);
  const [details, setDetails] = useState<any[]>([]);
  const [sections, setSections] = useState<LaboratoryTemplateSection[]>([]);
  const [procedureItems, setProcedureItems] = useState<
    LaboratoryProcedureItem[]
  >([]);
  const [sectionRowId, setSectionRowId] = useState(0);
  const [isSavingSection, setIsSavingSection] = useState(false);

  const handleSaveTest = async (values: any) => {
    if (
      isNullOrUndefinedOrBlank(values.fk_Analytes_Id) &&
      isNullOrUndefinedOrBlank(values.Description)
    ) {
      notification.error({
        message: "Please select a test or encode a description!",
        placement: "topRight",
        duration: 3,
      });
      return;
    }

    const selectedAnalyteId = Number(values.fk_Analytes_Id ?? 0);
    const duplicateAnalyte = details.some(
      (detail: any) =>
        selectedAnalyteId > 0 &&
        Number(detail.fk_Analytes_Id) === selectedAnalyteId &&
        Number(detail.Id) !== Number(rowId)
    );

    if (duplicateAnalyte) {
      notification.error({
        message: "Test/Analyte already exists in this template!",
        placement: "topRight",
        duration: 3,
      });
      return;
    }

    setIsSubmitting(true);
    const valuesToSave = {
      ...values,
      Id: rowId,
      fk_LaboratoryResultTemplates_Id: Id,
      fk_LaboratoryResultTemplateSections_Id:
        Number(values.fk_LaboratoryResultTemplateSections_Id) > 0
          ? values.fk_LaboratoryResultTemplateSections_Id
          : null,
      username: store.username,
      BranchCode: store.branchCode,
    };

    const res = await PostData("SaveLaboratoryTemplateDetails", valuesToSave);
    if (res) {
      if (res.status === 1) {
        form.resetFields();
        form.setFieldsValue({
          IsBold: "N",
          IsUnderlined: "N",
          IsIndented: "N",
          IsWithResult: "Y",
          IsHeader: "N",
          fk_LaboratoryResultTemplateSections_Id: 0,
          Sequence: Id === "0" ? Number(values.Sequence) + 1 : undefined,
        });
        notification.success({
          message: "Successfully saved!",
          placement: "topRight",
          duration: 3,
        });
        handleGetLaboratoryTemplateDetails();
        setRowId(0);
        setIsSubmitting(false);
      } else {
        notification.error({
          message: res.message,
          placement: "topRight",
          duration: 3,
        });
      }
    }
  };

  const handleInitialized = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetListOfTests",
      parameters: {
        BranchCode: store.branchCode,
      },
    });

    if (res) {
      setTests(res.parameters.lst);
    }

    form.setFieldsValue({
      IsBold: "N",
      IsUnderlined: "N",
      IsIndented: "N",
      IsWithResult: "Y",
      IsHeader: "N",
      Delete: "N",
      fk_LaboratoryResultTemplateSections_Id: 0,
    });
  };

  const handleCancelUpdate = () => {
    form.setFieldsValue({
      IsBold: "N",
      IsUnderlined: "N",
      IsIndented: "N",
      IsWithResult: "Y",
      fk_LaboratoryResultTemplates_Id: undefined,
      Description: undefined,
      Delete: "N",
      Sequence: undefined,
      fk_LaboratoryResultTemplateSections_Id: 0,
    });
    setRowId(0);
  };
  const handleEdit = (data: any) => {
    setRowId(data.Id);
    form.setFieldsValue({
      IsBold: data.IsBold,
      IsUnderlined: data.IsUnderlined,
      IsIndented: data.IsIndented,
      IsWithResult: data.IsWithResult,
      fk_LaboratoryResultTemplates_Id: data.fk_LaboratoryResultTemplates_Id,
      Description: data.Description,
      Sequence: data.Sequence,
      Delete: "N",
      fk_Analytes_Id: data.fk_Analytes_Id,
      IsHeader: data.IsHeader,
      fk_LaboratoryResultTemplateSections_Id:
        data.fk_LaboratoryResultTemplateSections_Id ?? 0,
    });
  };
  const handleGetLaboratoryTemplateDetails = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetLaboratoryResultTemplateDetails",
      parameters: {
        Id: Id,
      },
    });

    if (res) {
      setDetails(res.parameters.lst);
    }
  };

  const handleGetSections = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetLaboratoryResultTemplateSections",
      parameters: { TemplateId: Number(Id) },
    });

    setSections(res?.parameters?.lst ?? []);
  };

  const handleGetProcedureItems = async () => {
    const res = await PostData("GetRecords", {
      sp: "udp_GetLaboratoryProcedureItems",
      parameters: {},
    });

    setProcedureItems(res?.parameters?.lst ?? []);
  };

  const parseItemIds = (value?: string) =>
    String(value ?? "")
      .split(",")
      .map((itemId) => Number(itemId.trim()))
      .filter((itemId) => itemId > 0);

  const resetSectionForm = () => {
    sectionForm.resetFields();
    setSectionRowId(0);
  };

  const handleEditSection = (section: LaboratoryTemplateSection) => {
    setSectionRowId(section.Id);
    sectionForm.setFieldsValue({
      Description: section.Description,
      ItemIds: parseItemIds(section.ItemIds),
    });
  };

  const handleSaveSection = async (values: any) => {
    try {
      setIsSavingSection(true);
      const res = await PostData("SaveLaboratoryTemplateSection", {
        ...values,
        Id: sectionRowId,
        fk_LaboratoryResultTemplates_Id: Number(Id),
        ItemIds: values.ItemIds ?? [],
        Deleted: false,
      });

      if (res?.status !== 1) {
        notification.error({
          message: res?.message ?? "Unable to save the procedure section.",
          placement: "topRight",
          duration: 3,
        });
        return;
      }

      notification.success({
        message: "Procedure section successfully saved!",
        placement: "topRight",
        duration: 3,
      });
      resetSectionForm();
      await handleGetSections();
      await handleGetLaboratoryTemplateDetails();
    } finally {
      setIsSavingSection(false);
    }
  };

  const handleDeleteSection = async (section: LaboratoryTemplateSection) => {
    const res = await PostData("SaveLaboratoryTemplateSection", {
      ...section,
      fk_LaboratoryResultTemplates_Id: Number(Id),
      ItemIds: [],
      Deleted: true,
    });

    if (res?.status !== 1) {
      notification.error({
        message: res?.message ?? "Unable to delete the procedure section.",
        placement: "topRight",
        duration: 3,
      });
      return;
    }

    notification.success({
      message: "Procedure section successfully deleted!",
      placement: "topRight",
      duration: 3,
    });
    resetSectionForm();
    await handleGetSections();
  };

  const sectionActionTemplate = (section: LaboratoryTemplateSection) => (
    <Space size={4}>
      <Tooltip title="Edit section">
        <Button
          type="text"
          size="small"
          icon={<BiEdit />}
          onClick={() => handleEditSection(section)}
        />
      </Tooltip>
      <Popconfirm
        title="Delete this procedure section?"
        okText="Yes"
        cancelText="No"
        onConfirm={() => handleDeleteSection(section)}
      >
        <Tooltip title="Delete section">
          <Button type="text" danger size="small" icon={<BiTrash />} />
        </Tooltip>
      </Popconfirm>
    </Space>
  );
  const actionBodyTemplate = (data: any) => {
    //  store.setItemDetails(data);
    return (
      <>
        {rowId === 0 && (
          <>
            <Space>
              <Tooltip title="Edit">
                <BiEdit
                  size={16}
                  className="cursor-pointer text-gray-500 hover:text-gray-600"
                  onClick={() => handleEdit(data)}
                />
              </Tooltip>
            </Space>
          </>
        )}
      </>
    );
  };
  useEffect(() => {
    handleInitialized();
    handleGetLaboratoryTemplateDetails();
    handleGetSections();
    handleGetProcedureItems();
  }, []);
  return (
    <div className="ml-2 mt-2 mr-2 cardBackground">
      <div className="grid lg:grid-cols-6">
        <div>
          <p className="font-bold">Template Name</p>
          {/* <p className="font-bold">{state.details.Description}</p> */}
        </div>
      </div>
      <div className="border-y border-slate-200 py-3">
        <div className="mb-2">
          <p className="m-0 font-semibold text-slate-800">Procedure Sections</p>
          <p className="m-0 text-xs text-slate-500">
            Map charge items to the part of this template they should display.
          </p>
        </div>
        <Form
          form={sectionForm}
          layout="vertical"
          onFinish={handleSaveSection}
        >
          <div className="grid grid-cols-1 gap-x-3 md:grid-cols-3">
            <Form.Item
              name="Description"
              label="Description"
              rules={[
                { required: true, message: "Please enter a description." },
              ]}
            >
              <Input maxLength={150} />
            </Form.Item>
            <Form.Item
              className="md:col-span-2"
              name="ItemIds"
              label="Exam/Procedure"
              rules={[
                {
                  required: true,
                  message: "Please select at least one procedure.",
                },
              ]}
            >
              <Select
                mode="multiple"
                allowClear
                showSearch
                optionFilterProp="label"
                maxTagCount="responsive"
                options={procedureItems.map((item) => ({
                  value: item.Id,
                  label: item.Description,
                }))}
              />
            </Form.Item>
          </div>
          <Space>
            <Button type="primary" htmlType="submit" loading={isSavingSection}>
              {sectionRowId > 0 ? "Update Section" : "Add Section"}
            </Button>
            {sectionRowId > 0 && (
              <Button onClick={resetSectionForm}>Cancel</Button>
            )}
          </Space>
        </Form>
        {sections.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <DataTable
              value={sections}
              size="small"
              tableStyle={{ minWidth: "36rem" }}
            >
              <Column
                header="Action"
                body={sectionActionTemplate}
                style={{ width: "6rem" }}
              />
              <Column field="Description" header="Description" />
              <Column field="Procedures" header="Exam/Procedure" />
            </DataTable>
          </div>
        )}
      </div>
      <Form
        form={form}
        layout="vertical"
        scrollToFirstError
        onFinish={handleSaveTest}
      >
        <div className="grid grid-cols-4 gap-4 pt-3">
          <Form.Item name="fk_Analytes_Id" label="Test/Analyte">
            <Select
              allowClear
              showSearch
              filterOption={(input, option) =>
                option!.props.children
                  .toLowerCase()
                  .indexOf(input.toLowerCase()) >= 0
              }
            >
              {tests.map((v: any) => (
                <>
                  <Select.Option key={v.Id} value={v.Id}>
                    {v.Description}
                  </Select.Option>
                </>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="Description" label="Description">
            <Input />
          </Form.Item>
          <Form.Item
            name="fk_LaboratoryResultTemplateSections_Id"
            label="Procedure Section"
          >
            <Select
              options={[
                { value: 0, label: "All Procedures" },
                ...sections.map((section) => ({
                  value: section.Id,
                  label: section.Description,
                })),
              ]}
            />
          </Form.Item>
          <Form.Item
            name="IsWithResult"
            label="With Result?"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Radio.Group>
              <Radio value="Y">Yes</Radio>
              <Radio value="N">No</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="IsBold"
            label="Bold?"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Radio.Group>
              <Radio value="Y">Yes</Radio>
              <Radio value="N">No</Radio>
            </Radio.Group>
          </Form.Item>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <Form.Item
            name="IsUnderlined"
            label="Undelined?"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Radio.Group>
              <Radio value="Y">Yes</Radio>
              <Radio value="N">No</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="IsIndented"
            label="Indented?"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Radio.Group>
              <Radio value="Y">Yes</Radio>
              <Radio value="N">No</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="IsHeader"
            label="Header?"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Radio.Group>
              <Radio value="Y">Yes</Radio>
              <Radio value="N">No</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="Sequence"
            label="Sequence"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <Form.Item
            name="Delete"
            label="Delete this record?"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Radio.Group>
              <Radio value="Y">Yes</Radio>
              <Radio value="N">No</Radio>
            </Radio.Group>
          </Form.Item>
          <div className="flex flex-col justify-center items-start">
            <Space>
              <Button htmlType="submit" type="primary" loading={isSubmitting}>
                {rowId > 0 ? "Update" : "Add"}
              </Button>
              {rowId > 0 && (
                <Button type="primary" onClick={() => handleCancelUpdate()}>
                  Cancel Update
                </Button>
              )}
            </Space>
          </div>
        </div>
      </Form>
      <div className="mt-2">
        <DataTable value={details} tableStyle={{ minWidth: "50rem" }}>
          <Column
            field="action"
            header="Action"
            body={(data) => actionBodyTemplate(data)}
          ></Column>
          <Column field="Test" header="Test"></Column>
          <Column field="SectionDescription" header="Procedure Section"></Column>
          <Column field="IsHeader" header="Is Header?"></Column>
          <Column field="IsBold" header="Is Bold?"></Column>
          <Column field="IsUnderlined" header="Is Underlined?"></Column>
          <Column field="IsIndented" header="Is Indented?"></Column>
          <Column field="Sequence" header="Sequence"></Column>
        </DataTable>
      </div>
    </div>
  );
};
