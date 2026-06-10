import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Divider, Tabs, Tag, Space, Tooltip } from 'antd';
import { apiUrl, PostData } from '../../../helpers';
import axios from 'axios';
import { DataTable } from 'primereact/datatable';
import Cookies from 'js-cookie';
import { Column } from 'primereact/column';
import { FilterMatchMode } from 'primereact/api';
import { useState } from 'react';
import dayjs from 'dayjs';
import AddPortalCompany from '../../../components/add-portal-company';
import UpdatePortalAccValidity from '../../../components/update-portal-acc-validity';
import { TBranches } from '../../../types';

export const Route = createFileRoute('/_authenticated/utilities/portal')({
  component: () => <Portal />,
});

const Portal = () => {
  return (
    <div className="cardBackGround">
      <Divider>Portal</Divider>
      <Tabs
        items={[
          {
            label: 'Company',
            key: 'company',
            children: <Company />,
          },
          {
            label: 'Patient',
            key: 'patient',
            children: <Patient />,
          },
        ]}
      />
    </div>
  );
};

export type CompanyDataType = {
  Id: string;
  CompanyId: number;
  CompanyName: string;
  Email: string;
  ContactNo: string | null;
  Password: string;
  DateCreated: string;
  ValidUntil: string;
  IsDefaultPassword: false;
};
export type PatientDataType = {
  BranchCode: string;
  ContactNo: string;
  DateDeleted: string;
  DeletedBy: string;
  Email: string;
  Firstname: string;
  Id: string;
  IsVerify: boolean;
  Lastname: string;
  Middlename: string;
  Password: string;
  PatientId: number;
  PatientNo: string;
};

const Company = () => {
  const [filters] = useState({
    CompanyName: { value: null, matchMode: FilterMatchMode.CONTAINS },
    Email: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const companies = useQuery({
    queryKey: ['portal_company'],
    queryFn: async () => {
      const res = await axios
        .get(`${apiUrl}portal/GetCompany`, {
          headers: {
            Authorization: ('Bearer ' +
              Cookies.get('WebCimsTokenId')) as string,
          },
        })
        .then((res) => res.data);
      return res.parameters as CompanyDataType[];
    },
    staleTime: 0,
  });

  const actionBodyTemplate = (data: CompanyDataType) => {
    return (
      <Space>
        <Tooltip title="Update Account Validity">
          <UpdatePortalAccValidity data={data} />
        </Tooltip>
      </Space>
    );
  };

  return (
    <div className="space-y-3">
      <AddPortalCompany />
      <DataTable
        value={companies.data}
        paginator
        rows={50}
        emptyMessage="No Records!"
        stripedRows
        size="small"
        filters={filters}
        filterDisplay="row"
      >
        <Column
          field="action"
          header="Action"
          body={(data: any) => actionBodyTemplate(data)}
        ></Column>
        <Column field="CompanyName" header="Name" filter sortable />
        <Column field="Email" header="Email" filter sortable />
        <Column
          field="ValidUntil"
          header="Valid Until"
          body={(data: CompanyDataType) => {
            if (dayjs(data.ValidUntil).toDate() >= dayjs().toDate()) {
              return (
                <Tag color="#87d068">
                  {dayjs(data.ValidUntil).format('MM/DD/YYYY')}
                </Tag>
              );
            } else {
              return (
                <Tag color="#f50">
                  {dayjs(data.ValidUntil).format('MM/DD/YYYY')}
                </Tag>
              );
            }
          }}
        />
        <Column
          field="IsDefaultPassword"
          header="Is Using Default Password"
          body={(data: CompanyDataType) =>
            data.IsDefaultPassword ? 'Yes' : 'No'
          }
        />
      </DataTable>
    </div>
  );
};

const Patient = () => {
  const [filters] = useState({
    Firstname: { value: null, matchMode: FilterMatchMode.CONTAINS },
    Lastname: { value: null, matchMode: FilterMatchMode.CONTAINS },
    Middlename: { value: null, matchMode: FilterMatchMode.CONTAINS },
    PatientNo: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const branches = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await PostData('GetRecords2', {
        sp: 'udp_GetBranches',
        parameters: {},
      });
      if (res) {
        return res.parameters.lst as TBranches[];
      }
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const patients = useQuery({
    queryKey: ['portal_patient'],
    queryFn: async () => {
      const res = await axios
        .get(`${apiUrl}portal/GetPatient`, {
          headers: {
            Authorization: ('Bearer ' +
              Cookies.get('WebCimsTokenId')) as string,
          },
        })
        .then((res) => res.data);
      return res.parameters as PatientDataType[];
    },
    staleTime: 0,
  });
  console.log(patients.data);

  return (
    <DataTable
      value={patients.data}
      paginator
      rows={50}
      emptyMessage="No Records!"
      stripedRows
      size="small"
      filters={filters}
      filterDisplay="row"
    >
      <Column field="PatientNo" header="Patient No." filter sortable />
      <Column field="Lastname" header="Last name" filter sortable />
      <Column field="Firstname" header="First name" filter sortable />
      <Column
        field="Middlename"
        header="Middle name"
        filter
        sortable
        body={(data: PatientDataType) =>
          data.Middlename.length < 1 ? '-' : data.Middlename
        }
      />
      <Column
        field="BranchCode"
        header="Branch"
        filter
        sortable
        body={(data: PatientDataType) => {
          const branch = branches.data?.filter(
            (item) => item.Code === data.BranchCode,
          )[0];

          return branch ? branch.Name : data.BranchCode;
        }}
      />
      <Column
        field="IsVerify"
        header="Is Verify"
        body={(data: PatientDataType) =>
          data.IsVerify ? (
            <Tag color="#87d068">YES</Tag>
          ) : (
            <Tag color="#f50">NO</Tag>
          )
        }
      />
    </DataTable>
  );
};
