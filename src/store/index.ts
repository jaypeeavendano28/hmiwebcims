import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { TItems, TPatientInformation } from '../types';

type AppState = {
  withMaterialManagement: boolean;
  setWithMaterialManagement: (withMaterialManagement: boolean) => void;
  withMaterialManagementPurchaseOrders: boolean;
  setWithMaterialManagementPurchaseOrders: (withAccess: boolean) => void;
  withMaterialManagementReceiving: boolean;
  setWithMaterialManagementReceiving: (withAccess: boolean) => void;
  withMaterialManagementStockIssuance: boolean;
  setWithMaterialManagementStockIssuance: (withAccess: boolean) => void;
  withMaterialManagementQuantityOnHand: boolean;
  setWithMaterialManagementQuantityOnHand: (withAccess: boolean) => void;
  withUtilities: boolean;
  setWithUtilities: (withUtilities: boolean) => void;
  withQueuing: boolean;
  setWithQueuing: (withQueuing: boolean) => void;
  withAR: boolean;
  setWithAR: (withAR: boolean) => void;
  withPharmacy: boolean;
  setWithPharmacy: (withPharmacy: boolean) => void;
  withPatientMasterList: boolean;
  setWithPatientMasterList: (withPatientMasterList: boolean) => void;
  withConsultations: boolean;
  setWithConsultations: (withConsultations: boolean) => void;
  withHemoAmb: boolean;
  setWithHemoAmb: (withHemoAmb: boolean) => void;
  withRegisteredPatients: boolean;
  setWithRegisteredPatients: (withRegisteredPatients: boolean) => void;
  withApppointments: boolean;
  setWithApppointments: (withApppointments: boolean) => void;
  withCashier: boolean;
  setWithCashier: (withCashier: boolean) => void;
  withReceptionHemo: boolean;
  setWithReceptionHemo: (withReceptionHemo: boolean) => void;
  withReceptionDiagnostics: boolean;
  setWithReceptionDiagnostics: (withReceptionDiagnostics: boolean) => void;
  itemDetails: TItems;
  setItemDetails: (itemDetails: TItems) => void;
  patientDetails: TPatientInformation;
  setPatientDetails: (patientDetails: TPatientInformation) => void;
  patientId: number;
  setPatientId: (patientId: number) => void;
  branchCode: string;
  setBranchCode: (branchCode: string) => void;
  hideSideBar: string;
  setHideSideBar: (hideSideBar: string) => void;
  userId: string;
  setUserId: (userId: string) => void;
  apiUrlClaimsAssure: string;
  setApiUrlClaimsAssure: (apiUrlClaimsAssure: string) => void;
  username: string;
  setUsername: (username: string) => void;
  // fullname: string;
  // setFullname: (fullname: string) => void;
  tokenIdWebCims: string;
  setTokenIdWebCims: (tokenIdWebCims: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  lastQListQuery: {
    dateFrom?: string;
    dateTo?: string;
    searchText?: string;
    departmentId?: number;
    expandedRowKeys?: string[];
  };
  setLastQListQuery: (lastQListQuery: {
    dateFrom?: string;
    dateTo?: string;
    searchText?: string;
    departmentId?: number;
    expandedRowKeys?: string[];
  }) => void;
};
const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        withMaterialManagement: false,
        setWithMaterialManagement: (withMaterialManagement) =>
          set((state) => ({ ...state, withMaterialManagement })),
        withMaterialManagementPurchaseOrders: false,
        setWithMaterialManagementPurchaseOrders: (withAccess) =>
          set((state) => ({
            ...state,
            withMaterialManagementPurchaseOrders: withAccess,
          })),
        withMaterialManagementReceiving: false,
        setWithMaterialManagementReceiving: (withAccess) =>
          set((state) => ({
            ...state,
            withMaterialManagementReceiving: withAccess,
          })),
        withMaterialManagementStockIssuance: false,
        setWithMaterialManagementStockIssuance: (withAccess) =>
          set((state) => ({
            ...state,
            withMaterialManagementStockIssuance: withAccess,
          })),
        withMaterialManagementQuantityOnHand: false,
        setWithMaterialManagementQuantityOnHand: (withAccess) =>
          set((state) => ({
            ...state,
            withMaterialManagementQuantityOnHand: withAccess,
          })),
        withUtilities: false,
        setWithUtilities: (withUtilities) =>
          set((state) => ({ ...state, withUtilities })),
        withQueuing: false,
        setWithQueuing: (withQueuing) =>
          set((state) => ({ ...state, withQueuing })),
        withAR: false,
        setWithAR: (withAR) => set((state) => ({ ...state, withAR })),
        withPharmacy: false,
        setWithPharmacy: (withPharmacy) =>
          set((state) => ({ ...state, withPharmacy })),
        withPatientMasterList: false,
        setWithPatientMasterList: (withPatientMasterList) =>
          set((state) => ({ ...state, withPatientMasterList })),
        withConsultations: false,
        setWithConsultations: (withConsultations) =>
          set((state) => ({ ...state, withConsultations })),
        withHemoAmb: false,
        setWithHemoAmb: (withHemoAmb) =>
          set((state) => ({ ...state, withHemoAmb })),
        withRegisteredPatients: false,
        setWithRegisteredPatients: (withRegisteredPatients) =>
          set((state) => ({ ...state, withRegisteredPatients })),
        withApppointments: false,
        setWithApppointments: (withApppointments) =>
          set((state) => ({ ...state, withApppointments })),
        withCashier: false,
        setWithCashier: (withCashier) =>
          set((state) => ({ ...state, withCashier })),
        withReceptionHemo: false,
        setWithReceptionHemo: (withReceptionHemo) =>
          set((state) => ({ ...state, withReceptionHemo })),
        withReceptionDiagnostics: false,
        setWithReceptionDiagnostics: (withReceptionDiagnostics) =>
          set((state) => ({ ...state, withReceptionDiagnostics })),
        itemDetails: { Id: '' },
        setItemDetails: (itemDetails) =>
          set((state) => ({ ...state, itemDetails })),
        patientDetails: { Id: 0 },
        setPatientDetails: (patientDetails) =>
          set((state) => ({ ...state, patientDetails })),
        patientId: 0,
        setPatientId: (patientId) => set((state) => ({ ...state, patientId })),
        branchCode: '',
        setBranchCode: (branchCode) =>
          set((state) => ({ ...state, branchCode })),
        hideSideBar: 'N',
        setHideSideBar: (hideSideBar) =>
          set((state) => ({ ...state, hideSideBar })),
        userId: '',
        setUserId: (userId) => set((state) => ({ ...state, userId })),
        apiUrlClaimsAssure: '',
        setApiUrlClaimsAssure: (apiUrlClaimsAssure) =>
          set((state) => ({ ...state, apiUrlClaimsAssure })),
        username: '',
        setUsername: (username) => set((state) => ({ ...state, username })),
        // fullname: '',
        // setFullname: (fullname) => set((state) => ({ ...state, fullname })),
        tokenIdWebCims: '',
        setTokenIdWebCims: (tokenIdWebCims) =>
          set((state) => ({ ...state, tokenIdWebCims })),
        collapsed: false,
        setCollapsed: (collapsed) => set((state) => ({ ...state, collapsed })),
        lastQListQuery: {},
        setLastQListQuery: (lastQListQuery) =>
          set((state) => ({ ...state, lastQListQuery })),
      }),
      { name: 'AppStore' },
    ),
  ),
);

export default useAppStore;
