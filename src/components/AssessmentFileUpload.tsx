import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText } from "lucide-react";

interface AssessmentFileUploadProps {
  id: string;
  label: string;
  accept: string;
  onChange: (file: File | null) => void;
  value: File | null;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const AssessmentFileUpload: React.FC<AssessmentFileUploadProps> = ({
  id,
  label,
  accept,
  onChange,
  value,
  inputRef,
}) => (
  <div>
    <Label htmlFor={id} className="flex items-center gap-2 mb-2">
      <FileText className="h-4 w-4" />
      {label}
    </Label>
    <Input
      id={id}
      type="file"
      accept={accept}
      onChange={e => onChange(e.target.files ? e.target.files[0] : null)}
      ref={inputRef}
    />
    {value && <p className="text-sm text-gray-500 mt-1">Selected: {value.name}</p>}
  </div>
);

export default AssessmentFileUpload;
