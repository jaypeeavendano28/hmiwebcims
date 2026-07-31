import { Button, Divider, Image, Input, Modal, Space, notification } from "antd";
import { useEffect, useRef, useState } from "react";

type SignatureBuilderProps = {
  title?: string;
  buttonLabel?: string;
  currentImage?: string | null;
  disabled?: boolean;
  fullName?: string;
  licenseNo?: string;
  positionTitle?: string;
  defaultTitle?: string;
  titleReadOnly?: boolean;
  onLicenseNoChange?: (value: string) => void;
  onTitleChange?: (value: string) => void;
  onSave: (image: string) => Promise<boolean | void> | boolean | void;
};

const canvasWidth = 900;
const canvasHeight = 250;
const signatureOverlapBottom = 142;

const getText = (value?: string) => (value ?? "").trim().toUpperCase();

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const loadImage = (source: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load signature image."));
    image.src = source;
  });

const setFittedFont = (
  context: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
  minFontSize: number,
  fontWeight: string,
  maxWidth: number
) => {
  let nextFontSize = fontSize;

  do {
    context.font = `${fontWeight} ${nextFontSize}px "Times New Roman", serif`;
    nextFontSize -= 1;
  } while (
    context.measureText(text).width > maxWidth &&
    nextFontSize > minFontSize
  );
};

const drawCenteredPrcText = (
  context: CanvasRenderingContext2D,
  licenseNo: string,
  y: number,
  maxWidth: number
) => {
  const label = "PRC LICENSE NO. ";
  let fontSize = 32;

  do {
    context.font = `500 ${fontSize}px "Times New Roman", serif`;
    const labelWidth = context.measureText(label).width;
    context.font = `700 ${fontSize}px "Times New Roman", serif`;
    const numberWidth = context.measureText(licenseNo).width;

    if (labelWidth + numberWidth <= maxWidth || fontSize <= 22) {
      const startX = (canvasWidth - labelWidth - numberWidth) / 2;
      context.textAlign = "left";
      context.font = `500 ${fontSize}px "Times New Roman", serif`;
      context.fillText(label, startX, y);
      context.font = `700 ${fontSize}px "Times New Roman", serif`;
      context.fillText(licenseNo, startX + labelWidth, y);
      context.textAlign = "center";
      return;
    }

    fontSize -= 1;
  } while (fontSize >= 22);
};

