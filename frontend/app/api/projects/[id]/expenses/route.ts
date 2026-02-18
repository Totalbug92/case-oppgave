const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const response = await fetch(`${API_BASE_URL}/projects/${id}/expenses`);

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return Response.json(
      { error: 'Failed to fetch project expenses' },
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
    const projectId = Number(id);
    if (!Number.isFinite(projectId) || projectId <= 0) {
      return Response.json({ error: 'Invalid project id' }, { status: 400 });
    }

    const body = await request.json();
    const payload = {
      project_id: projectId,
      expense_type: body?.expense_type,
      amount: Number(body?.amount),
      description: body?.description || '',
    };

    const response = await fetch(`${API_BASE_URL}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data?.detail || data?.error || 'Failed to create expense' },
        { status: response.status }
      );
    }

    return Response.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return Response.json(
      { error: 'Failed to create project expense' },
      { status: 500 }
    );
  }
}
