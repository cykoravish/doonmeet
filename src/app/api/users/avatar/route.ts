// POST — upload or replace profile avatar via Cloudinary
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { withAuth, AuthenticatedRequest } from "@/middleware/auth";
import { generalLimiter } from "@/middleware/rateLimit";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user._id));
  if (limited) return limited;

  if (req.user.isGuest) {
    return NextResponse.json(
      { success: false, message: "Guests cannot upload avatars. Please sign up." },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Only JPEG, PNG and WebP images are allowed" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "Image must be smaller than 5MB" },
        { status: 400 }
      );
    }

    // Convert file to buffer for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await connectDB();

    const existingUser = await User.findById(req.user._id).select("avatarPublicId");

    // Delete old avatar from Cloudinary before uploading new one
    if (existingUser?.avatarPublicId) {
      await cloudinary.uploader
        .destroy(existingUser.avatarPublicId)
        .catch((err) => console.error("[avatar] Failed to delete old avatar:", err));
    }

    // Upload to Cloudinary
    const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "doonmeet/avatars",
              transformation: [
                { width: 400, height: 400, crop: "fill", gravity: "face" }, // auto-crop to face
                { quality: "auto", fetch_format: "auto" }, // auto optimize
              ],
            },
            (error, result) => {
              if (error || !result) return reject(error);
              resolve(result);
            }
          )
          .end(buffer);
      }
    );

    // Save new avatar URL and public_id to user
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      {
        avatar: uploadResult.secure_url,
        avatarPublicId: uploadResult.public_id,
      },
      { new: true, select: "avatar avatarPublicId" }
    ).lean();

    return NextResponse.json(
      {
        success: true,
        message: "Avatar updated successfully",
        avatar: updated?.avatar,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /users/me/avatar] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload avatar. Please try again." },
      { status: 500 }
    );
  }
});
