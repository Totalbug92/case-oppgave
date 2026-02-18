const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function POST(
  request: Request,
  { params }: { params: { id: string; customerId: string } }
) {
  try {
    const { id, customerId } = await params;
    const body = await request.json();
    const response = await fetch(
      `${API_BASE_URL}/projects/${id}/customers/${customerId}`,
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
      { error: 'Failed to link customer to project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; customerId: string } }
) {
  try {
    const { id, customerId } = await params;
    const response = await fetch(
      `${API_BASE_URL}/projects/${id}/customers/${customerId}`,
      {
        method: 'DELETE',
      }
    );
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error('API route error:', error);
    return Response.json(
      { error: 'Failed to remove customer from project' },
      { status: 500 }
    );
  }
}
