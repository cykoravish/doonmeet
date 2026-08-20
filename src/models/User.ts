import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string | null;
  phone: string | null;
  passwordHash: string | null;
  googleId: string | null;
  role: "user" | "guest";
  isGuest: boolean;
  guestExpiresAt: Date | null;
  avatar: string | null;
  avatarPublicId: string | null;
  bannerImage: string | null;
  bannerPublicId: string | null;
  bio: string;
  gender: "male" | "female" | "other" | "prefer_not_to_say" | null;
  address: string;
  interests: string[];
  occupation: string;
  website: string;
  dob: Date | null;
  lookingFor:
    | "student"
    | "working_professional"
    | "entrepreneur"
    | "new_to_dehradun"
    | "just_exploring"
    | null;
  privacy: {
    showEmail: boolean;
    showPhone: boolean;
    showGender: boolean;
    showAddress: boolean;
    showInterests: boolean;
    showDOB: boolean;
  };
  guestMessageCount: number;
  verificationToken?: string;
  verificationExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isVerified: boolean;
  isActive: boolean;
  isOnline: boolean;
  lastSeenAt: Date;
  // Cooldown trackers for automated emails — see src/lib/email.ts
  lastDmEmailAt: Date | null;
  lastInactivityEmailAt: Date | null;
  // Methods
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    // --- Auth ---
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true, // allows multiple nulls (guests) but unique non-null emails
    },
    phone: {
      type: String,
      default: null,
    },
    passwordHash: {
      type: String,
      default: null, // null for Google-only users until they set a password
    },
    googleId: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
    },

    // --- Role ---
    role: {
      type: String,
      enum: ["user", "guest"],
      default: "user",
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    guestExpiresAt: {
      type: Date,
      default: null, // set to Date.now + 24h on guest creation
    },

    // --- Profile ---
    avatar: { type: String, default: null },
    avatarPublicId: { type: String, default: null }, // for Cloudinary deletion
    bannerImage: { type: String, default: null },
    bannerPublicId: { type: String, default: null }, // for Cloudinary deletion
    bio: { type: String, maxlength: [300, "Bio cannot exceed 300 characters"], default: "" },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
      default: null,
    },
    address: {
      type: String,
      maxlength: [100, "Address cannot exceed 100 characters"],
      default: "",
    },
    interests: {
      type: [String],
      validate: {
        validator: (arr: string[]) => arr.length <= 10,
        message: "Cannot have more than 10 interests",
      },
      default: [],
    },
    occupation: {
      type: String,
      maxlength: [60, "Occupation cannot exceed 60 characters"],
      default: "",
    },
    website: {
      type: String,
      maxlength: [150, "Website cannot exceed 150 characters"],
      default: "",
    },
    dob: { type: Date, default: null },
    lookingFor: {
      type: String,
      enum: [
        "student",
        "working_professional",
        "entrepreneur",
        "new_to_dehradun",
        "just_exploring",
      ],
      default: null,
    },

    // --- Privacy ---
    // User controls what others can see. Phone, email & DOB are private by default.
    privacy: {
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: false },
      showGender: { type: Boolean, default: true },
      showAddress: { type: Boolean, default: true },
      showInterests: { type: Boolean, default: true },
      showDOB: { type: Boolean, default: false },
    },

    // --- Guest limits ---
    guestMessageCount: { type: Number, default: 0 }, // public room messages sent

    verificationToken: { type: String, select: false, default: undefined },
    verificationExpires: { type: Date, select: false, default: undefined },
    resetPasswordToken: { type: String, select: false, default: undefined },
    resetPasswordExpires: { type: Date, select: false, default: undefined },

    // --- Account status ---
    isVerified: { type: Boolean, default: false }, // true after email link click or Google signup
    isActive: { type: Boolean, default: true }, // false = soft banned
    // Live presence — flipped by the socket layer on connect/disconnect
    // (see src/lib/socket.ts). Kept on the user doc, not just in-memory,
    // so any process/API route can query "who's online" via a normal find().
    isOnline: { type: Boolean, default: false },
    lastSeenAt: { type: Date, default: Date.now },

    // --- Automated email cooldowns ---
    // Last time this user was sent a "new DM" email notification — used to
    // throttle so an active conversation doesn't spam their inbox.
    lastDmEmailAt: { type: Date, default: null },
    // Last time this user was sent an inactivity re-engagement email.
    lastInactivityEmailAt: { type: Date, default: null },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

// -------------------------
// Indexes
// -------------------------
UserSchema.index({ isGuest: 1, guestExpiresAt: 1 }); // for guest cleanup
UserSchema.index({ isActive: 1 });
// Powers the "all members" list — online users first, then alphabetical.
UserSchema.index({ isGuest: 1, isActive: 1, isOnline: -1, name: 1 });
// Powers the inactivity-reminder cron's scan (see scripts/send-inactivity-emails.ts)
UserSchema.index({ isGuest: 1, isActive: 1, isOnline: 1, lastSeenAt: 1 });

// -------------------------
// Instance method — compare password
// -------------------------
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.passwordHash) return false; // Google-only user has no password
  return bcrypt.compare(password, this.passwordHash);
};

// -------------------------
// Pre-save hook — hash password if changed
// -------------------------
UserSchema.pre("save", async function () {
  if (!this.isModified("passwordHash") || !this.passwordHash) return;

  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  } catch (err) {
    throw err;
  }
});

// -------------------------
// Never return sensitive fields in JSON responses
// -------------------------
UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const result = ret as unknown as Record<string, unknown>;
    delete result.passwordHash;
    delete result.googleId;
    delete result.__v;
    return result;
  },
});

export const User = mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
