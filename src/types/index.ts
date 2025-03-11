export type TUsers = {
  Id: number;
  Username?: string;
  EmailAddress?: string;
  Fullname?: string;
  Password?: string;
  PasswordChangeOn?: string;
  AddedBy?: string;
  DateAdded?: string;
  UpdatedBy?: string;
  DateUpdated?: string;
  DeletedBy?: string;
  DateDeleted?: string;
};

export type TModules = {
  Id: number;
  ModuleName?: string;
};

export type TUserModules = {
  Id: number;
  fk_Users_Id?: number;
  fk_Modules_Id?: number;
  AddedBy?: string;
  DarteAdded?: string;
  DeletedBy?: string;
  DateDeleted?: string;
};

export type TBranches = {
  Id?: number;
  Code: string;
  Name?: string;
  AddressLine1?: string;
  AddressLine2?: string;
  AddressLine3?: string;
  AddressLine4?: string;
  DeletedBy?: string;
  DateDeleted?: Date;
  UpdatedBy?: string;
  DateUpdated?: string;
  Active: boolean;
  Pathologist?: number;
  QualityControl?: number;
  PatientNoSuffix?: string;
};

export type TUserBranches = {
  Id: number;
  fk_Users_Id?: number;
  fk_Branches_Code?: string;
  AddedBy?: string;
  DateAdded?: string;
  DeletedBy?: string;
  DateDeleted?: string;
};

export type TItems = {
  Id: string;
  Id1?: number;
  fk_Branches_Code?: string;
  BarCodeNo?: string;
  Description?: string;
  GenericName?: string;
  fk_Departments_Id?: number;
  fk_LabTypes_Id?: number;
  fk_LabCategory_Id?: number;
  fk_SoaDescriptions_Id?: number;
  TestCode?: string;
  Discountable?: boolean;
  SalesAccount?: number;
  InventoryAccount?: number;
  ExpenseAccount?: number;
  Conversion?: number;
  UnitCostPerPc?: number;
  UnitCostPerBox?: number;
  UnitOfMeasureSmall?: string;
  UnitOfMeasureBig?: string;
  Dosage?: string;
  SellingPriceOpd?: number;
  SellingPriceHmo?: number;
  SellingPriceCompany?: number;
  SellingPriceSenior?: number;
  Inventoriable?: boolean;
  ForSale?: string;
  AddedBy?: string;
  DateAdded?: string;
  UpdatedBy?: string;
  DateUpdated?: string;
  DeletedBy?: string;
  DateDeleted?: string;
  CaviteOpd?: number;
  CaviteHmo?: number;
  CaviteSenior?: number;
  QCounter?: string;
  NeedAPhysician?: string;
  QCounters?: string[];
  IsPackage?: string;
  BeginningBalance?: number;
  fk_Items_Id?: number;
  Description2?: string;
  ForGender?: string;
  Strength?: string;
  ItemDescription?:string
};

export type TDepartments = {
  Id: number;
  Description?: string;
  AddedBy?: string;
  DateAdded?: string;
  UpdatedBy?: string;
  DateUpdated?: string;
  DeletedBy?: string;
  DateDeleted?: string;
  ShowInStockRequest: boolean;
  QueuingCode?: string;
  CounterName?: string;
};

export type TLabTypes = {
  Id: number;
  Description?: string;
  AddedBy?: string;
  DateAdded?: string;
  UpdatedBy?: string;
  DateUpdated?: string;
  DeletedBy?: string;
  DateDeleted?: string;
};

export type TLabCategory = {
  Id: number;
  Description?: string;
  AddedBy?: string;
  DateAdded?: Date;
  UpdatedBy?: string;
  DateUpdated?: Date;
  DeletedBy?: string;
  DateDeleted?: Date;
};

export type TSoaDescriptions = {
  Id: number;
  Description?: string;
  Orderx?: number;
  AddedBy?: string;
  DateAdded?: Date;
  UpdatedBy?: string;
  DateUpdated?: Date;
  DeletedBy?: string;
  DateDeleted?: Date;
};

export type TSettings = {
  Id: number;
  Code?: string;
  Description?: string;
  Value?: string;
  AddedBy?: string;
  DateAdded?: string;
};

