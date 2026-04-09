import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    await connectDB();

    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return Response.json({ message: "No token provided" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    return Response.json({ user });
  } catch (error) {
    return Response.json({ message: "Invalid token" }, { status: 401 });
  }
}