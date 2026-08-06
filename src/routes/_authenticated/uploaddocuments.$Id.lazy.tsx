import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
import {
  Button,
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
  const [patientInfo, setPatientInfo] = useState<
    TPatientInformation | undefined
  >();

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
        setAppointments(res.parameters.lst);
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
    setSelectedRow(undefined);
    setPdfBase64(undefined);
    setHasReplacementFile(false);
    form.resetFields();
    form.setFieldsValue({ ShowInCompanyPortal: 'N' });
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
          fk_Departments_Id: v.Department,
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
    if (!isNullOrUndefinedOrBlank(selectedPdf)) {
      handleGetPdfFile();
    }
  }, [selectedPdf]);
  return (
    <div className="cardBackGround">
      <div className="grid grid-cols-6 gap-4">
        <div>
          <p>Patient No.</p>
          <p className="font-bold">{patientInfo?.PatientNo}</p>
        </div>
        <div className="col-span-2">
          <p>Patient Name</p>
          <p className="font-bold">{patientInfo?.Name}</p>
        </div>
        <div>
          <p>Bithdate</p>
          <p className="font-bold">
            {dayjs(patientInfo?.DateOfBirth).format('MM/DD/YYYY')}
          </p>
        </div>
      </div>
      <div className="mt-2">
        <Button
          type="primary"
          icon={<MdUploadFile />}
          onClick={openNewDocument}
        >
          Upload Document
        </Button>
      </div>
      <div className="mt-2">
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
            header="Show in Portal"
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

      <div className="mt-2">
        {loading ? (
          <Loading size={64} />
        ) : pdfBase642 ? (
          <iframe
            title="Uploaded document preview"
            style={{
              width: '100%',
              height: '600px',
            }}
            src={pdfBase642}
          />
        ) : (
          <div className="flex h-40 items-center justify-center border border-dashed border-slate-300 text-sm text-slate-500">
            Select a document to preview it.
          </div>
        )}
      </div>

      <Modal
        title={editingPdf ? 'Update Document' : 'Upload Document'}
        open={showModal}
        onCancel={closeDocumentModal}
        destroyOnClose
        footer={false}
        width={screen.width - 100}
        centered
      >
        <div className="grid lg:grid-cols-12 gap-4">
          <div className="col-span-4">
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
          <div className="col-span-8">
            <Form form={form} layout="vertical">
              <div className="grid grid-cols-3 gap-4">
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
                <Form.Item
                  name="ShowInCompanyPortal"
                  label="Show in Company Portal"
                  rules={[
                    {
                      required: true,
                    },
                  ]}
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
            <Space>
              <Button type="primary" onClick={handleSelectPdf}>
                {editingPdf ? 'Replace PDF' : 'Select PDF'}
              </Button>
              <Button
                type="primary"
                loading={isSaving}
                onClick={handleSaveDocument}
              >
                {editingPdf ? 'Update' : 'Upload'}
              </Button>
            </Space>
            <div className="mt-2">
              {loading ? (
                <Loading size={64} />
              ) : pdfBase64 ? (
                <iframe
                  title="Document upload preview"
                  style={{
                    width: '100%',
                    height: '600px',
                  }}
                  src={pdfBase64}
                />
              ) : (
                <div className="flex h-40 items-center justify-center border border-dashed border-slate-300 text-sm text-slate-500">
                  Select a PDF to preview it.
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
