import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/db';
import User from '../../../../models/User';
import { generateToken } from '../../../../lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    await connectDB();

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      return NextResponse.json({
        _id: user.id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    );
  }
}
