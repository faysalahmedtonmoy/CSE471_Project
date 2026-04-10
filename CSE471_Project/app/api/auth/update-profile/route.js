import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import jwt from "jsonwebtoken";

export async function PUT(req) {
  try {
    await connectDB();

    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return Response.json({ message: "No token provided" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { name, email, location, skills } = await req.json();

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (location !== undefined) updateData.location = location;
    if (skills !== undefined) {
      updateData.skills = skills;
      // Reset provider verification when skills are updated
      updateData.isProviderVerified = false;
    }

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      updateData,
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    return Response.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    return Response.json({ message: "Error updating profile" }, { status: 500 });
  }
}