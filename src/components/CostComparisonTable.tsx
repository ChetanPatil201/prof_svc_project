import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CostComparisonItem, AssessmentReportSummary } from "@/types/assessmentReport";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

interface CostComparisonTableProps {
  costComparison: CostComparisonItem[];
  assessmentSummary: AssessmentReportSummary;
}

const CostComparisonTable: React.FC<CostComparisonTableProps> = ({
  costComparison,
  assessmentSummary,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case '3-year-ri':
        return <Badge variant="default" className="bg-green-600">3-Year RI</Badge>;
      case '1-year-ri':
        return <Badge variant="default" className="bg-blue-600">1-Year RI</Badge>;
      case 'pay-as-you-go':
        return <Badge variant="outline">Pay-as-you-go</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Machines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessmentSummary.totalMachines}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pay-as-you-go Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(assessmentSummary.totalCosts.payAsYouGo)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">1-Year RI Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 flex items-center">
              <TrendingDown className="h-5 w-5 mr-1" />
              {formatCurrency(assessmentSummary.totalSavings.reservedInstance1Yr)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">3-Year RI Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 flex items-center">
              <TrendingDown className="h-5 w-5 mr-1" />
              {formatCurrency(assessmentSummary.totalSavings.reservedInstance3Yr)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Optimization Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold text-green-600 mb-2">Recommended for 3-Year RI</h4>
              <div className="space-y-1">
                {assessmentSummary.recommendations.machinesFor3YrRI.length > 0 ? (
                  assessmentSummary.recommendations.machinesFor3YrRI.map((machine, index) => (
                    <div key={index} className="text-sm bg-green-50 p-2 rounded">
                      {machine}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No machines recommended for 3-Year RI</p>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-600 mb-2">Recommended for 1-Year RI</h4>
              <div className="space-y-1">
                {assessmentSummary.recommendations.machinesFor1YrRI.length > 0 ? (
                  assessmentSummary.recommendations.machinesFor1YrRI.map((machine, index) => (
                    <div key={index} className="text-sm bg-blue-50 p-2 rounded">
                      {machine}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No machines recommended for 1-Year RI</p>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-600 mb-2">Keep Pay-as-you-go</h4>
              <div className="space-y-1">
                {assessmentSummary.recommendations.machinesForPayAsYouGo.length > 0 ? (
                  assessmentSummary.recommendations.machinesForPayAsYouGo.map((machine, index) => (
                    <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                      {machine}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No machines recommended for Pay-as-you-go</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Cost Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Cost Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Machine</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Pay-as-you-go</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">1-Year RI</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">3-Year RI</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">1-Year Savings</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">3-Year Savings</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {costComparison.map((machine, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-medium">
                      {machine.machine}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {formatCurrency(machine.payAsYouGoCost)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {formatCurrency(machine.reservedInstance1YrCost)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {formatCurrency(machine.reservedInstance3YrCost)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      <span className={machine.savings1Yr > 0 ? "text-green-600" : "text-gray-500"}>
                        {machine.savings1Yr > 0 ? "+" : ""}{formatCurrency(machine.savings1Yr)}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      <span className={machine.savings3Yr > 0 ? "text-green-600" : "text-gray-500"}>
                        {machine.savings3Yr > 0 ? "+" : ""}{formatCurrency(machine.savings3Yr)}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {getRecommendationBadge(machine.recommendedOption)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CostComparisonTable; 