export type TCounters = {
  Id: number;
  Code?: string;
  CounterName?: string;
  CurrentQ?: string;
  AddedBy?: string;
  DateAdded?: string;
  fk_QNo_Id?: number;
  IsCalled: boolean;
  Status?: string;
  Description?: string;
};

export type TPatientInformation = {
  Id: number;
  BranchCode?: string;
  PatientNo?: string;
  Lastname?: string;
  Firstname?: string;
  Middlename?: string;
  Suffix?: string;
  Name?: string;
  Street?: string;
  City?: string;
  Barangay?: string;
  Address?: string;
  DateOfBirth?: Date;
  Sex?: string;
  AgeYears?: string;
  AgeMonths?: string;
  AgeDays?: string;
  AddedBy?: string;
  DateAdded?: string;
  UpdatedBy?: string;
  DateUpdated?: string;
  DeletedBy?: string;
  DateDeleted?: string;
  MemberNo?: string;
  ContactNos?: string;
  Occupation?: string;
};

export type TAppointments = {
  Id?: number;
  BranchCode?: string;
  AppointmentNo?: string;
  fk_PatientInformation_Id?: number;
  fk_HmoCompany_Id?:number;
  Date?: Date;
  DateStr?: string;
  CivilStatus?: string;
  ReferredBy?: string;
  AgeYears?: string;
  AgeMonths?: string;
  AgeDays?: string;
  AppointmentType?: string;
  HmoCompany?: number;
  Diastolic?: string;
  Systolic?: string;
  Rr?: string;
  Hr?: string;
  Pr?: string;
  ChiefComplaint?: string;
  AddedBy?: string;
  DateAdded?: string;
  UpdatedBy?: string;
  DateUpdated?: string;
  PatientNo?: string;
  Name?: string;
  QueueNo?: string;
  IsSeniorOrPwd?: string;
  TransDate?: string;
  AppointmentTypeDesc?: string;
  Occupation?: string;
  MemberNo?: string;
  ContactNos?: string;
  DateOfBirthStr?: string;
  Address?: string;
  CurrentQStatus?: string;
  Sex?: string;
  WithMer?: string;
  Status?: string;
  ElapseTime?: number;
  Diagnosis?: string;
  DiscountType?:string;
  fk_DiscountTypes_Id?:number
  LoaApprovedBy?:string
  HmoCompanyName?:string
};

export type TAppointmentType = {
  Code?: string;
  Description?: string;
};

export type THmoCompany = {
  Id: number;
  Name?: string;
  Address?: string;
  ContactNos?: string;
  ContactPerson?: string;
  Designation?: string;
  EmailAddress?: string;
  AccountLimit?: number;
  Company?: boolean;
  Insurance?: boolean;
  ArAccount?: number;
  AddedBy?: string;
  DateAdded?: Date;
  UpdatedBy?: string;
  DateUpdated?: Date;
  DeletedBy?: string;
  DateDeleted?: Date;
  Type?: string;
};

export type TPrice = {
  Id?: number;
  Description?: string;
  Price?: number;
  Hmo?: number;
  Opd?: number;
  Senior?: number;
  Inventoriable?: string;
  Description2?: string;
  Qty01?: number;
  Qty02?: number;
  PriceCategory?: string;
  PaymentType?: string;
  HmoCompany?: string;
  NeedAPhysician?: string;
  fk_Doctors_Id?: number;
  fk_Items_Id?: number;
  ItemId?: number;
  PriceCategory2?: string;
  Department?: string;
  PriceCategoryCode?:string
};

export type TDoctors = {
  Id: number;
  Name?: string;
  Lastname?: string;
  Firstname?: string;
  Middlename?: string;
  Suffix?: string;
  Information1?: string;
  Information2?: string;
  Information3?: string;
  Information4?: string;
  Information5?: string;
  Specialty?: string;
  PhicNo?: string;
  PhicNoExpDate?: Date;
  LicNo?: string;
  LicNoExpDate?: Date;
  S2LicNo?: string;
  S2LicNoExpDate?: Date;
  Tax: number;
  ApAccount?: number;
  Tin?: string;
  Sonologist: boolean;
  Pathologist: boolean;
  Title?: string;
  AddedBy?: string;
  DateAdded?: string;
  UpdatedBy?: string;
  DateUpdated?: string;
  DeletedBy?: string;
  DateDeleted?: string;
  Type: string;
  NameAndSpecialty?: string;
  Department?: string;
  Cardiologist: boolean;
};

