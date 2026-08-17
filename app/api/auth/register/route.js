const { NextResponse } = require('next/server');
const connectDB = require('../../../../lib/db');
const User = require('../../../../models/User');
const { generateToken } = require('../../../../lib/auth');

export async function POST(request) {
  try {
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Please add all fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
    });

    if (user) {
      return NextResponse.json(
        {
          _id: user.id,
          username: user.username,
          email: user.email,
          token: generateToken(user._id),
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid user data' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    );
  }
}
