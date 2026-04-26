'use server';

import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/db';
import EmergencyReport from '@/lib/models/EmergencyReport';
import User from '@/lib/models/User';

export async function createEmergencyReport(formData: FormData) {
  try {
    // 1. Authenticate user securely on the server
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return { success: false, error: 'Unauthorized. You must be logged in.' };
    }

    // 2. Extract data from the form
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const imageUrl = formData.get('imageUrl') as string; // URL from Cloudinary

    if (!title || !description) {
      return { success: false, error: 'Title and description are required.' };
    }

    // 3. Connect to Database
    await connectDB();

    // 4. Find the local User ID using the Clerk ID
    const user = await User.findOne({ clerkUserId });
    
    if (!user) {
      return { success: false, error: 'User profile not found in database.' };
    }

    // 5. Create the report with the Cloudinary Image URL
    const report = await EmergencyReport.create({
      userId: user._id,
      clerkUserId,
      title,
      description,
      imageUrl, // Saving the secure_url from Cloudinary
      status: 'pending'
    });

    return { 
      success: true, 
      reportId: report._id.toString(),
      message: 'Emergency report created successfully with image.' 
    };

  } catch (error: any) {
    console.error('Error creating report:', error);
    return { success: false, error: error.message || 'Internal Server Error' };
  }
}
