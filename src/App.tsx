import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { useAuth } from "./hooks/userAuth";
import { useEffect } from "react";
import useAppStore from "./store";
import { WithAccess } from "./helpers";
const router = createRouter({
  routeTree,
  context: { authentication: undefined! },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
const App = () => {
  const authentication = useAuth();
  const store = useAppStore();
    const handleWithAccess = async (ModuleId: number) => {
      const res = await WithAccess({
        sp: "udp_WithAccess",
        parameters: {
          Username: store.username,
          ModuleId: ModuleId,
        },
      });
      if (res) {
        if (res.status === 1) {
          return true;
        } else {
          return false;
        }
      }
    };
    const handleCheckAccess = async () => {
      let x = await handleWithAccess(38); ///Reception (Diagnosistics)
      store.setWithReceptionDiagnostics(x!);
      x = await handleWithAccess(39); ///Reception (Hemodialysis/Ambulatory)
      store.setWithReceptionHemo(x!);
      x = await handleWithAccess(40); ///Cashier
      store.setWithCashier(x!);
      x = await handleWithAccess(41); ///Apppointments
      store.setWithApppointments(x!);
      x = await handleWithAccess(42); ///Registered Patients
      store.setWithRegisteredPatients(x!);
      x = await handleWithAccess(43); ///Hemodialysis/Ambulatory
      store.setWithHemoAmb(x!);
      x = await handleWithAccess(44); ///Consultations
      store.setWithConsultations(x!);
      x = await handleWithAccess(45); ///Patient Master List
      store.setWithPatientMasterList(x!);
      x = await handleWithAccess(46); ///Pharmacy
      store.setWithPharmacy(x!);
      x = await handleWithAccess(47); ///Accounts Receivable
      store.setWithAR(x!);
      x = await handleWithAccess(48); ///Queuing
      store.setWithQueuing(x!);
      x = await handleWithAccess(49); ///Utilities
      store.setWithUtilities(x!);
    }
    
  useEffect(() => {
    store.setHideSideBar("N");
    handleCheckAccess();
  }, []);


  return (
    <div>
      <RouterProvider router={router} context={{ authentication }} />
    </div>
  );
};

export default App;
