const jwt = require('jsonwebtoken');
const User = require('../models/User');
const connectDB = require('./db');

/**
 * Generate a JWT token for a user
 */
function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
}

/**
 * Protect a Next.js API route — verifies JWT from Authorization header.
 * Returns the authenticated user object, or null if unauthorized.
 * 
 * Usage in a route handler:
 *   const user = await protect(request);
 *   if (!user) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
 */
async function protect(request) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer')) {
    return null;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await connectDB();
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Auth middleware error:', error);
    return null;
  }
}

module.exports = { generateToken, protect };
