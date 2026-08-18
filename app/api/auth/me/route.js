import { NextResponse } from 'next/server';
import { protect } from '../../../../lib/auth';

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