const SignatureBuilder = ({
  title = "Signature",
  buttonLabel = "Create e-sign",
  currentImage,
  disabled,
  fullName,
  licenseNo,
  positionTitle,
  defaultTitle = "",
  titleReadOnly = false,
  onLicenseNoChange,
  onTitleChange,
  onSave,
}: SignatureBuilderProps) => {
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [uploadedSignature, setUploadedSignature] = useState("");
  const [preview, setPreview] = useState<string | null>(currentImage ?? null);
  const [licenseText, setLicenseText] = useState(getText(licenseNo));
  const [titleText, setTitleText] = useState(
    getText(positionTitle) || getText(defaultTitle)
  );

  useEffect(() => {
    setPreview(currentImage ?? null);
  }, [currentImage]);

  useEffect(() => {
    setLicenseText(getText(licenseNo));
  }, [licenseNo]);

  useEffect(() => {
    setTitleText(getText(positionTitle) || getText(defaultTitle));
  }, [defaultTitle, positionTitle]);

  const handlePickFile = () => {
    fileInput.current?.click();
  };

  const handleFileChange = async (files: FileList | null) => {
    const file = files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      notification.error({
        message: "Invalid image file!",
        placement: "topRight",
        duration: 3,
      });
      return;
    }

    if (file.size >= 2000000) {
      notification.error({
        message: "File must not be greater than 2MB!",
        placement: "topRight",
        duration: 3,
      });
      return;
    }

    const image = await fileToDataUrl(file);
    setUploadedSignature(image);
  };

  const generateSignatureImage = async () => {
    const nameText = getText(fullName);
    const nextLicenseText = getText(licenseText);
    const nextTitleText = getText(titleText);

    if (nameText === "") {
      notification.error({
        message: "Name is required!",
        placement: "topRight",
        duration: 3,
      });
      return undefined;
    }

    if (uploadedSignature === "") {
      notification.error({
        message: "E-signature image is required!",
        placement: "topRight",
        duration: 3,
      });
      return undefined;
    }

    if (nextLicenseText === "") {
      notification.error({
        message: "PRC license no. is required!",
        placement: "topRight",
        duration: 3,
      });
      return undefined;
    }

    if (nextTitleText === "") {
      notification.error({
        message: "Position/title is required!",
        placement: "topRight",
        duration: 3,
      });
      return undefined;
    }

    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      return undefined;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvasWidth, canvasHeight);

    const signatureImage = await loadImage(uploadedSignature);
    const maxSignatureWidth = 620;
    const maxSignatureHeight = 142;
    const scale = Math.min(
      maxSignatureWidth / signatureImage.width,
      maxSignatureHeight / signatureImage.height,
      1.6
    );
    const signatureWidth = signatureImage.width * scale;
    const signatureHeight = signatureImage.height * scale;
    const signatureTop = Math.max(0, signatureOverlapBottom - signatureHeight);

    context.drawImage(
      signatureImage,
      (canvasWidth - signatureWidth) / 2,
      signatureTop,
      signatureWidth,
      signatureHeight
    );

    context.fillStyle = "#111111";
    context.textAlign = "center";
    context.textBaseline = "middle";

    setFittedFont(context, nameText, 38, 24, "700", canvasWidth - 70);
    context.fillText(nameText, canvasWidth / 2, 132);

    drawCenteredPrcText(context, nextLicenseText, 164, canvasWidth - 100);

    context.beginPath();
    context.moveTo(45, 186);
    context.lineTo(canvasWidth - 45, 186);
    context.lineWidth = 4;
    context.strokeStyle = "#111111";
    context.stroke();

    setFittedFont(context, nextTitleText, 36, 24, "500", canvasWidth - 100);
    context.fillText(nextTitleText, canvasWidth / 2, 216);

    return canvas.toDataURL("image/jpeg", 0.95);
  };

  const handlePreview = async () => {
    const image = await generateSignatureImage();

    if (image) {
      setPreview(image);
    }
  };

  const handleSave = async () => {
    const image = await generateSignatureImage();

    if (!image) {
      return;
    }

    const result = await onSave(image);

    if (result !== false) {
      setPreview(image);
      setShowBuilder(false);
    }
  };

  return (
    <div>
      <Divider>{title}</Divider>
      <div className="flex justify-center">
        <Image src={preview as string} preview={false} />
      </div>

      <div className="flex justify-center mt-3">
        <Button type="primary" onClick={() => setShowBuilder(true)} disabled={disabled}>
          {buttonLabel}
        </Button>
      </div>

      <Modal
        open={showBuilder}
        onCancel={() => setShowBuilder(false)}
        footer={null}
        width={900}
        destroyOnClose={false}
      >
        <div className="grid grid-cols-1 gap-3">
          <div className="flex justify-center">
            <Image src={preview as string} preview={false} />
          </div>
          <Input
            value={licenseText}
            onChange={(event) => {
              const nextValue = getText(event.target.value);
              setLicenseText(nextValue);
              onLicenseNoChange?.(nextValue);
            }}
            placeholder="PRC License No."
            disabled={disabled}
          />
          <Input
            value={titleText}
            onChange={(event) => {
              const nextValue = getText(event.target.value);
              setTitleText(nextValue);
              onTitleChange?.(nextValue);
            }}
            placeholder="Position/Title"
            disabled={disabled}
            readOnly={titleReadOnly}
          />
        </div>

        <div className="flex justify-center mt-3">
          <Space wrap>
            <Button type="primary" onClick={handlePickFile} disabled={disabled}>
              Upload e-sign
            </Button>
            <Button onClick={handlePreview} disabled={disabled}>
              Preview
            </Button>
            <Button type="primary" onClick={handleSave} disabled={disabled}>
              Save signature
            </Button>
          </Space>
        </div>
        {uploadedSignature && (
          <div className="flex justify-center mt-3">
            <Image
              src={uploadedSignature}
              preview={false}
              style={{ maxHeight: 120, objectFit: "contain" }}
            />
          </div>
        )}
      </Modal>

      <input
        style={{ display: "none" }}
        ref={fileInput}
        type="file"
        accept=".jpg,.jpeg,.png"
        onChange={(event) => handleFileChange(event.target.files)}
      />
    </div>
  );
};

export default SignatureBuilder;
