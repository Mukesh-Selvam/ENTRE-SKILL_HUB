const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'mentor', 'admin'], default: 'user' },
  // Mentor accounts start as 'pending' until an admin verifies them.
  status: { type: String, enum: ['active', 'pending', 'suspended'], default: 'active' },
  bio: { type: String, default: null },
  expertise: { type: String, default: null },
  experienceYears: { type: Number, default: null },

  // New Personal Details fields
  dob: { type: Date, default: null },
  phone: { type: String, default: null },
  address: { type: String, default: null },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say', null], default: null },
  profilePicture: { type: String, default: null },
  githubUrl: { type: String, default: null },
  linkedinUrl: { type: String, default: null },

  // Skill & interest profiling (replaces the user_skills / user_interests join tables).
  skills: [
    {
      _id: false,
      skill: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },
      proficiency: { type: String, enum: ['beginner', 'intermediate', 'expert'], default: 'beginner' },
    },
  ],
  interests: [{ type: Schema.Types.ObjectId, ref: 'Interest' }],
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

userSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.passwordHash;
    // Frontend expects snake_case for these fields.
    ret.experience_years = ret.experienceYears;
    ret.created_at = ret.createdAt;
    ret.profile_picture = ret.profilePicture;
    ret.github_url = ret.githubUrl;
    ret.linkedin_url = ret.linkedinUrl;
    delete ret.experienceYears;
    delete ret.createdAt;
    delete ret.profilePicture;
    delete ret.githubUrl;
    delete ret.linkedinUrl;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
