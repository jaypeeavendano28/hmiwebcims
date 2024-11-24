import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { TItems, TPatientInformation } from "../types";

type AppState = {
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
  tokenIdWebCims: string;
  setTokenIdWebCims: (tokenIdWebCims: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
};
const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        itemDetails: { Id: "" },
        setItemDetails: (itemDetails) =>
          set((state) => ({ ...state, itemDetails })),
        patientDetails: { Id: 0 },
        setPatientDetails: (patientDetails) =>
          set((state) => ({ ...state, patientDetails })),
        patientId: 0,
        setPatientId: (patientId) => set((state) => ({ ...state, patientId })),
        branchCode: "",
        setBranchCode: (branchCode) =>
          set((state) => ({ ...state, branchCode })),
        hideSideBar: "N",
        setHideSideBar: (hideSideBar) =>
          set((state) => ({ ...state, hideSideBar })),
        userId: "",
        setUserId: (userId) => set((state) => ({ ...state, userId })),
        apiUrlClaimsAssure: "",
        setApiUrlClaimsAssure: (apiUrlClaimsAssure) =>
          set((state) => ({ ...state, apiUrlClaimsAssure })),
        username: "",
        setUsername: (username) => set((state) => ({ ...state, username })),
        tokenIdWebCims: "",
        setTokenIdWebCims: (tokenIdWebCims) =>
          set((state) => ({ ...state, tokenIdWebCims })),
        collapsed: false,
        setCollapsed: (collapsed) => set((state) => ({ ...state, collapsed })),
      }),
      { name: "AppStore" }
    )
  )
);

export default useAppStore;