export type TCharges = {
  Id: number;
  fk_Appointments_Id?: number;
  fk_Items_Id?: number;
  Description?: string;
  Qty?: number;
  Price?: number;
  Discount?: number;
  Gross?: number;
  HmoAmount: number;
  CashPayment: number;
  Net?: number;
  PriceCategory?: string;
  fk_Doctors_Id?: number;
  fk_HmoCompany_Id?: number;
  fk_Payments_Main_Id?: number;
  AddedBy?: string;
  DateAdded?: string;
  DeletedBy?: string;
  DateDeleted?: string;
  HmoCompany?: string;
  fk_PaymentType_Id?: number;
  PaymentType?: string;
  DoctorName?: string;
  NeedPhysician?: string;
  Status?: string;
  StatusDate?: string;
  StatusSetBy?: string;
  StatusRemarks?: string;
  Diagnosis?:string
  Vat?:number
  PhicAmount?:number
};

export type TQCounters = {
  Id: number;
  Code?: string;
  Description?: string;
  AddedBy?: string;
  DateAdded?: string;
  UpdatedBy?: string;
  DateUpdated?: string;
  DeletedBy?: string;
  DateDeleted?: string;
  IsReceptionArea?: string;
  InOrder?: number;
  CurrentQ?: string;
  fk_QNo_Id?: number;
  Status?: string;
  StatusDescription?: string;
};

export type TPriceCategory = {
  Id: number;
  Code?: string;
  Description?: string;
  AddedBy?: string;
  DateAdded?: string;
  UpdatedBy?: string;
  DateUpdated?: string;
  DeletedBy?: string;
  DateDeleted?: string;
};

export type TPaymentType = {
  Id: number;
  Code?: string;
  Description?: string;
  AddedBy?: string;
  DateAdded?: string;
  UpdatedBy?: string;
  DateUpdated?: string;
  DeletedBy?: string;
  DateDeleted?: string;
};

export type TPricePerItem = {
  Id: number;
  fk_Branches_Code?: string;
  fk_Items_Id?: number;
  fk_PriceCategory_Id?: number;
  Price?: number;
  AddedBy?: string;
  DateAdded?: string;
  UpdatedBy?: string;
  DateUpdated?: string;
  DeletedBy?: string;
  DateDeleted?: string;
  PriceCategory?: string;
  Description?: string;
  Department?: string;
};

export type TQNo = {
  Id: number;
  Date?: string;
  Code?: string;
  Number?: number;
  QNo?: string;
  DateCalled?: Date;
  DateAccepted?: Date;
  CalledBy?: string;
  AcceptedBy?: string;
  Counter?: string;
  Status?: string;
  AppointmentId?: number;
};

export type TPaymentsMain = {
  Id: number;
  OrNo?: string;
  fk_Appointments_Id?: number;
  Date?: Date;
  Payee?: string;
  Amount?: number;
  Cash?: number;
  CreditCard1?: number;
  CreditCardNo1?: string;
  CreditCard2?: number;
  CreditCardNo2?: string;
  Check1?: number;
  CheckNo1?: string;
  Check2?: number;
  CheckNo2?: string;
  Gcash?: number;
  Maya?: number;
  AddedBy?: string;
  DateAdded?: string;
  DeletedBy?: string;
  DateDeleted?: string;
  DeleteReason?: string;
  UpdatedBy?:string;
  DateUpdated?:string;
  Amount2?:number;
};

export type TPaymentsDetail = {
  Id: number;
  fk_PaymentsMain_Id?: number;
  fk_Charges_Id?: number;
  Description?: string;
  Amount?: number;
};

