import { NextResponse } from 'next/server';
import connectDB from '../../../lib/db';
import Analysis from '../../../models/Analysis';
import { protect } from '../../../lib/auth';

export async function GET(request) {
  const user = await protect(request);
  if (!user) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain query parameter is required' },
        { status: 400 }
      );
    }

    const history = await Analysis.find({ hostname: domain, user: user._id })
      .select('co2Grams grade totalSizeMB totalRequests isGreenHosted createdAt')
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    return NextResponse.json({ domain, history });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
