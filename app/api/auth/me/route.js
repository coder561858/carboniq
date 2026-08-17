const { NextResponse } = require('next/server');
const { protect } = require('../../../../lib/auth');

export async function GET(request) {
  const user = await protect(request);
  if (!user) {
    return NextResponse.json(
      { error: 'Not authorized' },
      { status: 401 }
    );
  }

  return NextResponse.json(user);
}
