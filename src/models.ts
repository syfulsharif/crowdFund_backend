import mongoose, { Schema } from 'mongoose';

// User Schema
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  photoUrl: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  role: { type: String, enum: ['Supporter', 'Creator', 'Admin'], default: 'Supporter' },
  credits: { type: Number, default: 50 },
  raisedCredits: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Campaign Schema
const campaignSchema = new Schema({
  title: { type: String, required: true },
  story: { type: String, required: true },
  category: { type: String, required: true, index: true },
  fundingGoal: { type: Number, required: true },
  minimumContribution: { type: Number, required: true, default: 5 },
  deadline: { type: String, required: true },
  rewardInfo: { type: String, required: true },
  imageUrl: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  creatorName: { type: String, required: true },
  creatorEmail: { type: String, required: true, index: true },
  creatorId: { type: String },
  amountRaised: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Contribution Schema
const contributionSchema = new Schema({
  campaignId: { type: String, required: true, index: true },
  campaignTitle: { type: String, required: true },
  amount: { type: Number, required: true },
  supporterName: { type: String, required: true },
  supporterEmail: { type: String, required: true, index: true },
  creatorName: { type: String, required: true },
  creatorEmail: { type: String, required: true, index: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  message: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

// Withdrawal Schema
const withdrawalSchema = new Schema({
  creatorName: { type: String, required: true },
  creatorEmail: { type: String, required: true, index: true },
  withdrawalCredit: { type: Number, required: true },
  withdrawalAmount: { type: Number, required: true },
  paymentSystem: { type: String, required: true },
  accountNumber: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
  createdAt: { type: Date, default: Date.now },
});

// CreditPurchase Schema
const creditPurchaseSchema = new Schema({
  userEmail: { type: String, required: true, index: true },
  credits: { type: Number, required: true },
  priceAmount: { type: Number, required: true },
  paymentMethod: { type: String, default: 'Stripe' },
  stripePaymentId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Notification Schema
const notificationSchema = new Schema({
  toEmail: { type: String, required: true, index: true },
  message: { type: String, required: true },
  actionRoute: { type: String, default: '/dashboard' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Report Schema
const reportSchema = new Schema({
  campaignId: { type: String, required: true },
  campaignTitle: { type: String, required: true },
  reporterName: { type: String, required: true },
  reporterEmail: { type: String, required: true, index: true },
  reason: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
export const CampaignModel = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);
export const ContributionModel = mongoose.models.Contribution || mongoose.model('Contribution', contributionSchema);
export const WithdrawalModel = mongoose.models.Withdrawal || mongoose.model('Withdrawal', withdrawalSchema);
export const CreditPurchaseModel = mongoose.models.CreditPurchase || mongoose.model('CreditPurchase', creditPurchaseSchema);
export const NotificationModel = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export const ReportModel = mongoose.models.Report || mongoose.model('Report', reportSchema);
