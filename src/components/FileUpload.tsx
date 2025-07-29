import React from "react";
import * as XLSX from "xlsx";

interface MachineData {
  machine: string;
  operatingSystem: string;
  vmReadiness: string;
}

interface CloudReadinessRow {
  machine: string;
  operatingSystem: string;
  vmReadiness: string;
  azurePlan: string;
}

interface FileUploadProps {
  onDataParsed: (data: { machineData: MachineData[]; cloudReadiness: CloudReadinessRow[] }) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataParsed }) => {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets["All_Assessed_Machines"];
    if (!sheet) return;
    const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    // Try to find the correct column names (case-insensitive, fallback to first match)
    const machineKey = Object.keys(json[0] || {}).find(k => k.toLowerCase().includes("machine")) || "Machine";
    const osKey = Object.keys(json[0] || {}).find(k => k.toLowerCase().includes("operating system")) || "Operating system";
    const readinessKey = Object.keys(json[0] || {}).find(k => k.toLowerCase().includes("readiness")) || "Azure VM Readiness";
    // For the table
    const machineData: MachineData[] = (json as any[]).map(row => ({
      machine: row[machineKey] || "",
      operatingSystem: row[osKey] || "",
      vmReadiness: row[readinessKey] || "",
    }));
    // For the report
    const cloudReadiness: CloudReadinessRow[] = (json as any[]).map(row => ({
      machine: row[machineKey] || "",
      operatingSystem: row[osKey] || "",
      vmReadiness: row[readinessKey] || "",
      azurePlan: "Rehost (Lift-n-Shift)",
    }));
    onDataParsed({ machineData, cloudReadiness });
  };

  return (
    <div className="my-4">
      <label className="block mb-2 font-semibold">Upload Azure Migrate Report (Excel):</label>
      <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} className="block" />
    </div>
  );
};

export default FileUpload; 