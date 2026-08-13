import {
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  notification,
} from 'antd';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useEffect, useRef, useState } from 'react';
import { BiEdit, BiTrash } from 'react-icons/bi';
import { FaUpload } from 'react-icons/fa6';
import { isNullOrUndefinedOrBlank, PostData } from '../helpers';
import Loading from './loading';

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
};

type Props = {
  patientId?: number;
  appointmentId?: number;
  departmentId?: number;
};

const UploadDocumentButton = ({
  patientId,
  appointmentId,
  departmentId,
}: Props) => {
  const [form] = Form.useForm();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [documents, setDocuments] = useState<UploadedPdfRecord[]>([]);
  const [selectedDocument, setSelectedDocument] =
    useState<UploadedPdfRecord>();
  const [editingDocument, setEditingDocument] =
    useState<UploadedPdfRecord>();
  const [pdfBase64, setPdfBase64] = useState<string>();
  const [previewBase64, setPreviewBase64] = useState<string>();
  const [hasReplacementFile, setHasReplacementFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [visibilityUpdatingId, setVisibilityUpdatingId] = useState(0);

  const resolvedPatientId = Number(patientId ?? 0);
  const resolvedAppointmentId = Number(appointmentId ?? 0);
  const resolvedDepartmentId = Number(departmentId ?? 0);
  const canUpload =
    resolvedPatientId > 0 &&
    resolvedAppointmentId > 0 &&
    resolvedDepartmentId > 0;

  const getPdfContent = async (pdfId: number) => {
    const res = await PostData('GetRecords', {
      sp: 'udp_GetPdfFile',
      parameters: {
        Id: pdfId,
      },
    });

    return res?.parameters?.lst?.[0]?.pdf ?? res?.parameters?.lst?.[0]?.Pdf;
  };

  const loadDocuments = async () => {
    if (resolvedPatientId <= 0) {
      setDocuments([]);
      return;
    }

    const res = await PostData('GetRecords', {
      sp: 'udp_GetPdfFiles',
      parameters: {
        Id: resolvedPatientId,
      },
    });
    const list = ((res?.parameters?.lst ?? []) as UploadedPdfRecord[]).filter(
      (document) =>
        resolvedAppointmentId <= 0 ||
        Number(document.fk_Appointments_Id) === resolvedAppointmentId,
    );

    setDocuments(list);
    setSelectedDocument((current) =>
      current ? list.find((document) => document.Id === current.Id) : undefined,
    );
  };

  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result ?? ''));
      reader.readAsDataURL(blob);
    });

  const onFilePicked = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      notification.error({
        message: 'Please select a PDF file.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    if (file.size >= 2000000) {
      notification.error({
        message: 'File must not be greater than 2MB.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    setPdfBase64(await blobToBase64(file));
    setHasReplacementFile(true);
  };

  const resetEditor = () => {
    setEditingDocument(undefined);
    setPdfBase64(undefined);
    setHasReplacementFile(false);
    form.resetFields();
    form.setFieldsValue({ ShowInCompanyPortal: 'N' });
  };

  const openNewDocument = () => {
    resetEditor();
  };

  const openEditDocument = async (document: UploadedPdfRecord) => {
    setEditingDocument(document);
    setHasReplacementFile(false);
    form.setFieldsValue({
      Description: document.Description,
      ShowInCompanyPortal:
        document.ShowInCompanyPortal?.toUpperCase() === 'Y' ? 'Y' : 'N',
    });

    try {
      setLoading(true);
      setPdfBase64(await getPdfContent(document.Id));
    } catch (error: any) {
      notification.error({
        message: error?.message ?? 'Unable to load document.',
        placement: 'topRight',
        duration: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPdf = () => {
    if (fileInput.current) {
      fileInput.current.value = '';
    }
    fileInput.current?.click();
  };

  const saveDocument = async () => {
    if (!canUpload) {
      notification.error({
        message: 'Appointment and department are required.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    const values = await form.validateFields();
    if (!editingDocument && isNullOrUndefinedOrBlank(pdfBase64)) {
      notification.error({
        message: 'Please select a file to upload.',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    try {
      setIsSaving(true);
      const res = await PostData(
        editingDocument ? 'UpdatePdfFile' : 'UploadPdfFile',
        {
          Id: editingDocument?.Id,
          fk_Appointments_Id: resolvedAppointmentId,
          fk_Departments_Id: resolvedDepartmentId,
          Pdf: editingDocument && !hasReplacementFile ? null : pdfBase64,
          ShowInCompanyPortal: values.ShowInCompanyPortal,
          Description: values.Description,
        },
      );

      if (res?.status !== 1) {
        notification.error({
          message: res?.message ?? 'Unable to save the document.',
          placement: 'topRight',
          duration: 3,
        });
        return;
      }

      notification.success({
        message: editingDocument
          ? 'Document successfully updated.'
          : 'Document successfully uploaded.',
        placement: 'topRight',
        duration: 3,
      });
      resetEditor();
      await loadDocuments();
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDocument = async (document: UploadedPdfRecord) => {
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
      message: 'Document successfully deleted.',
      placement: 'topRight',
      duration: 3,
    });
    if (selectedDocument?.Id === document.Id) {
      setSelectedDocument(undefined);
      setPreviewBase64(undefined);
    }
    await loadDocuments();
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

      await loadDocuments();
    } finally {
      setVisibilityUpdatingId(0);
    }
  };

  useEffect(() => {
    if (!open) return;
    void loadDocuments();
    resetEditor();
  }, [open, resolvedAppointmentId, resolvedPatientId]);

  useEffect(() => {
    if (!selectedDocument?.Id) {
      setPreviewBase64(undefined);
      return;
    }

    const loadPreview = async () => {
      try {
        setLoading(true);
        setPreviewBase64(await getPdfContent(selectedDocument.Id));
      } finally {
        setLoading(false);
      }
    };

    void loadPreview();
  }, [selectedDocument?.Id]);

  return (
    <>
      <Tooltip title={canUpload ? 'Upload PDF document' : 'Missing context'}>
        <Button
          className="mb-2"
          icon={<FaUpload />}
          disabled={!canUpload}
          onClick={() => setOpen(true)}
        >
          Upload
        </Button>
      </Tooltip>
      <Modal
        title="Uploaded PDF Documents"
        open={open}
        onCancel={() => setOpen(false)}
        footer={false}
        width={1180}
        centered
        destroyOnClose
      >
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="font-semibold">Documents</p>
                <p className="text-xs text-slate-500">
                  {documents.length} file(s) for this appointment
                </p>
              </div>
              <Button type="primary" onClick={openNewDocument}>
                New PDF
              </Button>
            </div>
            <DataTable
              value={documents}
              stripedRows
              size="small"
              filterDisplay="row"
              selectionMode="single"
              selection={selectedDocument}
              onSelectionChange={(event) =>
                setSelectedDocument(event.value as UploadedPdfRecord)
              }
              dataKey="Id"
              emptyMessage="No uploaded documents."
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
                      okText="Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                      onConfirm={() => void deleteDocument(document)}
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
              <Column field="Description" header="Description" filter />
              <Column field="Department" header="Department" filter />
              <Column field="DateAdded" header="Date Added" filter />
              <Column
                header="Portal"
                body={(document: UploadedPdfRecord) => {
                  const isVisible =
                    document.ShowInCompanyPortal?.toUpperCase() === 'Y';

                  return (
                    <Space
                      size={6}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Switch
                        size="small"
                        checked={isVisible}
                        loading={visibilityUpdatingId === document.Id}
                        onChange={(checked) =>
                          void handleVisibilityChange(document, checked)
                        }
                      />
                      <Tag color={isVisible ? 'green' : 'default'}>
                        {isVisible ? 'Shown' : 'Hidden'}
                      </Tag>
                    </Space>
                  );
                }}
              />
            </DataTable>
          </div>
          <div className="min-w-0 lg:col-span-5">
            <Form form={form} layout="vertical">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Form.Item
                  name="ShowInCompanyPortal"
                  label="Show in Portal"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Select.Option value="Y">Yes</Select.Option>
                    <Select.Option value="N">No</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  name="Description"
                  label="Description"
                  className="md:col-span-2"
                  rules={[{ required: true }]}
                >
                  <Input.TextArea rows={2} />
                </Form.Item>
              </div>
            </Form>
            <Space className="mb-3">
              <Button type="primary" onClick={handleSelectPdf}>
                {editingDocument ? 'Replace PDF' : 'Select PDF'}
              </Button>
              <Button
                type="primary"
                loading={isSaving}
                disabled={!editingDocument && !pdfBase64}
                onClick={() => void saveDocument()}
              >
                {editingDocument ? 'Update' : 'Upload'}
              </Button>
            </Space>
            <div>
              {loading ? (
                <div className="flex h-[430px] items-center justify-center">
                  <Loading size={64} />
                </div>
              ) : pdfBase64 || previewBase64 ? (
                <iframe
                  title="Uploaded document preview"
                  className="h-[430px] w-full rounded border border-slate-200"
                  src={pdfBase64 ?? previewBase64}
                />
              ) : (
                <div className="flex h-[260px] items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50">
                  <Empty description="Select or upload a PDF." />
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
      <input
        ref={fileInput}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={(event) => void onFilePicked(event.target.files)}
      />
    </>
  );
};

export default UploadDocumentButton;
