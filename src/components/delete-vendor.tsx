import { App, Button } from 'antd';
import { TVendor } from '../types';
import { BiTrash } from 'react-icons/bi';

import { useQueryClient } from '@tanstack/react-query';
import { PostData } from '../helpers';

export default function DeleteVendor({ data }: { data: TVendor }) {
  const { modal, notification } = App.useApp();

  const queryClient = useQueryClient();
  const handleDelete = () => {
    modal.confirm({
      title: `Are you sure to delete vendor ${data.Name}`,
      okButtonProps: {
        danger: true,
      },
      okText: 'Delete',

      onOk: async () => {
        try {
          const res = await PostData(`DeleteSuppliers?Id=${data.Id}`, {});

          if (res.status !== 1) {
            notification.error({
              message: res.message,
              placement: 'topRight',
            });

            return Promise.reject();
          }

          notification.success({
            message: 'Vendor Successfully Deleted!',
            placement: 'topRight',
          });

          queryClient.invalidateQueries({
            queryKey: ['vendors'],
          });

          return Promise.resolve();
        } catch (err) {
          notification.error({
            message: 'Something went wrong please try again later',
            placement: 'topRight',
          });

          return Promise.reject();
        }
      },
    });
  };
  return (
    <>
      <Button danger type="text" size="small" onClick={handleDelete}>
        <BiTrash />
      </Button>
    </>
  );
}
