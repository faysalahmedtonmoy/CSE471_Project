'use server';

import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PinLocationInput {
  name: string;        // e.g. "Dhaka Medical College"
  type?: string;       // "Hospital" | "Clinic" — defaults to "Hospital"
  lat: number;
  lng: number;
}

export interface PinLocationResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Server Action: Save a pinned location from EmergencyMap to the
 * EmergencyService table in the database, linked to the current Clerk userId.
 */
export async function pinEmergencyLocation(
  input: PinLocationInput
): Promise<PinLocationResult> {
  // 1. Authenticate — get the signed-in Clerk user
  const { userId } = auth();

  if (!userId) {
    return { success: false, error: 'Unauthorized: You must be signed in to pin a location.' };
  }

  try {
    // 2. Write to the EmergencyService table
    const pinned = await prisma.emergencyService.create({
      data: {
        clerkUserId: userId,            // ← Clerk user ID as the foreign key
        name: input.name,
        type: input.type ?? 'Hospital',
        pinnedLat: input.lat,
        pinnedLng: input.lng,
      },
    });

    return { success: true, id: pinned.id };
  } catch (err) {
    console.error('[pinEmergencyLocation] Prisma error:', err);
    return { success: false, error: 'Database error: could not save pinned location.' };
  }
}
