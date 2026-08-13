import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
import {
  Button,
  Divider,
  Empty,
  Form,
  Input,
  Modal,
  notification,
  Popconfirm,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
} from 'antd';
import { useEffect, useRef, useState } from 'react';
import { isNullOrUndefinedOrBlank, PostData, WithAccess } from '../../helpers';
import { TAppointments, TDepartments, TPatientInformation } from '../../types';
import dayjs from 'dayjs';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import Loading from '../../components/loading';
import useAppStore from '../../store';
import { BiEdit, BiTrash } from 'react-icons/bi';
import { MdUploadFile } from 'react-icons/md';

type UploadedPdfRecord = {
  Id: number;
  fk_Appointments_Id: number;
  fk_Departments_Id: number;
  Description?: string;
  ShowInCompanyPortal?: string;
  AppointmentType?: string;
  DateStr?: string;
  Department?: string;
  AddedBy?: string;
  DateAdded?: string;
  UpdatedBy?: string;
  DateUpdated?: string;
  ResultId?: number;
  ResultType?: string;
};
export const Route = createLazyFileRoute('/_authenticated/uploaddocuments/$Id')(
  {
    component: () => <UploadDocuments />,
  },
);
const UploadDocuments = () => {
  const store = useAppStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadedPdf, setUploadPdf] = useState<UploadedPdfRecord[]>([]);
  const [pdfBase64, setPdfBase64] = useState<string | undefined>();
  const [pdfBase642, setPdfBase642] = useState<string | undefined>();
  const [hasReplacementFile, setHasReplacementFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [visibilityUpdatingId, setVisibilityUpdatingId] = useState(0);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [selectedRow, setSelectedRow] = useState<TAppointments | undefined>();
  const [selectedPdf, setSelectedPdf] = useState<
    UploadedPdfRecord | undefined
  >();
  const [editingPdf, setEditingPdf] = useState<UploadedPdfRecord | undefined>();
  const [showModal, setShowModal] = useState(false);
  const [departments, setDepartments] = useState<TDepartments[] | undefined>();
  const [appointments, setAppointments] = useState<
    TAppointments[] | undefined
  >();
  const [form] = Form.useForm();
  const { Id } = Route.useParams();
  const search = Route.useSearch() as {
    appointmentId?: string | number;
    departmentId?: string | number;
    autoOpen?: boolean | string;
  };
  const requestedAppointmentId = Number(search.appointmentId ?? 0);
  const requestedDepartmentId = Number(search.departmentId ?? 0);
  const hasRequestedAppointment = requestedAppointmentId > 0;
  const hasRequestedDepartment = requestedDepartmentId > 0;
  const useRequestedDepartment = hasRequestedDepartment && !editingPdf;
  const shouldAutoOpen =
    search.autoOpen === true || String(search.autoOpen ?? '') === 'true';
  const [patientInfo, setPatientInfo] = useState<
    TPatientInformation | undefined
  >();
  const requestedDepartment = departments?.find(
    (department) => Number(department.Id) === requestedDepartmentId,
  );

  const getPdfContent = async (pdfId: number) => {
    const res = await PostData('GetRecords', {
      sp: 'udp_GetPdfFile',
      parameters: {
        Id: pdfId,
      },
    });

    return res?.parameters?.lst?.[0]?.pdf ?? res?.parameters?.lst?.[0]?.Pdf;
  };

  const handleGetPdfFile = async () => {
    if (!selectedPdf?.Id) {
      setPdfBase642(undefined);
      return;
    }

    try {
      setLoading(true);
      setPdfBase642(await getPdfContent(selectedPdf.Id));
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetPatientInformation = async () => {
    try {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetPatientInformationById',
        parameters: {
          Id,
        },
      });
      if (res) {
        const x: TPatientInformation = res.parameters.lst[0];
        setPatientInfo(x);
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 3,
      });
    }
  };
  const handleGetInitialized = async () => {
    try {
      let res = await PostData('GetRecords', {
        sp: 'udp_GetAppointmentsPerPatient',
        parameters: {
          Id,
        },
      });
      if (res) {
        const appointmentList = res.parameters.lst as TAppointments[];
        setAppointments(appointmentList);

        if (hasRequestedAppointment) {
          setSelectedRow(
            appointmentList.find(
              (appointment) =>
                Number(appointment.Id) === requestedAppointmentId,
            ),
          );
        }
      }
      res = await PostData('GetRecords', {
        sp: 'udp_GetDepartments',
        parameters: {},
      });
      if (res) {
        setDepartments(res.parameters.lst);
      }

      res = await PostData('GetRecords', {
        sp: 'udp_GetPdfFiles',
        parameters: {
          Id,
        },
      });
      if (res) {
        const documents = res.parameters.lst as UploadedPdfRecord[];
        setUploadPdf(documents);
        setSelectedPdf((current) =>
          current
            ? documents.find((document) => document.Id === current.Id)
            : undefined,
        );
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 3,
      });
    }
  };
  function blobToBase64(blob: any) {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }
  const closeDocumentModal = () => {
    setShowModal(false);
    setEditingPdf(undefined);
    setSelectedRow(undefined);
    setPdfBase64(undefined);
    setHasReplacementFile(false);
    form.resetFields();
  };

  const openNewDocument = () => {
    setEditingPdf(undefined);
    setSelectedRow(
      hasRequestedAppointment
        ? appointments?.find(
            (appointment) => Number(appointment.Id) === requestedAppointmentId,
          )
        : undefined,
    );
    setPdfBase64(undefined);
    setHasReplacementFile(false);
    form.resetFields();
    form.setFieldsValue({
      Department: hasRequestedDepartment ? requestedDepartmentId : undefined,
      ShowInCompanyPortal: 'N',
    });
    setShowModal(true);
  };

  const openEditDocument = async (document: UploadedPdfRecord) => {
    setEditingPdf(document);
    setSelectedRow(
      appointments?.find(
        (appointment) =>
          Number(appointment.Id) === Number(document.fk_Appointments_Id),
      ),
    );
    setHasReplacementFile(false);
    form.setFieldsValue({
      Department: document.fk_Departments_Id,
      ShowInCompanyPortal:
        document.ShowInCompanyPortal?.toUpperCase() === 'Y' ? 'Y' : 'N',
      Description: document.Description,
    });
    setShowModal(true);

    try {
      setLoading(true);
      setPdfBase64(await getPdfContent(document.Id));
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDocument = async () => {
    try {
      const v = await form.validateFields();
      if (!editingPdf && isNullOrUndefinedOrBlank(pdfBase64)) {
        notification.error({
          message: 'Please select a file to upload!',
          placement: 'topRight',
          duration: 3,
        });
        return;
      }
      if (isNullOrUndefinedOrBlank(selectedRow)) {
        notification.error({
          message: 'Please select an appointment date!',
          placement: 'topRight',
          duration: 3,
        });
        return;
      }

      setIsSaving(true);
      const res = await PostData(
        editingPdf ? 'UpdatePdfFile' : 'UploadPdfFile',
        {
          Id: editingPdf?.Id,
          fk_Appointments_Id: selectedRow!.Id,
          fk_Departments_Id: useRequestedDepartment
            ? requestedDepartmentId
            : v.Department,
          Pdf: editingPdf && !hasReplacementFile ? null : pdfBase64,
          ShowInCompanyPortal: v.ShowInCompanyPortal,
          Description: v.Description,
        },
      );
      if (res) {
        if (res.status === 1) {
          notification.success({
            message: editingPdf
              ? 'Document successfully updated!'
              : 'Document successfully uploaded!',
            placement: 'topRight',
            duration: 3,
          });
          await handleGetInitialized();
          closeDocumentModal();
        } else {
          notification.error({
            message: res.message,
            placement: 'topRight',
            duration: 3,
          });
        }
      }
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }

      notification.error({
        message: error?.message ?? 'Unable to save the document.',
        placement: 'topRight',
        duration: 3,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDocument = async (document: UploadedPdfRecord) => {
    try {
      const res = await PostData('DeletePdfFile', { Id: document.Id });
      if (res?.status !== 1) {
        notification.error({
          message: res?.message ?? 'Unable to delete the document.',
          placement: 'topRight',
          duration: 3,
        });
        return;
      }

      notification.success({
        message: 'Document successfully deleted!',
        placement: 'topRight',
        duration: 3,
      });
      if (selectedPdf?.Id === document.Id) {
        setSelectedPdf(undefined);
        setPdfBase642(undefined);
      }
      await handleGetInitialized();
    } catch (error: any) {
      notification.error({
        message: error?.message ?? 'Unable to delete the document.',
        placement: 'topRight',
        duration: 3,
      });
    }
  };

  const handleVisibilityChange = async (
    document: UploadedPdfRecord,
    visible: boolean,
  ) => {
    try {
      setVisibilityUpdatingId(document.Id);
      const res = await PostData('SetPdfFileVisibility', {
        Id: document.Id,
        ShowInCompanyPortal: visible ? 'Y' : 'N',
      });

      if (res?.status !== 1) {
        notification.error({
          message: res?.message ?? 'Unable to update portal visibility.',
          placement: 'topRight',
          duration: 3,
        });
        return;
      }

      notification.success({
        message: visible
          ? 'Document shown in the portal.'
          : 'Document hidden from the portal.',
        placement: 'topRight',
        duration: 3,
      });
      await handleGetInitialized();
    } catch (error: any) {
      notification.error({
        message: error?.message ?? 'Unable to update portal visibility.',
        placement: 'topRight',
        duration: 3,
      });
    } finally {
      setVisibilityUpdatingId(0);
    }
  };

  // const handleUploadPdf = async (image: any) => {
  //   try {
  //     const fd = new FormData();

  //     fd.append("image", image);
  //     fd.append("Id", selectedRow!.Id!.toString());
  //     axios.defaults.baseURL = apiUrl;
  //     axios.defaults.headers.common["Authorization"] = ("Bearer " +
  //       store.tokenIdWebCims) as string;

  //     await axios({
  //       method: "post",
  //       url: apiUrl + "/UploadMedtechSignature",
  //       data: fd,
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //       },
  //     })
  //       .then((res: any) => {
  //         if (res.data.status === 1) {
  //           notification.success({
  //             message: "Successfully saved!",
  //             placement: "topRight",
  //             duration: 3,
  //           });
  //         } else {
  //           notification.error({
  //             message: res.data.message,
  //             placement: "topRight",
  //             duration: 3,
  //           });
  //         }
  //       })
  //       .catch((err) => {
  //         console.log(err);
  //       });
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };
  const onFilePicked = async (files: any) => {
    if (files[0] === undefined) return false;

    let filename = files[0].name;
    if (filename.lastIndexOf('.') <= 0) {
      notification.error({
        message: 'Invalid image file!',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    if (files[0].size >= 2000000) {
      notification.error({
        message: 'File must not be greater than 2MB!',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    const p: string = (await blobToBase64(files?.[0])) as never as string;
    setPdfBase64(p);
    setHasReplacementFile(true);
  };
  const handleSelectPdf = () => {
    if (fileInput.current) {
      fileInput.current.value = '';
    }
    fileInput.current?.click();
  };
  const handleWithAccess = async () => {
    const res = await WithAccess({
      sp: 'udp_WithAccess',
      parameters: {
        Username: store.username,
        ModuleId: 29,
      },
    });
    if (res) {
      if (res.status === 0) {
        notification.error({
          message: 'Access denied for module-Upload Files/Documents',
          placement: 'topRight',
          duration: 3,
        });
        router.navigate({
          to: '/',
        });
      }
    }
  };
  useEffect(() => {
    handleWithAccess();
    handleGetPatientInformation();
    handleGetInitialized();
  }, []);
  useEffect(() => {
    if (shouldAutoOpen && hasRequestedAppointment && selectedRow && !showModal) {
      openNewDocument();
    }
  }, [hasRequestedAppointment, selectedRow, shouldAutoOpen, showModal]);
  useEffect(() => {
    if (!isNullOrUndefinedOrBlank(selectedPdf)) {
      handleGetPdfFile();
    }
  }, [selectedPdf]);
  useEffect(() => {
    if (showModal && useRequestedDepartment) {
      form.setFieldValue('Department', requestedDepartmentId);
    }
  }, [form, requestedDepartmentId, showModal, useRequestedDepartment]);
  return (
    <div className="cardBackGround space-y-4">
      <div className="rounded border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Uploaded Documents
            </p>
            <p className="text-xl font-semibold text-slate-900">
              {patientInfo?.Name ?? 'Patient'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <Tag color="blue">Patient No. {patientInfo?.PatientNo}</Tag>
              <Tag>
                Birthdate{' '}
                {patientInfo?.DateOfBirth
                  ? dayjs(patientInfo.DateOfBirth).format('MM/DD/YYYY')
                  : '-'}
              </Tag>
              {selectedRow && (
                <Tag color="geekblue">
                  {selectedRow.DateStr} {selectedRow.AppointmentType}
                </Tag>
              )}
              {hasRequestedDepartment && (
                <Tag color="cyan">
                  {requestedDepartment?.Description ??
                    `Department ${requestedDepartmentId}`}
                </Tag>
              )}
            </div>
          </div>
          <Button
            type="primary"
            icon={<MdUploadFile />}
            onClick={openNewDocument}
          >
            Upload Document
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="min-w-0 rounded border border-slate-200 bg-white p-3 shadow-sm xl:col-span-7">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">Documents</p>
              <p className="text-xs text-slate-500">
                {uploadedPdf.length} file(s)
              </p>
            </div>
          </div>
          <DataTable
            value={uploadedPdf}
            // paginator
            rows={10}
            rowsPerPageOptions={[10, 25, 50]}
            emptyMessage="No Records!"
            stripedRows
            size="small"
            filterDisplay="row"
            selectionMode="single"
            selection={selectedPdf}
            onSelectionChange={(e) =>
              setSelectedPdf(e.value as UploadedPdfRecord)
            }
            dataKey="Id"
          >
            <Column
              header="Action"
              body={(document: UploadedPdfRecord) => (
                <Space size={4} onClick={(event) => event.stopPropagation()}>
                  <Tooltip title="Update document">
                    <Button
                      type="text"
                      size="small"
                      icon={<BiEdit className="text-lg text-emerald-600" />}
                      onClick={() => void openEditDocument(document)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="Delete this document?"
                    description="This will also hide it from the portal."
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => void handleDeleteDocument(document)}
                  >
                    <Tooltip title="Delete document">
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<BiTrash className="text-lg" />}
                      />
                    </Tooltip>
                  </Popconfirm>
                </Space>
              )}
              style={{ width: 88 }}
            />
            <Column
              field="AppointmentType"
              header="Appointment Type"
              filter
            ></Column>
            <Column field="DateStr" header="Appointment Date" filter></Column>
            <Column field="Description" header="Description" filter></Column>
            <Column field="Department" header="Department" filter></Column>
            <Column
              field="ShowInCompanyPortal"
              header="Portal"
              body={(document: UploadedPdfRecord) => {
                const isVisible =
                  document.ShowInCompanyPortal?.toUpperCase() === 'Y';

                return (
                  <Space size={6} onClick={(event) => event.stopPropagation()}>
                    <Tooltip
                      title={isVisible ? 'Hide from portal' : 'Show in portal'}
                    >
                      <Switch
                        size="small"
                        checked={isVisible}
                        loading={visibilityUpdatingId === document.Id}
                        onChange={(checked) =>
                          void handleVisibilityChange(document, checked)
                        }
                      />
                    </Tooltip>
                    <Tag color={isVisible ? 'green' : 'default'}>
                      {isVisible ? 'Shown' : 'Hidden'}
                    </Tag>
                  </Space>
                );
              }}
              filter
            />
            <Column field="AddedBy" header="Added By" filter></Column>
            <Column field="DateAdded" header="Date Added" filter></Column>
          </DataTable>
        </div>

        <div className="min-w-0 rounded border border-slate-200 bg-white p-3 shadow-sm xl:col-span-5">
          <div className="mb-2">
            <p className="font-semibold text-slate-800">Preview</p>
            <p className="text-xs text-slate-500">
              {selectedPdf?.Description ?? 'Select a document to preview'}
            </p>
          </div>
          {loading ? (
            <div className="flex h-[560px] items-center justify-center">
              <Loading size={64} />
            </div>
          ) : pdfBase642 ? (
            <iframe
              title="Uploaded document preview"
              className="h-[560px] w-full rounded border border-slate-200"
              src={pdfBase642}
            />
          ) : (
            <div className="flex h-[560px] items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50">
              <Empty description="Select a document to preview it." />
            </div>
          )}
        </div>
      </div>

      <Modal
        title={editingPdf ? 'Update Document' : 'Upload Document'}
        open={showModal}
        onCancel={closeDocumentModal}
        destroyOnClose
        footer={false}
        width={hasRequestedAppointment ? 980 : 1180}
        centered
      >
        <div className="grid gap-4 lg:grid-cols-12">
          {!hasRequestedAppointment && (
            <div className="min-w-0 rounded border border-slate-200 p-3 lg:col-span-4">
              <p className="mb-2 font-semibold text-slate-800">
                Select Appointment
              </p>
              <DataTable
                value={appointments}
                // paginator
                rows={10}
                rowsPerPageOptions={[10, 25, 50]}
                emptyMessage="No Records!"
                stripedRows
                size="small"
                filterDisplay="row"
                selectionMode="single"
                selection={selectedRow}
                onSelectionChange={(e) => setSelectedRow(e.value)}
                dataKey="Id"
              >
                <Column field="Id" header="Id" filter></Column>
                <Column field="DateStr" header="Date" filter></Column>
                <Column
                  field="AppointmentType"
                  header="Appointment Type"
                  filter
                ></Column>
              </DataTable>
            </div>
          )}
          <div
            className={
              hasRequestedAppointment
                ? 'min-w-0 lg:col-span-12'
                : 'min-w-0 lg:col-span-8'
            }
          >
            <Form
              form={form}
              layout="vertical"
              className="rounded border border-slate-200 !p-3"
            >
              <div className="grid grid-cols-2 gap-x-2">
                {hasRequestedAppointment && selectedRow && (
                  <div className="mb-3 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-semibold">Appointment:</span>{' '}
                    {selectedRow.DateStr} {selectedRow.AppointmentType}
                  </div>
                )}
                {useRequestedDepartment && (
                  <div className="mb-3 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-semibold">Department:</span>{' '}
                    {requestedDepartment?.Description ??
                      `Department ${requestedDepartmentId}`}
                  </div>
                )}
              </div>
              <div>
                {!useRequestedDepartment && (
                  <Form.Item
                    name="Department"
                    label="Department"
                    rules={[
                      {
                        required: true,
                      },
                    ]}
                  >
                    <Select>
                      {departments?.map((v: TDepartments) => (
                        <Select.Option value={v.Id} key={v.Id}>
                          {v.Description}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                )}

                <Form.Item
                  name="ShowInCompanyPortal"
                  label="Show in Company Portal"
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                  className="!mb-2"
                >
                  <Select>
                    <Select.Option value="Y" key="Y">
                      Yes
                    </Select.Option>
                    <Select.Option value="N" key="N">
                      No
                    </Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  name="Description"
                  label="Description"
                  className="md:col-span-3"
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                >
                  <Input.TextArea rows={2} />
                </Form.Item>
              </div>
            </Form>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <Space>
                <Button type="primary" onClick={handleSelectPdf}>
                  {editingPdf ? 'Replace PDF' : 'Select PDF'}
                </Button>
                <Button
                  type="primary"
                  loading={isSaving}
                  onClick={handleSaveDocument}
                  disabled={!editingPdf && !pdfBase64}
                >
                  {editingPdf ? 'Update' : 'Upload'}
                </Button>
              </Space>
              <span className="text-xs text-slate-500">
                PDF only, maximum 2MB
              </span>
            </div>
            <Divider className="my-3" />
            <div>
              {loading ? (
                <div className="flex h-[300px] items-center justify-center">
                  <Loading size={64} />
                </div>
              ) : pdfBase64 ? (
                <iframe
                  title="Document upload preview"
                  className="h-[300px] w-full rounded border border-slate-200"
                  src={pdfBase64}
                />
              ) : (
                <div className="flex h-[300px] items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50">
                  <Empty description="Select a PDF to preview it." />
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
      <input
        style={{ display: 'none' }}
        ref={fileInput}
        type="file"
        accept=".pdf"
        onChange={(e) => onFilePicked(e.target.files)}
      />
    </div>
  );
};
