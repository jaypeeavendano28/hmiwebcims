import { createLazyFileRoute, useRouter } from '@tanstack/react-router';
import { Button, Form, Input, Modal, notification, Select, Space } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { isNullOrUndefinedOrBlank, PostData, WithAccess } from '../../helpers';
import { TAppointments, TDepartments, TPatientInformation } from '../../types';
import dayjs from 'dayjs';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import Loading from '../../components/loading';
import useAppStore from '../../store';
export const Route = createLazyFileRoute('/_authenticated/uploaddocuments/$Id')(
  {
    component: () => <UploadDocuments />,
  },
);
const UploadDocuments = () => {
  const store = useAppStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadedPdf, setUploadPdf] = useState([]);
  const [pdfBase64, setPdfBase64] = useState<string | undefined>();
  const [pdfBase642, setPdfBase642] = useState<string | undefined>();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [selectedRow, setSelectedRow] = useState<TAppointments | undefined>();
  const [selectedPdf, setSeletedPdf] = useState<any | undefined>();
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

  const handleGetPdfFile = async () => {
    try {
      setLoading(true);
      console.log('selectedPdf.Id', selectedPdf.Id);
      const res = await PostData('GetRecords', {
        sp: 'udp_GetPdfFile',
        parameters: {
          Id: selectedPdf.Id,
        },
      });
      if (res) {
        const x = res.parameters.lst[0].pdf;

        setPdfBase642(x);
        setLoading(false);
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 3,
      });
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
        setUploadPdf(res.parameters.lst);
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
  const handleUpload = async () => {
    try {
      const v = await form.validateFields();
      if (isNullOrUndefinedOrBlank(pdfBase64)) {
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
      const res = await PostData('UploadPdfFile', {
        fk_Appointments_Id: selectedRow!.Id,
        fk_Departments_Id: v.Department,
        Pdf: pdfBase64,
        ShowInCompanyPortal: v.ShowInCompanyPortal,
        Description: v.Description,
      });
      if (res) {
        if (res.status === 1) {
          notification.success({
            message: 'Successfully uploaded!',
            placement: 'topRight',
            duration: 3,
          });
          form.setFieldValue('Description', undefined);
          setPdfBase64(undefined);
        } else {
          notification.error({
            message: res.message,
            placement: 'topRight',
            duration: 3,
          });
        }
      }
    } catch (error) {}
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
  };
  const handleSelectPdf = () => {
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
          onClick={() => {
            setPdfBase64(undefined);
            form.resetFields();
            setShowModal(true);
          }}
        >
          New
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
          onSelectionChange={(e) => setSeletedPdf(e.value)}
          dataKey="Id"
        >
          <Column
            field="AppointmentType"
            header="Appointment Type"
            filter
          ></Column>
          <Column field="DateStr" header="Appointment Date" filter></Column>
          <Column field="Description" header="Description" filter></Column>
          <Column field="Department" header="Department" filter></Column>
          <Column field="AddedBy" header="Added By" filter></Column>
          <Column field="DateAdded" header="Date Added" filter></Column>
        </DataTable>
      </div>

      <div className="mt-2">
        {loading ? (
          <Loading size={64} />
        ) : (
          <iframe
            style={{
              width: '100%',
              height: '600px',
            }}
            src={pdfBase642}
          />
        )}
      </div>

      <Modal
        open={showModal}
        onCancel={() => {
          handleGetInitialized();
          setShowModal(false);
        }}
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
                Select a file
              </Button>
              <Button type="primary" onClick={handleUpload}>
                Upload
              </Button>
            </Space>
            <div className="mt-2">
              <iframe
                style={{
                  width: '100%',
                  height: '600px',
                }}
                src={pdfBase64}
              />
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
