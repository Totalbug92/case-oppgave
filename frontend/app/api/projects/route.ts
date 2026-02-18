const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/projects`);
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    const projects = await response.json();

    // Enrich each project with total_cost and number of linked customers
    const enriched = await Promise.all(
      (projects || []).map(async (proj: any) => {
        try {
          const [overviewRes, customersRes] = await Promise.all([
            fetch(`${API_BASE_URL}/projects/${proj.id}/cost-overview`),
            fetch(`${API_BASE_URL}/projects/${proj.id}/customers`),
          ]);

          const overview = overviewRes.ok ? await overviewRes.json() : null;
          const customers = customersRes.ok ? await customersRes.json() : [];

          return {
            ...proj,
            total_cost: overview?.total_expenses ?? 0,
            customers: Array.isArray(customers) ? customers.length : 0,
          };
        } catch (e) {
          return { ...proj, total_cost: 0, customers: 0 };
        }
      })
    );

    return Response.json(enriched);
  } catch (error) {
    console.error('API route error:', error);
    return Response.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return Response.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
