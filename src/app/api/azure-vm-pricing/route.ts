import { NextRequest } from 'next/server';
import { fetchAzureVmPriceDirect } from '@/lib/azureVmAnalysis';

export async function POST(req: NextRequest) {
  try {
    const vms = await req.json(); // [{ sku, region, osType }]
    if (!Array.isArray(vms)) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
    }
    const results = [];
    for (const vm of vms) {
      const { sku, region, osType } = vm;
      const result: any = { sku, region, osType };
      // Pay-as-you-go
      result.payg = await fetchAzureVmPriceDirect({ sku, region, osType, priceType: 'Consumption' });
      // 1yr RI
      result.ri1y = await fetchAzureVmPriceDirect({ sku, region, osType, priceType: 'Reservation', term: '1 Year' });
      // 3yr RI
      result.ri3y = await fetchAzureVmPriceDirect({ sku, region, osType, priceType: 'Reservation', term: '3 Years' });
      // AHB (for Windows)
      if (osType === 'Windows') {
        const ahbSku = sku + '_AHB';
        result.ahb = await fetchAzureVmPriceDirect({ sku: ahbSku, region, osType, priceType: 'Consumption' });
      }
      results.push(result);
    }
    return new Response(JSON.stringify({ prices: results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 