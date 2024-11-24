import { createLazyFileRoute } from "@tanstack/react-router";
import { Tree, TreeDataNode, TreeProps } from "antd";

export const Route = createLazyFileRoute(
  "/_authenticated/forms/$AppointmentId"
)({
  component: () => <Forms />,
});

const Forms = () => {
  const treeData: TreeDataNode[] = [
    {
      title: "OFW",
      key: "trOfw",
      children: [
        {
          title: "OFW DOH Letter",
          key: "trgOfwDohLetter",
        },
        {
          title: "OFW Medical Certificate",
          key: "trgOfwMedicalCertificate",
        },
        {
          title: "OFW Medical Examination Report",
          key: "trgOfwMedicalExaminationReport",
        },
        {
          title: "OFW Tabulated Psychological Evaluation Form",
          key: "trgOfwTabulatedPsychological",
        },
      ],
    },
  ];
  const onSelect: TreeProps["onSelect"] = (selectedKeys, info) => {
    console.log("selected", selectedKeys, info);
  };
  return (
    <div>
      <div className="grid lg:grid-cols-6 gap-4">
        <div className="col-span-2">
          <Tree
            defaultExpandedKeys={["0-0-0", "0-0-1"]}
            defaultSelectedKeys={["0-0-0", "0-0-1"]}
            defaultCheckedKeys={["0-0-0", "0-0-1"]}
            onSelect={onSelect}
            treeData={treeData}
          />
        </div>
        <div>sdfasasdfasdffsdfsdfasdfasf</div>
      </div>
    </div>
  );
};
