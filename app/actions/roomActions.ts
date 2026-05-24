'use server';

import { prisma } from '../lib/prisma';

/**
 * Loads a room from MongoDB, or initializes a new one if it doesn't exist.
 */
export async function getOrCreateRoom(roomId: string, roomName: string = "Untitled Board") {
  try {
    let room = await prisma.room.findUnique({
      where: { roomId },
    });

    if (!room) {
      room = await prisma.room.create({
        data: {
          roomId,
          name: roomName,
          canvasData: [], // Starts with an empty canvas structure
        },
      });
    }

    return { success: true, room };
  } catch (error) {
    console.error("Failed to fetch or create room:", error);
    return { success: false, error: "Database operation failed" };
  }
}

/**
 * Saves the current state of the tldraw shapes array into MongoDB.
 */
export async function saveRoomCanvas(roomId: string, canvasSnapshot: any) {
  try {
    const updatedRoom = await prisma.room.update({
      where: { roomId },
      data: {
        canvasData: canvasSnapshot,
      },
    });

    return { success: true, updatedRoom };
  } catch (error) {
    console.error("Failed to auto-save canvas data:", error);
    return { success: false, error: "Failed to save canvas state" };
  }
}