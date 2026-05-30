import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  company: String,
  role: { type: String, enum: ['recruiter', 'candidate', 'admin'], default: 'recruiter' },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);

const questionSchema = new mongoose.Schema({
  text: String,
  category: String,
  difficulty: String,
  order: Number,
  keywords: [String],
});

const interviewSchema = new mongoose.Schema({
  title: String,
  jobDescription: String,
  questions: [questionSchema],
  persona: { type: String, default: 'professional' },
  timeLimitPerQuestion: { type: Number, default: 120 },
  proctoring: {
    face: { type: Boolean, default: true },
    tab: { type: Boolean, default: true },
    voice: { type: Boolean, default: true },
    phone: { type: Boolean, default: false },
    gaze: { type: Boolean, default: false },
    stress: { type: Boolean, default: true },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' },
  inviteToken: String,
  invitedEmails: [{ type: String, lowercase: true, trim: true }],
}, { timestamps: true });

export const Interview = mongoose.model('Interview', interviewSchema);

const aiInterviewSchema = new mongoose.Schema({
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'Interview' },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  candidateEmail: String,
  candidateName: String,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  session_data: {
    currentQuestion: { type: Number, default: 0 },
    chunks: [{
      sequence: Number,
      md5: String,
      s3Key: String,
      uploadedAt: Date,
    }],
    wsReconnectCount: { type: Number, default: 0 },
    lastChunkSequence: { type: Number, default: -1 },
  },
  answers: [{
    questionIndex: Number,
    transcript: String,
    score: Number,
    duration: Number,
    isFollowup: Boolean,
  }],
  proctoringEvents: [{
    type: String,
    timestamp: Number,
    severity: String,
    details: mongoose.Schema.Types.Mixed,
  }],
  scores: {
    communication: Number,
    technical: Number,
    confidence: Number,
    overall: Number,
    recommendation: String,
  },
  videoUrl: String,
  highlightReelUrl: String,
  suspiciousActivityCount: { type: Number, default: 0 },
  traceId: String,
}, { timestamps: true });

export const AiInterview = mongoose.model('AiInterview', aiInterviewSchema);