export type TMer = {
  Id: number;
  AppointmentId?: number;
  MerNo?: string;
  MerDate?: Date;
  NatureOfExamination?: string;
  FamilyHistory?: string;
  Allergy?: string;
  PastDisease?: string;
  Others?: string;
  Accidents?: string;
  PresentSymptoms?: string;
  Bp?: string;
  Pr?: string;
  Temp?: string;
  Height?: string;
  Rr?: string;
  Weight?: string;
  VaLeft?: string;
  VaRight?: string;
  WithCorrectionLeft?: string;
  WithCorrectionRight?: string;
  Ishihara?: string;
  EentStatus?: string;
  EentRemarls?: string;
  ChestStatus?: string;
  ChestRemarks?: string;
  HeartStatus?: string;
  HeartRemarks?: string;
  AbdomenStatus?: string;
  AbdomenRemarks?: string;
  ExtremitiesStatus?: string;
  ExtremitiesRemarks?: string;
  OthersStatus?: string;
  OthersRemarks?: string;
  AttendingPhysician?: number;
  ChestXrayDate?: Date;
  ChestXrayStudyNo?: string;
  ChestXrayView?: string;
  ChestXrayResult?: string;
  UrinalysisDate?: Date;
  UrinalysisResult?: string;
  EcgDate?: Date;
  EcgResult?: string;
  CbcDate?: Date;
  CbcResult?: string;
  FecalysisDate?: Date;
  FecalysisResult?: string;
  DrugTestDate?: Date;
  DrugTestResult?: string;
  TreadmillDate?: Date;
  TreadmillResult?: string;
  EchoDate?: Date;
  EchoResult?: string;
  UltrasoundDate?: Date;
  UltrasoundResult?: string;
  ClassA?: boolean;
  ClassB?: boolean;
  ClassC?: boolean;
  ClassC1?: boolean;
  ClassC2?: boolean;
  ClassD?: boolean;
  ClassO?: boolean;
  Remarks?: string;
  OthersResult?: string;
  EvaluatedBy?: number;
  AddedBy?: string;
  DateAdded?: string;
  UpdatedBy?: string;
  DateUpdated?: string;
  Occupation?: string;
  ClassALabel?: string;
  ClassBLabel?: string;
  ClassCLabel?: string;
  ClassC1Label?: string;
  ClassC2Label?: string;
  ClassDLabel?: string;
  ClassOLabel?: string;
  Appointment?:string;
  AppointmentRemarks?:string;
  DisplaySignatureIfAny?:string;
};

export type TMerOthers = {
  Id: number;
  AppointmentId?: number;
  Date?: Date;
  Description?: string;
  Result?: string;
  AddedBy?: string;
  DateAdded?: string;
  UpdatedBy?: string;
  DateUpdated?: string;
  DeletedBy?: string;
  DateDeleted?: string;
};

export type TFamilyMedicalHistory = {
  Description?: string;
  Id?: number;
};

export type TMerOtherTests = {
  Id: number;
  AppointmentId?: number;
  StoolCs?: boolean;
  StoolCsValue?: string;
  HbSag?: boolean;
  HbSagValue?: string;
  HepaAIgM?: boolean;
  HepaAIgMValue?: string;
  AntiHav?: boolean;
  AntiHavValue?: string;
  AntiHbs?: boolean;
  AntiHbsValue?: string;
  HepaAIgG?: boolean;
  HepaAIgGValue?: string;
  Rpr?: boolean;
  RprValue?: string;
  AntiHavIgM?: boolean;
  AntiHavIgMValue?: string;
  Glucose?: boolean;
  GlucoseValue?: string;
  GlucoseValue2?: string;
  Creatinine?: boolean;
  CreatinineValue?: string;
  CreatinineValue2?: string;
  Urea?: boolean;
  UreaValue?: string;
  UreaValue2?: string;
  UricAcid?: boolean;
  UricAcidValue?: string;
  UricAcidValue2?: string;
  Cholesterol?: boolean;
  CholesterolValue?: string;
  CholesterolValue2?: string;
  Hdl?: boolean;
  HdlValue?: string;
  HdlValue2?: string;
  Sgpt?: boolean;
  SgptValue?: string;
  SgptValue2?: string;
  Globulin?: boolean;
  GlobulinValue?: string;
  GlobulinValue2?: string;
  Tsh?: boolean;
  TshValue?: string;
  TshValue2?: string;
  Ft4?: boolean;
  Ft4Value?: string;
  Ft4Value2?: string;
  Sodium?: boolean;
  SodiumValue?: string;
  SodiumValue2?: string;
  Triglycerides?: boolean;
  TriglyceridesValue?: string;
  TriglyceridesValue2?: string;
  Ldl?: boolean;
  LdlValue?: string;
  LdlValue2?: string;
  Sgot?: boolean;
  SgotValue?: string;
  SgotValue2?: string;
  HbA1c?: boolean;
  HbA1cValue?: string;
  HbA1cValue2?: string;
  Ft3?: boolean;
  Ft3Value?: string;
  Ft3Value2?: string;
  Potassium?: boolean;
  PotassiumValue?: string;
  PotassiumValue2?: string;
  AddedBy?: string;
  DateAdded?: string;
  UpdatedBy?: string;
  DateUpdated?: string;
};

