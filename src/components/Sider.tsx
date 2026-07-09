import { BiHome, BiUser } from "react-icons/bi";
import { GoTools } from "react-icons/go";
import { Layout, Menu, MenuProps, Modal } from "antd";
import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "../hooks/userAuth";
import useAppStore from "../store";
import { isNullOrUndefinedOrBlank } from "./../helpers/index";
import Cookies from "js-cookie";
import { MdAddToQueue, MdFolderShared, MdOutlineNoteAlt } from "react-icons/md";
import { FaRegCalendarPlus } from "react-icons/fa";
import { BsJournalMedical } from "react-icons/bs";
import logo from "../assets/webcimslogo.png";
import { FaMoneyBill } from "react-icons/fa6";
import { GiMedicines } from "react-icons/gi";
import { TbReportMoney } from "react-icons/tb";
import { FiArchive } from "react-icons/fi";
import { GrTransaction } from "react-icons/gr";

const Sider = () => {
  const store = useAppStore();
  const auth = useAuth();
  const router = useRouter();
  const [showLogOut, setShowLogOut] = useState(false);

  const items: MenuProps["items"] = [
    {
      label: store.username,
      key: "mnuUserInfo",
      icon: <BiUser />,
      children: [
        {
          label: <Link to="/updateuserprofile">User Profile</Link>,
          key: "mnuUserProfile",
        },
        {
          label: <Link to="/changepassword">Change Password</Link>,
          key: "mnuChangePassword",
        },
        {
          label: "Logout",
          key: "mnuLogOut",
          onClick: () => setShowLogOut(true),
        },
      ],
    },
    {
      label: <Link to="/dashboard">Home</Link>,
      key: "mnuHome",
      icon: <BiHome />,
    },
    store.withReceptionDiagnostics
      ? {
          label: (
            <Link
              to="/reception/$Code"
              params={{
                Code: "1",
              }}
            >
              Reception (Diagnostics)
            </Link>
          ),
          key: "mnuReception1",
          icon: <MdOutlineNoteAlt />,
        }
      : null,
    store.withReceptionHemo
      ? {
          label: (
            <Link
              to="/reception/$Code"
              params={{
                Code: "2",
              }}
            >
              Reception (Hemo/Amb.)
            </Link>
          ),
          key: "mnuReception2",
          icon: <MdOutlineNoteAlt />,
        }
      : null,
    store.withCashier
      ? {
          label: <Link to="/cashier">Cashier</Link>,
          key: "mnuCashier",
          icon: <FaMoneyBill />,
        }
      : null,
    store.withApppointments
      ? {
          label: <Link to="/appointments">Appointments</Link>,
          key: "mnuAppointments",
          icon: <FaRegCalendarPlus />,
        }
      : null,
    store.withRegisteredPatients
      ? {
          label: (
            <Link
              to="/registeredpatients/$station"
              params={{
                station: "1",
              }}
            >
              Department List
            </Link>
          ),
          key: "mnuRegisteredPatients",
          icon: <FaRegCalendarPlus />,
        }
      : null,
    store.withHemoAmb
      ? {
          label: (
            <Link
              to="/registeredpatients/$station"
              params={{
                station: "0",
              }}
            >
              Hemodialyis/Ambulatory Patients
            </Link>
          ),
          key: "mnuHemoPatients",
          icon: <FaRegCalendarPlus />,
        }
      : null,
    store.withConsultations
      ? {
          label: (
            <Link
              to="/registeredpatients/$station"
              params={{
                station: "2",
              }}
            >
              Consultations
            </Link>
          ),
          key: "mnuConsultations",
          icon: <FaRegCalendarPlus />,
        }
      : null,
    {
      label: "Material Management",
      key: "mm",
      icon: <FiArchive />,
      children: [
        {
          label: (
            <Link to="/material-management/purchase-order/">
              Purchase Orders
            </Link>
          ),
          key: "mmPO",
        },
        {
          label: <Link to="/material-management/receiving/">Receiving</Link>,
          key: "mmRR",
        },
        {
          label: (
            <Link to="/material-management/stock-issuance">Stock Issuance</Link>
          ),
          key: "mmSI",
        },
        {
          label: (
            <Link to="/material-management/quantity-on-hand/">Qty on Hand</Link>
          ),
          key: "mmQOH",
        },
      ],
    },
    store.withPatientMasterList
      ? {
          label: <Link to="/listofpatients">Patient Master List</Link>,
          key: "mnuListOfPatients",
          icon: <BsJournalMedical />,
        }
      : null,
    store.withPharmacy
      ? {
          label: <Link to="/pharmacy">Pharmacy</Link>,
          key: "mnuPharmacy",
          icon: <GiMedicines />,
        }
      : null,
    store.withAR
      ? {
          label: <Link to="/ar">Accounts Receivable</Link>,
          key: "mnuAr",
          icon: <TbReportMoney />,
        }
      : null,
    {
      label: <Link to="/reports">Reports</Link>,
      key: "reports",
      icon: <MdFolderShared />,
    },
    {
      label: <Link to="/transaction-summary">Transaction Summary</Link>,
      key: "transaction-summary",
      icon: <GrTransaction />,
    },
    store.withQueuing
      ? {
          label: "Queuing",
          key: "mnuQueuing",
          icon: <MdAddToQueue />,
          children: [
            {
              label: <Link to="/getqno">Get Queue No.</Link>,
              key: "mnuGetQ",
            },
            {
              label: (
                <Link to="/getqnohemo">Get Queue No. (Hemo/Ambulatory)</Link>
              ),
              key: "mnuGetQHemo",
            },
            {
              label: (
                <Link
                  to="/queuing/$Code"
                  params={{
                    Code: "1",
                  }}
                >
                  Queuing Diagnostics
                </Link>
              ),
              key: "mnuQueuingDiag",
            },
            // {
            //   label: (
            //     <Link
            //       to="/queuing/$Code"
            //       params={{
            //         Code: "2",
            //       }}
            //     >
            //       Queuing Consultation
            //     </Link>
            //   ),
            //   key: "mnuQueuing2",
            // },
            {
              label: (
                <Link
                  to="/queuing/$Code"
                  params={{
                    Code: "0",
                  }}
                >
                  Queuing Hemodialysis/Ambulatory
                </Link>
              ),
              key: "mnuQueuing0",
            },

            // {
            //   label: <Link to="/queuing">Queuing (Hemo/Ambulatory)</Link>,
            //   key: "mnuQueuingHemo",
            // },
          ],
        }
      : null,
    store.withUtilities
      ? {
          label: "Utilities",
          key: "mnuUtilities",
          icon: <GoTools />,
          children: [
            {
              label: <Link to="/analytes">Analytes</Link>,
              key: "mnuAnalytes",
            },
            {
              label: <Link to="/branches">Branches</Link>,
              key: "mnuBranches",
            },
            {
              label: <Link to="/doctors">Doctors</Link>,
              key: "mnuDoctors",
            },
            {
              label: <Link to="/utilities/hmocompany">Hmo/Companies</Link>,
              key: "mnuHmoCompanies",
            },
            {
              label: <Link to="/items">Items</Link>,
              key: "mnuItems",
            },
            {
              label: (
                <Link to="/laboratorytemplates">Laboratory Templates</Link>
              ),
              key: "mnuLaboratoryTemplates",
            },
            {
              label: <Link to="/medtechs">Medical Technologist</Link>,
              key: "mnuMedTechs",
            },
            {
              label: <Link to="/utilities/paymenttype">Payment Type</Link>,
              key: "mnuPaymentType",
            },
            {
              label: <Link to="/utilities/pricecategory">Price Category</Link>,
              key: "mnuPriceCategory",
            },
            {
              label: <Link to="/qcounters">Queue Counters</Link>,
              key: "mnuQueueCounters",
            },
            {
              label: <Link to="/radtechs">Rad Techs.</Link>,
              key: "mnuRadTechs",
            },

            {
              label: <Link to="/users">Users</Link>,
              key: "mnuUsers",
            },
            {
              label: <Link to="/utilities/vendors">Vendors</Link>,
              key: "mnuVendors",
            },
            {
              label: <Link to="/xraytemplates">X-Ray Templates</Link>,
              key: "mnuXrayTemplates",
            },
            {
              label: <Link to="/utilities/portal">Portal</Link>,
              key: "portal",
            },
          ],
        }
      : null,
  ];
  function handleLogOut() {
    setShowLogOut(false);
    Cookies.remove("WebCimsTokenId");
    store.setTokenIdWebCims("");
    store.setUsername("");
    auth.signOut();
    router.navigate({
      to: "/login",
    });
  }
  if (isNullOrUndefinedOrBlank(store.tokenIdWebCims)) {
    return null;
  }
  return (
    <div className="flex max-w-full">
      <div className="bg-[#001529]">
        <Layout.Sider
          // width={200}
          collapsible
          onCollapse={() => {
            store.setCollapsed(!store.collapsed);
          }}
          // style={{
          //   // overflow: "auto",
          //   //height: "100vh",
          //   position: "fixed",
          //   left: 0,
          //   top: 0,
          //   bottom: 0,
          // }}
        >
          {!store.collapsed && (
            // <div className="ml-10 mt-2 text-white font-bold text-lg">
            //   WebCims
            // </div>
            <div className="logo">
              <Link to="/">
                <img src={logo} alt="logo" style={{ height: 50, width: 250 }} />
              </Link>
            </div>
          )}

          <Menu
            className="min-h-screen"
            theme="dark"
            mode="inline"
            defaultSelectedKeys={["mnuHome"]}
            defaultOpenKeys={["sub1"]}
            items={items}
            //   onClick={handleMenuClick}
          />
        </Layout.Sider>
      </div>
      <Modal
        open={showLogOut}
        onCancel={() => setShowLogOut(false)}
        destroyOnClose
        okText="Yes"
        cancelText="No"
        onOk={handleLogOut}
      >
        <div>Logout application now?</div>
      </Modal>
    </div>
  );
};

export default Sider;
