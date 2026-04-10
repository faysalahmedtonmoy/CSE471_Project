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

    // Only admins can access this
    if (decoded.role !== 'ADMIN') {
      return Response.json({ message: "Access denied" }, { status: 403 });
    }

    const users = await User.find({}).select('-password');
    return Response.json({ users });
  } catch (error) {
    return Response.json({ message: "Error fetching users" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await connectDB();

    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return Response.json({ message: "No token provided" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Only admins can access this
    if (decoded.role !== 'ADMIN') {
      return Response.json({ message: "Access denied" }, { status: 403 });
    }

    const { userId, role, isVerified, isProviderVerified } = await req.json();

    const updateData = {};
    if (role !== undefined) updateData.role = role;
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    if (isProviderVerified !== undefined) updateData.isProviderVerified = isProviderVerified;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    return Response.json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    return Response.json({ message: "Error updating user" }, { status: 500 });
  }
}