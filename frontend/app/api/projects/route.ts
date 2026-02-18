const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/projects`);
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    const projects = await response.json();

    // Enrich each project with a total_cost field from the backend cost-overview
    const enriched = await Promise.all(
      (projects || []).map(async (proj: any) => {
        try {
          const r = await fetch(`${API_BASE_URL}/projects/${proj.id}/cost-overview`);
          if (!r.ok) return { ...proj, total_cost: 0 };
          const overview = await r.json();
          // backend returns `total_expenses` in ProjectCostOverview
          return { ...proj, total_cost: overview?.total_expenses ?? 0 };
        } catch (e) {
          return { ...proj, total_cost: 0 };
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
