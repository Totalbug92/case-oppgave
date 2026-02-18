const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    // Fetch raw project-customer rows and the project cost overview in parallel
    const [resCustomers, resOverview] = await Promise.all([
      fetch(`${API_BASE_URL}/projects/${id}/customers`),
      fetch(`${API_BASE_URL}/projects/${id}/cost-overview`).catch(() => null),
    ]);

    if (!resCustomers.ok) {
      throw new Error(`API error: ${resCustomers.statusText}`);
    }

    const customers = await resCustomers.json();
    const overview = resOverview && resOverview.ok ? await resOverview.json() : null;

    // Build a lookup from overview for allocated_cost and customer_name
    const overviewMap = new Map<number, any>();
    if (overview && Array.isArray(overview.customers)) {
      for (const c of overview.customers) {
        overviewMap.set(c.customer_id, c);
      }
    }

    // Map backend ProjectCustomer (which has `cost_percentage`) to the frontend shape
    const mapped = (customers || []).map((pc: any) => {
      const ov = overviewMap.get(pc.customer_id);
      const total_expenses = overview?.total_expenses ?? 0;
      const allocated_from_percentage = pc.cost_percentage != null ? (total_expenses * pc.cost_percentage) / 100 : 0;

      return {
        id: pc.id,
        customer_id: pc.customer_id,
        project_id: pc.project_id,
        cost_share: ov?.allocated_cost ?? allocated_from_percentage ?? 0,
        cost_percentage: pc.cost_percentage,
        customer_name: ov?.customer_name ?? pc.customer?.name ?? null,
      };
    });

    return Response.json(mapped);
  } catch (error) {
    console.error('API route error:', error);
    return Response.json(
      { error: 'Failed to fetch project customers' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const response = await fetch(
      `${API_BASE_URL}/projects/${id}/customers`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return Response.json(
      { error: 'Failed to link customer' },
      { status: 500 }
    );
  }
}
