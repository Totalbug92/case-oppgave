const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${params.id}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return Response.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const response = await fetch(`${API_BASE_URL}/projects/${params.id}`, {
      method: 'PUT',
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
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(`${API_BASE_URL}/projects/${params.id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error('API route error:', error);
    return Response.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
