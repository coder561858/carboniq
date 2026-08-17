import { NextResponse } from 'next/server';
import connectDB from '../../../lib/db';
import mongoose from 'mongoose';
import Analysis from '../../../models/Analysis';
import { protect } from '../../../lib/auth';

export async function GET(request) {
  const user = await protect(request);
  if (!user) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  try {
    await connectDB();
    if (mongoose.connection.readyState !== 1) {
      throw new Error(`MongoDB disconnected (readyState: ${mongoose.connection.readyState}).`);
    }
    const cleanest = await Analysis.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: "$hostname", avgCo2: { $avg: "$co2Grams" }, count: { $sum: 1 }, grade: { $first: "$grade" } } },
      { $sort: { avgCo2: 1 } },
      { $limit: 10 }
    ]);
    const dirtiest = await Analysis.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: "$hostname", avgCo2: { $avg: "$co2Grams" }, count: { $sum: 1 }, grade: { $first: "$grade" } } },
      { $sort: { avgCo2: -1 } },
      { $limit: 10 }
    ]);
    return NextResponse.json({ cleanest, dirtiest });
  } catch (err) {
    console.error('Leaderboard fetch error:', err);
    return NextResponse.json(
      { error: `Leaderboard DB error: ${err.message || 'Unknown error'}`, details: err.message },
      { status: 500 }
    );
  }
}
