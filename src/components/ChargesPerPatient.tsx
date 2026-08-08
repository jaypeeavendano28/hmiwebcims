import { FC, useEffect, useState } from 'react';
import { isNullOrUndefinedOrBlank, PostData } from '../helpers';
import {
  Button,
  Form,
  Input,
  Modal,
  notification,
  Select,
  Space,
  Tooltip,
} from 'antd';
import { BiEdit, BiNotepad } from 'react-icons/bi';
import { BsCalendar3, BsCheckCircleFill, BsCircleFill } from 'react-icons/bs';
import dayjs from 'dayjs';

type Props = {
  AppointmentId?: number;
  handleNewResult?: (data: any) => void;
  Key?: string;
  Counter?: string[];
  activeChargeId?: number | string;
};
const ChargesPerPatient: FC<Props> = ({
  AppointmentId,
  handleNewResult,
  Key,
  Counter,
  activeChargeId,
}) => {
  const [selectedRow, setSelectedRow] = useState<any | undefined>({});
  const [form] = Form.useForm();
  const [showModal, setShowModal] = useState(false);
  const [charges, setCharges] = useState([]);
  const isIncludedCounter = (qCounter?: string) =>
    Counter?.includes(String(qCounter ?? '').trim()) ?? false;
  const filteredCharges = charges.filter((c: any) =>
    isIncludedCounter(c.QCounter),
  );
  const selectedChargeId = Number(activeChargeId ?? 0);

  const getStatusDetails = (status?: unknown) => {
    const statusText = String(status ?? '').trim();
    const normalizedStatus = statusText.toUpperCase();

    if (normalizedStatus === 'DONE') {
      return {
        label: 'Done',
        icon: <BsCheckCircleFill className="text-teal-600" />,
        textClassName: 'text-slate-700',
      };
    }

    if (normalizedStatus === 'TO FOLLOW') {
      return {
        label: 'To Follow',
        icon: <BsCircleFill className="text-slate-500" size={9} />,
        textClassName: 'text-slate-600',
      };
    }

    if (normalizedStatus === 'DEFERRED') {
      return {
        label: 'Deferred',
        icon: <BsCircleFill className="text-rose-500" size={9} />,
        textClassName: 'text-rose-600',
      };
    }

    return {
      label: statusText || 'N/A',
      icon: <BsCircleFill className="text-slate-300" size={9} />,
      textClassName: 'text-slate-400',
    };
  };

  const formatStatusDate = (value?: unknown) => {
    const statusDateText = String(value ?? '').trim();
    if (isNullOrUndefinedOrBlank(statusDateText)) return '';

    const statusDate = dayjs(statusDateText);
    return statusDate.isValid()
      ? statusDate.format('MM/DD/YYYY h:mm A')
      : statusDateText;
  };

  const isPackageCharge = (value?: unknown) => {
    const packageValue = String(value ?? '')
      .trim()
      .toUpperCase();

    return (
      packageValue === 'Y' || packageValue === 'TRUE' || packageValue === '1'
    );
  };

  const handleGetCharges = async () => {
    try {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetChargesByAppointmentIdForResult',
        parameters: {
          AppointmentId: AppointmentId,
        },
      });
      console.log('udp_GetChargesByAppointmentIdForResult', res);
      if (res) {
        setCharges(res.parameters.lst);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const actionBodyTemplate = (data: any) => {
    //  store.setItemDetails(data);
    return (
      <Space size={2} className="justify-end">
        {isIncludedCounter(data.QCounter) && (
          <Tooltip title="Set Status">
            <Button
              type="link"
              className="!h-6 !w-6 !p-0 !text-slate-600 hover:!text-blue-600"
              icon={<BiEdit size={16} />}
              onClick={() => {
                setSelectedRow(data);
                form.resetFields();
                if (!isNullOrUndefinedOrBlank(data.Status)) {
                  form.setFieldsValue({
                    Status: data.Status,
                    StatusRemarks: data.StatusRemarks,
                  });
                }

                setShowModal(true);
              }}
            />
          </Tooltip>
        )}

        {isIncludedCounter(data.QCounter) &&
          handleNewResult &&
          !isPackageCharge(data.IsPackage) && (
            <>
              <Tooltip title="Result">
                <Button
                  type="link"
                  className="!h-6 !w-6 !p-0 !text-slate-600 hover:!text-blue-600"
                  icon={<BiNotepad size={16} />}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleNewResult(data);
                  }}
                />
              </Tooltip>
            </>
          )}
      </Space>
    );
  };

  const handleSetStatus = async (v: any) => {
    try {
      const res = await PostData('SaveSetStatus', {
        Id: selectedRow.Id,
        Status: v.Status,
        StatusRemarks: v.StatusRemarks,
        QCounter: selectedRow.QCounter,
      });

      if (res) {
        if (res.status === 1) {
          notification.success({
            message: 'Successfully Saved!',
            placement: 'topRight',
            duration: 3,
          });
          handleGetCharges();
          setShowModal(false);
        } else {
          notification.error({
            message: res.message,
            placement: 'topRight',
            duration: 3,
          });
        }
      }
    } catch (error: any) {
      notification.error({
        message: error.message,
        placement: 'topRight',
        duration: 3,
      });
    }
  };
  useEffect(() => {
    handleGetCharges();
  }, [AppointmentId, Key]);
  return (
    <div>
      <div className="overflow-hidden rounded border border-slate-200 bg-white text-xs shadow-sm">
        <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(92px,0.9fr)_56px] items-center gap-2 bg-slate-100 px-3 py-2 text-[10px] font-bold uppercase text-slate-600">
          <span>Examination</span>
          <span>Status</span>
          <span className="text-right">Action</span>
        </div>

        {filteredCharges.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs font-medium text-slate-400">
            No Records!
          </div>
        ) : (
          filteredCharges.map((charge: any, index) => {
            const statusDetails = getStatusDetails(charge.Status);
            const statusDate = formatStatusDate(charge.StatusDate);
            const isActiveCharge =
              selectedChargeId > 0 && Number(charge.Id) === selectedChargeId;

            return (
              <div
                key={charge.Id ?? `${charge.Description}-${index}`}
                className={`grid grid-cols-[minmax(0,1.1fr)_minmax(92px,0.9fr)_56px] items-start gap-2 border-t px-3 py-3 transition-colors ${
                  isActiveCharge
                    ? 'border-sky-200 bg-sky-100/80 shadow-[inset_3px_0_0_#0284c7]'
                    : `border-slate-100 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                      }`
                }`}
              >
                <div className="min-w-0">
                  <div
                    className={`truncate text-[11px] font-bold uppercase ${
                      isActiveCharge ? 'text-sky-950' : 'text-sky-800'
                    }`}
                  >
                    {charge.Description || '-'}
                  </div>
                  {charge.PackageName && (
                    <div className="mt-1 truncate text-[10px] font-semibold uppercase text-slate-500">
                      {charge.PackageName}
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div
                    className={`flex items-center gap-1.5 text-[11px] font-semibold ${statusDetails.textClassName}`}
                  >
                    {statusDetails.icon}
                    <span className="truncate">{statusDetails.label}</span>
                  </div>
                  {statusDate && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                      <BsCalendar3 size={10} />
                      <span className="truncate">{statusDate}</span>
                    </div>
                  )}
                  {charge.StatusSetBy && (
                    <div className="mt-1 truncate text-[10px] text-slate-400">
                      {charge.StatusSetBy}
                    </div>
                  )}
                  {charge.StatusRemarks && (
                    <Tooltip title={charge.StatusRemarks}>
                      <div className="mt-1 truncate text-[10px] font-medium text-amber-600">
                        {charge.StatusRemarks}
                      </div>
                    </Tooltip>
                  )}
                </div>

                <div className="flex justify-end">
                  {actionBodyTemplate(charge)}
                </div>
              </div>
            );
          })
        )}
      </div>
      <Modal
        open={showModal}
        destroyOnClose
        footer={false}
        onCancel={() => setShowModal(false)}
        width={500}
        title={`Set status for ${selectedRow.Description}`}
      >
        <Form form={form} onFinish={handleSetStatus} layout="vertical">
          <Form.Item
            name="Status"
            label="Status"
            rules={[
              {
                required: true,
                message: 'Status is required!',
              },
            ]}
          >
            <Select>
              <Select.Option key="DONE" value="DONE">
                DONE
              </Select.Option>
              <Select.Option key="TO FOLLOW" value="TO FOLLOW">
                TO FOLLOW
              </Select.Option>
              <Select.Option key="DEFERRED" value="DEFERRED">
                DEFERRED
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="StatusRemarks"
            label="Remarks"
            normalize={(v) => v.toUpperCase()}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (
                    getFieldValue('Status') === 'DEFERRED' &&
                    isNullOrUndefinedOrBlank(value)
                  ) {
                    return Promise.reject('Remarks is required!');
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default ChargesPerPatient;