export type TLaboratoryResultTemplates = {
  Id: number;
  BranchCode?: string;
  Description?: string;
  ReportDisplay?: string;
  ReportName?: string;
  AddedBy?: string;
  DateAdded?: string;
  UpdatedBy?: string;
  DateUpdated?: string;
  DeletedBy?: string;
  DateDeleted?: string;
};

export type TCurrentDepartment = {
  CounterCode: string;
  CounterName: string;
  CounterName2: string;
};

export type TLaboratoryResultMain = {
  Id: number;
  BranchCode?: string;
  AdmissionId?: number;
  ReportDate?: Date;
  Pathologist?: number;
  Medtech?: number;
  Qa?: number;
  Status: string;
  AddedBy?: string;
  DateAdded?: string;
  UpdatedBy?: string;
  DateUpdated?: string;
  DeletedBy?: string;
  DateDeleted?: string;
  DateReceived?: Date;
  ResultNo?: string;
  RequestingPhysician?: number;
  FinalizedBy?: string;
  DateFinalized?: string;
  Specimen?: string;
  Remarks?: string;
  TestPrinciple?: string;
  fk_LaboratoryResultTemplates_Id?: number;
  LabNo?: string;
  DateCollected?: Date;
};

export type TLaboratoryResultDetails = {
  Id: number;
  fk_LaboratoryResultMain_Id?: number;
  TestId?: number;
  IsUnit?: string;
  IsFrom?: number;
  IsTo?: number;
  IsReferenceValue?: string;
  ConventionalUnit?: string;
  ConventionalFrom?: number;
  ConventionalTo?: number;
  Conversion?: number;
  ResultSi?: string;
  ResultConventional?: string;
  IsBold?: string;
  IsUnderlined?: string;
  IsIndented?: string;
  Sequence?: number;
  Test?: string;
  IsWithResult?: string;
  DeletedBy?: string;
  DateDeleted?: string;
  ConventionalReferenceValue?: string;
  Flag?: string;
};

export type TPackageDetails = {
  Id: number;
  fk_Items_Id?: number;
  fk_Items_Id2?: number;
  AddedBy?: string;
  DateAdded?: string;
  DeletedBy?: string;
  DateDeleted?: string;
  UpdatedBy?:string;
  DateUpdated?:string;
};

export type TMedtechs = {
  Id: number;
  fk_tblBranches_Code?: string;
  Name?: string;
  LicenseNo?: string;
  AddedBy?: string;
  DateAdded?: string;
  UpdatedBy?: string;
  DateUpdated?: string;
  DeletedBy?: string;
  DateDeleted?: string;
  Username?: string;
};

export type TQCalling = {
  Id: number;
  QNo?: string;
  Counter?: string;
  Called?: string;
  Station?: string;
};

export type TRadiologyResult = {
  Id: number;
  BranchCode?: string;
  fk_Appointments_Id?: number;
  Department?: string;
  ReportDate?: Date;
  DateXrayed?: Date;
  DateRead?: Date;
  ResultNo?: string;
  StudyNo?: string;
  XrayNo?: string;
  RequestingPhysician?: number;
  Rad1?: number;
  Rad2?: number;
  Rad3?: number;
  Template?: number;
  Findings?: string;
  Impression?: string;
  Note?: string;
  AddedBy?: string;
  DateAdded?: string;
  UpdatedBy?: string;
  DateUpdated?: string;
  DeletedBy?: string;
  DateDeleted?: string;
  Pf: number;
  fk_Charges_Id?: number;
  PriceCategory?: string;
  ChargeDescription?: string;
  RadTech?: string;
  FinalizedBy?: string;
  DateFinalized?: string;
};

export type TFinalizeSettings = {
  mode: string;
  resultId: number;
  table: string;
};

