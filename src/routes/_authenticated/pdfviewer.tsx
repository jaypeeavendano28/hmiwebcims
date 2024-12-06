import { createFileRoute } from "@tanstack/react-router";
import {
  PdfViewerComponent,
  Toolbar,
  Magnification,
  Navigation,
  LinkAnnotation,
  BookmarkView,
  ThumbnailView,
  Print,
  TextSelection,
  Annotation,
  TextSearch,
  FormFields,
  FormDesigner,
  Inject,
} from "@syncfusion/ej2-react-pdfviewer";
import { Button } from "antd";

const isDev = import.meta.env.DEV;
const prodApi = import.meta.env.VITE_PROD_API + "/api/";
const devApi = import.meta.env.VITE_DEV_API + "/api/";
const apiUrl = isDev ? devApi : prodApi;

export const Route = createFileRoute("/_authenticated/pdfviewer")({
  component: () => <PdfViewer />,
});

const PdfViewer = () => {
  // let viewer: PdfViewerComponent;
  //   const ajaxRequestInitiate = (args: any) => {
  //     var viewer = document.getElementById("container").ej2_instances[0];
  //     if (viewer.serverActionSettings.load === "Load") {
  //       viewer.setJsonData(args.JsonData);
  //     }
  //   };

  // function validateFormFields(args: any) {
  //   console.log(args);
  //   var errorMessage = "Required Field(s): ";
  //   var forms = viewer.formFieldCollections;
  //   var flag = false;
  //   var radioGroupName = "";
  //   for (var i = 0; i < forms.length; i++) {
  //    // var text = "";
  //     if (forms[i].isRequired == true) {
  //       // if (
  //       //   forms[i].type?.toString() == "Checkbox" &&
  //       //   forms[i].isChecked == false
  //       // ) {
  //       //   text = forms[i].name;
  //       // } else if (forms[i].type == "RadioButton" && flag == false) {
  //       //   radioGroupName = forms[i].name;
  //       //   if (forms[i].isSelected == true) flag = true;
  //       // } else if (
  //       //   forms[i].type.toString() != "Checkbox" &&
  //       //   forms[i].type != "RadioButton" &&
  //       //   forms[i].value == ""
  //       // ) {
  //       //   text = forms[i].name;
  //       // }
  //       // if (text != "") {
  //       //   if (errorMessage == "Required Field(s): ") {
  //       //     errorMessage += text;
  //       //   } else {
  //       //     errorMessage += ", " + text;
  //       //   }
  //       // }
  //     }
  //   }
  //   if (!flag && radioGroupName != "") {
  //     if (errorMessage == "Required Field(s): ") errorMessage += radioGroupName;
  //     else errorMessage += ", " + radioGroupName;
  //   }
  //   if (errorMessage != "Required Field(s): ") {
  //     viewer.showNotificationPopup(errorMessage);
  //   }
  // }
  // function change(args: any) {
  //   if (args.checked) {
  //     viewer.serviceUrl = "";
  //   } else {
  //     viewer.serviceUrl = apiUrl + "pdfviewer/";
  //   }
  //   viewer.dataBind();
  //   viewer.load(viewer.documentPath, "");
  // }
  //   const handlePrintResult = async (values: any) => {
  //     var pdfViewer = document.getElementById("container").ej2_instances[0];
  //     pdfViewer.serverActionSettings.download = "PrintImages";
  //     pdfViewer.print.print();
  //   };
  return (
    <div>
      <Button type="primary">Print</Button>
      {/* <div className="control-section">
        <PdfViewerComponent
          id="container"
          documentPath="https://cdn.syncfusion.com/content/PDFViewer/flutter-succinctly.pdf"
          serviceUrl={apiUrl + "pdfviewer/"}
          style={{ height: "640px" }}
          //   ajaxRequestInitiate={ajaxRequestInitiate}
        >
          <Inject
            services={[
              Toolbar,
              Magnification,
              Navigation,
              Print,
              TextSelection,
              TextSearch,
              FormFields,
              LinkAnnotation,
              Annotation,
            ]}
          />
        </PdfViewerComponent>
      </div> */}

      <PdfViewerComponent
        id="container"
        // ref={(scope) => {
        //   viewer = scope;
        // }}
        documentPath="PsychReportOfw.pdf"
        serviceUrl={apiUrl + "pdfviewer"}
        // validateFormFields={validateFormFields}
        enableFormFieldsValidation={true}
        showNotificationDialog={false}
        style={{ height: "640px" }}
      >
        <Inject
          services={[
            Toolbar,
            Magnification,
            Navigation,
            LinkAnnotation,
            BookmarkView,
            ThumbnailView,
            TextSelection,
            TextSearch,
            Annotation,
            FormFields,
            FormDesigner,
            Print,
          ]}
        />
      </PdfViewerComponent>
    </div>
  );
};
