import React from "react";

interface MachineData {
  machine: string;
  operatingSystem: string;
  vmReadiness: string;
}

interface Props {
  data: MachineData[];
}

const CloudReadinessTable: React.FC<Props> = ({ data }) => (
  <div className="overflow-x-auto mt-8">
    <table className="min-w-full border border-gray-300">
      <thead className="bg-blue-900">
        <tr>
          <th className="px-4 py-2 border text-white font-bold">Machine</th>
          <th className="px-4 py-2 border text-white font-bold">Operating system</th>
          <th className="px-4 py-2 border text-white font-bold">Azure VM Readiness</th>
          <th className="px-4 py-2 border text-white font-bold">Azure Recommended Plan type</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} className="bg-white even:bg-gray-50">
            <td className="px-4 py-2 border">{row.machine}</td>
            <td className="px-4 py-2 border">{row.operatingSystem}</td>
            <td className="px-4 py-2 border">{row.vmReadiness}</td>
            <td className="px-4 py-2 border">Rehost (Lift-n-Shift)</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default CloudReadinessTable; 