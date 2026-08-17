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
    const recent = await Analysis.find({ user: user._id })
      .select('url hostname co2Grams grade totalSizeMB isGreenHosted createdAt')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ recent });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Failed to fetch recent scans' },
      { status: 500 }
    );
  }
}