export type TAccountsReceivable = { 
Id:number
fk_Appointments_Id?:number
fk_HmoCompany_Id?:number
Amount?:number
DatePaid?:Date
DatePaidStr?:string
Payment?:number
DatePaid2?:Date
DatePaid2Str?:string
Payment2?:number
Balance?:number
AddedBy?:string
DateAdded?:Date
DateAddedStr?:string
DeletedBy?:string
DateDeleted?:Date
DateDeletedStr?:string
PaymentEncodedBy?:string
PaymentDateEncoded?:Date
PaymentDateEncodedStr?:string
Name?:string
PatientName?:string
AppointmentId?:number
}

export type TArPayments = {
  Id:number
fk_AccountsReceivable_Id?:number
Date?:Date
DateStr?:string
Amount?:number
AddedBy?:string
DateAdded?:string
UpdatedBy?:string
DateUpdated?:string
DeletedBy?:string
DateDeleted?:string
Reference?:string
Ewt?:number
}

export type TChart =  {
Id:number
fk_Appointments_Id?:number
Specialist?:number
Started?:Date
Ended?:Date
RequestingPhysician?:number
AssessmentDiagnosis?:string
Icd10?:string
Ruv?:string
Planx?:string
AddedBy?:string
DateAdded?:Date
UpdatedBy?:string
DateUpdated?:Date
}

export type TICd10 = {
  Id:number
ACR_GROUPID:string
CODE_TYPE:string
ITEM_CODE:string
ITEM_DESC:string
LEVE1HOSP_CR1_AMT:number
LEVE1HOSP_CR2_AMT:number
LEVE2HOSP_CR1_AMT:number
LEVE2HOSP_CR2_AMT:number
LEVE3HOSP_CR1_AMT:number
LEVE3HOSP_CR2_AMT:number
ASC_CR1_AMT:number
ASC_CR2_AMT:number
PCF_CR1_AMT:number
PCF_CR2_AMT:number
MATCLINIC_CR1_AMT:number
MATCLINIC_CR2_AMT:number
FSDC_CR1_AMT:number
FSDC_CR2_AMT:number
TSEKAP_CR1_AMT:number
TSEKAP_CR2_AMT:number
PCB_CR1_AMT:number
PCB_CR2_AMT:number
RHU_CR1_AMT:number
RHU_CR2_AMT:number
OPMC_CR1_AMT:number
OPMC_CR2_AMT:number
TBDOTSC_CR1_AMT:number
TBDOTSC_CR2_AMT:number
ABTC_CR1_AMT:number
ABTC_CR2_AMT:number
}

export type TPhicDeductions = {
  Id:number
fk_Appointments_Id?:number
CaseRate1?:string
CaseRate1Desc?:string
CaseRate1Amount?:number
CaseRate2?:string
CaseRate2Desc?:string
CaseRate2Amount?:string
AddedBy?:string
DateAdded?:Date
UpdatedBy?:string
DateUpdated?:Date
}

export type TDiscounts = {
  Id:number
fk_Appointments_Id?:number
fk_DiscountTypes_Id?:number
Gross?:number
Rate?:number
Amount?:number
AddedBy?:string
DateAdded?:Date
UpdatedBy?:string
DateUpdated?:Date
DeletedBy?:string
DateDeleted?:Date
}
export type TDiscountTypes = { 
  Id:number
Description?:string
fk_ChartOfAccounts_AccountId?:number
AddedBy?:string
DateAdded?:Date
UpdatedBy?:string
DateUpdated?:Date
DeletedBy?:string
DateDeleted?:Date
PharmacyDiscount?:number
PhicDiscount?:number
LessVat:string
fk_DiscountTypes_Id?:number
}

export type THmoDeduction={
  Id:number
fk_Appointments_Id?:number
fk_HmoCompany_Id?:number
Amount?:number
AddedBy?:string
DateAdded?:Date
UpdatedBy?:string
DateUpdated?:Date
DeletedBy?:string
DateDeleted?:Date
}
export type TProfessionalFee = {
  Id:number
  fk_Appointments_Id?:number
  fk_Doctors_Id?:number
  fk_Discounttypes_Id?:number
  fk_HmoDeduction_Id?:number
  Amount?:number
  Vat?:number
  Discount?:number
  Phic?:number
  Hmo?:number
  Net?:number
  AddedBy?:string
  DateAdded?:Date
  UpdatedBy?:string
  DateUpdated?:Date
  DeletedBy?:string
  DateDeleted?:Date
  Doctor?:string
}

export type TSearchIcd = {
  Description?:string;
  Icd10?:string;
  Rvs?:string;
}

