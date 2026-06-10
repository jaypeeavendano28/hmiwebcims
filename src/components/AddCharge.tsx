import {
  Button,
  Form,
  Input,
  InputNumber,
  List,
  notification,
  Popover,
  Select,
  Switch,
} from 'antd';
import { FC, useEffect, useState } from 'react';
import {
  TAppointments,
  TCharges,
  TDepartments,
  TDoctors,
  THmoCompany,
  TPaymentType,
  TPrice,
} from '../types';
import { isNullOrUndefinedOrBlank, PostData } from '../helpers';
import useAppStore from '../store';
import { useQuery } from '@tanstack/react-query';
import VirtualList from 'rc-virtual-list';
import Loading from './loading';
const ContainerHeight = 400;
type Props = {
  Id: string;
  ChargeDetails: TCharges | undefined;
  Gender: string;
  AppointmentDetails: TAppointments | undefined;
  onSaved?: () => void | Promise<void>;
};

const AddCharge: FC<Props> = ({
  Id,
  ChargeDetails,
  Gender,
  AppointmentDetails,
  onSaved,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [itemPopoverOpen, setItemPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [doctors, setDoctors] = useState<TDoctors[] | undefined>([]);
  const store = useAppStore();
  const [form] = Form.useForm();
  // const [items, setItems] = useState<TPrice[] | undefined>([]);
  const [selectedItem, setSelectedItem] = useState<TPrice | undefined>(
    undefined,
  );
  const hmoCompany = useQuery({
    queryKey: ['hmoCompany'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetHmoCompany',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (AppointmentDetails && AppointmentDetails.AppointmentType === 'MOB') {
      form.setFieldValue('PaymentType', 'MOB');
    }
  }, [AppointmentDetails]);

  const paymentTypes = useQuery({
    queryKey: ['paymentTypes'],
    queryFn: async () => {
      let res = await PostData('GetRecords', {
        sp: 'udp_GetPaymentType',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst;
      }
    },
    refetchOnWindowFocus: false,
  });

  const handleGetDoctors = async () => {
    const res = await PostData('GetRecords', {
      sp: 'udp_GetDoctors',
      parameters: {},
    });
    if (res) {
      setDoctors(res.parameters.lst);
    }
  };

  // const handleGetItems = async () => {
  //   let DepartmentId = '';
  //   if (form.getFieldValue('ShowAllCharges') === false) {
  //     if (AppointmentDetails?.AppointmentType === 'DIA') {
  //       DepartmentId = '1040';
  //     } else if (AppointmentDetails?.AppointmentType === 'AMB') {
  //       DepartmentId = '1041';
  //     }
  //   }

  //   try {
  //     const res = await PostData('GetRecords', {
  //       sp: 'udp_GetItemPrices2',
  //       parameters: {
  //         BranchCode: store.branchCode,
  //         SearchStr: isNullOrUndefinedOrBlank(form.getFieldValue('SearchStr'))
  //           ? ''
  //           : form.getFieldValue('SearchStr'),
  //         Gender: Gender,
  //         DepartmentId: DepartmentId,
  //       },
  //     });
  //     if (res) {
  //       setItems(res.parameters.lst);
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  const deptQuery: number | undefined = Form.useWatch('DepartmentId', form);
  const paymentTypeQuery: string | undefined = Form.useWatch(
    'PaymentType',
    form,
  );

  useEffect(() => {
    if (AppointmentDetails) {
      if (paymentTypeQuery === 'HMO') {
        form.setFieldValue('HmoCompany', AppointmentDetails?.fk_HmoCompany_Id);
      } else if (paymentTypeQuery === 'CTC' || paymentTypeQuery === 'MOB') {
        form.setFieldValue('HmoCompany', AppointmentDetails?.HmoCompany);
      } else if (paymentTypeQuery === 'CAR') {
        form.setFieldValue('HmoCompany', 2190);
      } else if (paymentTypeQuery === 'TMP') {
        form.setFieldValue('HmoCompany', 2186);
      } else {
        form.setFieldValue('HmoCompany', undefined);
      }
    }
  }, [paymentTypeQuery, AppointmentDetails]);

  console.log(AppointmentDetails);

  const hmoCompanyLabel =
    paymentTypeQuery === 'HMO'
      ? 'HMO'
      : paymentTypeQuery === 'CTC'
        ? 'Company'
        : 'HMO/Company';
  const showHmoCompany =
    paymentTypeQuery === 'HMO' ||
    paymentTypeQuery === 'CTC' ||
    paymentTypeQuery === 'MOB';
  const hmoCompanyOptions = hmoCompany.data?.filter((item: THmoCompany) => {
    if (paymentTypeQuery === 'HMO') {
      return item.Type === 'H';
    }
    if (paymentTypeQuery === 'CTC') {
      return item.Type === 'C';
    }
    return true;
  });

  const items = useQuery({
    queryKey: ['items_prices2', searchQuery, deptQuery],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetItemPrices2',
        parameters: {
          BranchCode: store.branchCode,
          SearchStr: searchQuery,
          Gender: Gender,
          DepartmentId: deptQuery ?? '',
        },
      });
      if (res) {
        return res.parameters.lst as TPrice[];
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
    enabled:
      isNullOrUndefinedOrBlank(ChargeDetails) &&
      searchQuery.trim().length > 0,
  });

  const handleSelect = (x: TPrice) => {
    setSelectedItem({
      ...x,
      Qty: x.Qty ?? 0,
    });
    form.setFieldValue('Price', x.Price);
    form.setFieldValue('Qty', 1);
    form.setFieldValue('OnHand', x.Qty ?? 0);
    setSearchQuery(x.Description ?? '');
    setItemPopoverOpen(false);
  };

  const departments = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await PostData('GetRecords', {
        sp: 'udp_GetDepartments',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst as TDepartments[];
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const handleAdd = async (v: TCharges) => {
    // console.log({ paymentType: v.PaymentType, hmoCompany: v.HmoCompany });
    if (
      (v.PaymentType === 'HMO' ||
        v.PaymentType === 'CTC' ||
        v.PaymentType === 'CAR' ||
        v.PaymentType === 'TMP' ||
        v.PaymentType === 'MOB') &&
      isNullOrUndefinedOrBlank(v.HmoCompany)
    ) {
      notification.error({
        message: 'Please select an Hmo/Company!',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    // if (selectedItem && selectedItem!.NeedAPhysician === "Y") {
    //   if (isNullOrUndefinedOrBlank(v.fk_Doctors_Id)) {
    //     notification.error({
    //       message: "Please select a doctor/physician!",
    //       placement: "topRight",
    //       duration: 3,
    //     });
    //     return;
    //   }
    // }

    v.HmoAmount = 0;

    if (
      v.PaymentType === 'CTC' ||
      v.PaymentType === 'HMO' ||
      v.PaymentType === 'CAR' ||
      v.PaymentType === 'TMP' ||
      v.PaymentType === 'MOB'
    ) {
      v.HmoAmount = v.Price!;
    }

    if (
      selectedItem?.Inventoriable === 'Y' &&
      (v.Qty === undefined || v.Qty <= 0)
    ) {
      notification.error({
        message: 'Quantity must be 1 for inventoriable items!',
        placement: 'topRight',
        duration: 3,
      });
      return;
    }

    // console.log({
    //   ...v,
    //   fk_Appointments_Id: Id,
    //   Id: ChargeDetails !== undefined ? ChargeDetails.Id : 0,
    //   Description: selectedItem!.Description,
    //   fk_HmoCompany_Id: isNullOrUndefinedOrBlank(v.HmoCompany)
    //     ? 0
    //     : v.HmoCompany,
    //   fk_Items_Id: selectedItem!.ItemId,
    //   fk_Charges_Id: selectedItem!.Id,
    //   PriceCategory: selectedItem!.PriceCategory2,
    // });

    setIsProcessing(true);
    const res = await PostData('SaveCharges', {
      ...v,
      fk_Appointments_Id: Id,
      Id: ChargeDetails !== undefined ? ChargeDetails.Id : 0,
      Description: selectedItem!.Description,
      fk_HmoCompany_Id: isNullOrUndefinedOrBlank(v.HmoCompany)
        ? 0
        : v.HmoCompany,
      fk_Items_Id: selectedItem!.ItemId,
      fk_Charges_Id: selectedItem!.Id,
      PriceCategory: selectedItem!.PriceCategory2,
    });

    if (res) {
      setIsProcessing(false);
      if (res.status === 1) {
        notification.success({
          message: 'Successfully saved!',
          placement: 'topRight',
          duration: 3,
        });

        const paymentType =
          AppointmentDetails?.AppointmentType === 'MOB' ? 'MOB' : undefined;
        form.setFieldsValue({
          Price: undefined,
          Qty: undefined,
          OnHand: undefined,
          Diagnosis: undefined,
          fk_Doctors_Id: undefined,
          PaymentType: paymentType,
        });
        setSearchQuery('');
        setSelectedItem(undefined);
        setItemPopoverOpen(false);
        await onSaved?.();
      } else {
        notification.error({
          message: res.message,
          placement: 'topRight',
          duration: 3,
        });
      }
    }
  };
  const onChange = () => {
    // handleGetItems();
  };
  useEffect(() => {
    handleGetDoctors();
    // handleGetItems();
    if (ChargeDetails !== undefined) {
      setSelectedItem(ChargeDetails);

      form.setFieldsValue({
        Price: ChargeDetails.Price,
        PaymentType: ChargeDetails.PaymentType,
        fk_Doctors_Id: ChargeDetails.fk_Doctors_Id,
        Diagnosis: ChargeDetails.Diagnosis,
      });
      setSearchQuery(ChargeDetails.Description ?? '');
    }
  }, []);

  const itemResults = (
    <div className="w-[min(700px,80vw)]">
      {items.isLoading ? (
        <div className="flex h-[160px] items-center justify-center">
          <Loading size={48} />
        </div>
      ) : (items.data ?? []).length === 0 ? (
        <div className="flex h-[120px] items-center justify-center text-gray-500">
          No charge items found.
        </div>
      ) : (
        <List>
          <VirtualList
            data={items.data ?? []}
            height={ContainerHeight}
            itemHeight={64}
            itemKey="Id"
          >
            {(item: TPrice) => (
              <List.Item
                key={item.Id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSelect(item)}
              >
                <List.Item.Meta
                  title={`${item.Description} - ${item.Price}`}
                  description={`${item.PriceCategory} - ${item.Department}`}
                />
              </List.Item>
            )}
          </VirtualList>
        </List>
      )}
    </div>
  );

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        scrollToFirstError
        onFinish={handleAdd}
      >
        <div>
          <div className="flex flex-wrap items-end gap-x-2">
              <Form.Item
                name="DepartmentId"
                label="Department"
                className="!mb-1"
              >
                <Select
                  allowClear
                  showSearch
                  className="!min-w-[250px]"
                  optionFilterProp="label"
                  options={departments.data?.map((d) => ({
                    value: d.Id,
                    label: d.Description,
                  }))}
                />
              </Form.Item>
              <Form.Item
                label="Item Description"
                className="!mb-1"
              >
                <Popover
                  content={itemResults}
                  open={itemPopoverOpen && searchQuery.trim().length > 0}
                  onOpenChange={(open) => {
                    if (!open) {
                      setItemPopoverOpen(false);
                    }
                  }}
                  trigger={[]}
                  placement="bottomLeft"
                >
                  <Input
                    className="!min-w-[320px]"
                    allowClear
                    placeholder="Type an item description to search"
                    disabled={!isNullOrUndefinedOrBlank(ChargeDetails)}
                    value={searchQuery}
                    onChange={(event) => {
                      const value = event.target.value;
                      const hasSearchText = value.trim().length > 0;

                      setSearchQuery(value);
                      setItemPopoverOpen(hasSearchText);

                      if (
                        selectedItem ||
                        !hasSearchText
                      ) {
                        setSelectedItem(undefined);
                        form.setFieldsValue({
                          Price: undefined,
                          Qty: undefined,
                          OnHand: undefined,
                          fk_Doctors_Id: undefined,
                        });
                      }
                    }}
                  />
                </Popover>
              </Form.Item>

              <Form.Item
                label="Show all charges?"
                name="ShowAllCharges"
                valuePropName="checked"
                className="!mb-1"
              >
                <Switch
                  onChange={onChange}
                  checkedChildren="Yes"
                  unCheckedChildren="No"
                  defaultChecked
                />
              </Form.Item>
          </div>

          <div className="mt-3">
            {selectedItem && (
              <div className="font-bold">
                {selectedItem.Description2 !== undefined
                  ? selectedItem.Description2
                  : selectedItem.Description}
              </div>
            )}

            <div className="grid md:grid-cols-5 gap-4">
              <Form.Item name="Price" label="Price" className="col-span-1">
                <Input readOnly className="font-bold" />
              </Form.Item>
              <Form.Item
                label="Payment Type"
                name="PaymentType"
                rules={[
                  {
                    required: true,
                    message: 'Payment type is required!',
                  },
                ]}
                className="col-span-2"
              >
                <Select
                  style={{ width: '100%' }}
                  showSearch
                  allowClear
                  filterOption={(input, option) =>
                    (
                      option!.children
                        ?.toString()
                        .toLocaleLowerCase() as unknown as string
                    ).includes(input.toLocaleLowerCase())
                  }
                  disabled={
                    !isNullOrUndefinedOrBlank(ChargeDetails) &&
                    ChargeDetails!.PaymentType === 'CSH' &&
                    ChargeDetails!.Net === 0
                  }
                >
                  {paymentTypes.data &&
                    paymentTypes.data.map((d: TPaymentType) => (
                      <Select.Option
                        key={d.Code}
                        value={d.Code}
                        title={d.Description}
                      >
                        {d.Description}
                      </Select.Option>
                    ))}
                </Select>
              </Form.Item>
              {selectedItem &&
                selectedItem.Inventoriable &&
                selectedItem.Inventoriable === 'Y' && (
                  <Form.Item name="OnHand" label="On Hand">
                    <Input readOnly />
                  </Form.Item>
                )}
              <Form.Item
                name="Qty"
                label="Quantity"
                rules={[{ required: true, message: 'Quantity is required!' }]}
              >
                <InputNumber
                  max={
                    selectedItem &&
                    selectedItem.Inventoriable &&
                    selectedItem.Inventoriable === 'Y'
                      ? selectedItem.Qty
                      : undefined
                  }
                />
              </Form.Item>
            </div>
            <div>
              <Form.Item name="Diagnosis" label="Diagnosis">
                <Input.TextArea rows={2} />
              </Form.Item>
            </div>

            <div>
              {/* {(paymentType === 'HMO' || paymentType === 'CTC') && (
                <div>
                  <Form.Item name="HmoCompany" label="Hmo/Company">
                    <Select
                      style={{ width: '100%' }}
                      showSearch
                      allowClear
                      filterOption={(input, option) =>
                        (
                          option!.children
                            ?.toString()
                            .toLocaleLowerCase() as unknown as string
                        ).includes(input.toLocaleLowerCase())
                      }
                    >
                      {hmoCompany.data &&
                        hmoCompany.data.map((e: THmoCompany) => (
                          <Select.Option key={e.Id} value={e.Id} title={e.Name}>
                            {e.Name}
                          </Select.Option>
                        ))}
                    </Select>
                  </Form.Item>
                </div>
              )} */}

              <Form.Item
                name="HmoCompany"
                label={hmoCompanyLabel}
                hidden={!showHmoCompany}
              >
                <Select
                  style={{ width: '100%' }}
                  showSearch
                  allowClear
                  filterOption={(input, option) =>
                    (
                      option!.children
                        ?.toString()
                        .toLocaleLowerCase() as unknown as string
                    ).includes(input.toLocaleLowerCase())
                  }
                >
                  {hmoCompanyOptions &&
                    hmoCompanyOptions.map((e: THmoCompany) => (
                      <Select.Option key={e.Id} value={e.Id} title={e.Name}>
                        {e.Name}
                      </Select.Option>
                    ))}
                </Select>
              </Form.Item>
            </div>
            <div>
              {selectedItem && selectedItem!.NeedAPhysician === 'Y' && (
                <Form.Item label="Physician" name="fk_Doctors_Id">
                  <Select
                    style={{ width: '100%' }}
                    showSearch
                    allowClear
                    filterOption={(input, option) =>
                      (
                        option!.children
                          ?.toString()
                          .toLocaleLowerCase() as unknown as string
                      ).includes(input.toLocaleLowerCase())
                    }
                  >
                    {doctors &&
                      doctors.map((d: TDoctors) => (
                        <Select.Option
                          key={d.Id}
                          value={d.Id}
                          title={d.NameAndSpecialty}
                        >
                          {d.NameAndSpecialty}
                        </Select.Option>
                      ))}
                  </Select>
                </Form.Item>
              )}
            </div>
            <div className="flex justify-end items-center">
              <Button
                type="primary"
                htmlType="submit"
                disabled={!selectedItem}
                loading={isProcessing}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default AddCharge;
