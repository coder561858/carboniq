import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/db';
import User from '../../../../models/User';
import { generateToken } from '../../../../lib/auth';

/**
 * POST /api/auth/google
 * Receives a Google credential token, verifies it with Google,
 * and either finds or creates the user in MongoDB.
 */
export async function POST(request) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json(
        { error: 'Google credential token is required' },
        { status: 400 }
      );
    }

    // Verify the token with Google's tokeninfo endpoint
    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );

    if (!googleRes.ok) {
      return NextResponse.json(
        { error: 'Invalid Google token' },
        { status: 401 }
      );
    }

    const googleData = await googleRes.json();

    // Validate the token is intended for our app
    const expectedClientId = process.env.GOOGLE_CLIENT_ID;
    if (expectedClientId && googleData.aud !== expectedClientId) {
      return NextResponse.json(
        { error: 'Token was not issued for this application' },
        { status: 401 }
      );
    }

    const { sub: googleId, email, name, picture } = googleData;

    if (!email) {
      return NextResponse.json(
        { error: 'Could not retrieve email from Google account' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    if (user) {
      // If user exists by email but doesn't have googleId linked, link it now
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture && !user.avatar) {
          user.avatar = picture;
        }
        await user.save();
      }
    } else {
      // Create a new user (no password needed for Google auth)
      // Generate a unique username from the name/email
      let username = name || email.split('@')[0];

      // Ensure username is unique by appending random digits if needed
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        username = `${username}_${Math.floor(Math.random() * 10000)}`;
      }

      user = await User.create({
        username,
        email,
        googleId,
        avatar: picture || null,
        // No password field — Google handles authentication
      });
    }

    // Generate our own JWT token
    const token = generateToken(user._id);

    return NextResponse.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      token,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json(
      { error: 'Server error: ' + error.message },
      { status: 500 }
    );
  }
}
