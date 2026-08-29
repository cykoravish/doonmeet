// POST — upload or replace profile banner via Cloudinary
// ============================================================
import { NextResponse } from "next/server";
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

const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB — banners are wider than avatars
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  const limited = generalLimiter(req, String(req.user._id));
  if (limited) return limited;

  try {
    const formData = await req.formData();
    const file = formData.get("banner") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: "Only JPEG, PNG and WebP images are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: "Image must be smaller than 6MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await connectDB();

    const existingUser = await User.findById(req.user._id).select("bannerPublicId");

    if (existingUser?.bannerPublicId) {
      await cloudinary.uploader
        .destroy(existingUser.bannerPublicId)
        .catch((err) => console.error("[banner] Failed to delete old banner:", err));
    }

    const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "doonmeet/banners",
              transformation: [
                { width: 1200, height: 400, crop: "fill", gravity: "auto" },
                { quality: "auto", fetch_format: "auto" },
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

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      {
        bannerImage: uploadResult.secure_url,
        bannerPublicId: uploadResult.public_id,
      },
      { new: true, select: "bannerImage bannerPublicId" }
    ).lean();

    return NextResponse.json(
      {
        success: true,
        message: "Banner updated successfully",
        bannerImage: updated?.bannerImage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[POST /users/banner] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to upload banner. Please try again." },
      { status: 500 }
    );
  }
});
