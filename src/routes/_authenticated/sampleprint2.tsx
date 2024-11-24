import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
export const Route = createFileRoute("/_authenticated/sampleprint2")({
  component: () => <SamplePrint2 />,
});

const SamplePrint2 = () => {
  const [printing, setPrinting] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef });
  return (
    <>
      <div>
        <button
          onClick={() => {
            setPrinting(true);
            reactToPrintFn();
            setPrinting(false);
          }}
        >
          Print
        </button>
        <div ref={contentRef}>
          {/* <div className="text-center font-bold text-2xl"></div> */}
          {!printing && (
            <div className={`text-center font-bold text-2xl`}>
              <div>HMICare</div>
              <div className="text-5xl font-bold">Q-0001</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
