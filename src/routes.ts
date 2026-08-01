import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { verifyToken, requireRole, generateToken, AuthenticatedRequest } from './middleware.js';
import {
  UserModel,
  CampaignModel,
  ContributionModel,
  WithdrawalModel,
  CreditPurchaseModel,
  NotificationModel,
  ReportModel,
} from './models.js';

const router = Router();

// Helper to create in-app notification
async function createNotification(toEmail: string, message: string, actionRoute: string = '/dashboard') {
  try {
    await NotificationModel.create({
      toEmail,
      message,
      actionRoute,
      read: false,
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// Register
router.post('/auth/register', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, password, role, photoUrl } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await (UserModel as any).findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Default credits: Supporter gets 50, Creator gets 20, Admin gets 1000
    const initialCredits = role === 'Supporter' ? 50 : role === 'Creator' ? 20 : 1000;

    const newUser = await (UserModel as any).create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      credits: initialCredits,
      raisedCredits: 0,
    });

    const token = generateToken({
      id: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role as any,
      name: newUser.name,
    });

    await createNotification(newUser.email, `Welcome to CrowdFund! You have received ${initialCredits} free starting credits.`);

    return res.json({
      token,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        photoUrl: newUser.photoUrl,
        credits: newUser.credits,
        raisedCredits: newUser.raisedCredits,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

// Login
router.post('/auth/login', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await (UserModel as any).findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role as any,
      name: user.name,
    });

    return res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl,
        credits: user.credits,
        raisedCredits: user.raisedCredits,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed.' });
  }
});

// Google Quick Auth Demo
router.post('/auth/google', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, name, photoUrl, role } = req.body;
    const targetEmail = (email || 'google.user@crowdfund.org').toLowerCase();
    
    let user = await (UserModel as any).findOne({ email: targetEmail });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('GoogleOAuthPass123!', salt);
      const userRole = role || 'Supporter';
      const initialCredits = userRole === 'Supporter' ? 50 : 20;

      user = await (UserModel as any).create({
        name: name || 'Google Supporter',
        email: targetEmail,
        passwordHash,
        role: userRole,
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        credits: initialCredits,
        raisedCredits: 0,
      });

      await createNotification(user.email, `Welcome via Google Sign-In! Received ${initialCredits} starter credits.`);
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role as any,
      name: user.name,
    });

    return res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl,
        credits: user.credits,
        raisedCredits: user.raisedCredits,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Google Auth failed.' });
  }
});

// Profile / Me
router.get('/auth/me', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await (UserModel as any).findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl,
        credits: user.credits,
        raisedCredits: user.raisedCredits,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. CAMPAIGNS ROUTES
// ==========================================

// Get all approved campaigns (or with search & category filters)
router.get('/campaigns', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, search, sort, status } = req.query;
    const filter: any = {};

    if (status) {
      filter.status = status;
    } else {
      filter.status = 'approved';
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search as string, $options: 'i' } },
        { story: { $regex: search as string, $options: 'i' } },
        { creatorName: { $regex: search as string, $options: 'i' } },
      ];
    }

    let sortOptions: any = { createdAt: -1 };
    if (sort === 'topFunded') {
      sortOptions = { amountRaised: -1 };
    } else if (sort === 'deadline') {
      sortOptions = { deadline: 1 };
    } else if (sort === 'goal') {
      sortOptions = { fundingGoal: -1 };
    }

    const campaigns = await (CampaignModel as any).find(filter).sort(sortOptions);
    return res.json({ campaigns });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Get Top 6 Funded Campaigns
router.get('/campaigns/top-funded', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const campaigns = await (CampaignModel as any).find({ status: 'approved' })
      .sort({ amountRaised: -1 })
      .limit(6);
    return res.json({ campaigns });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Get my created campaigns (Creator)
router.get('/campaigns/my', verifyToken, requireRole(['Creator', 'Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaigns = await (CampaignModel as any).find({ creatorEmail: req.user?.email }).sort({ deadline: -1 });
    return res.json({ campaigns });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Get single campaign details
router.get('/campaigns/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaign = await (CampaignModel as any).findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    return res.json({ campaign });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Create new campaign (Creator / Admin) -> Status starts as pending
router.post('/campaigns', verifyToken, requireRole(['Creator', 'Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, story, category, fundingGoal, minimumContribution, deadline, rewardInfo, imageUrl } = req.body;

    if (!title || !story || !category || !fundingGoal || !deadline || !rewardInfo || !imageUrl) {
      return res.status(400).json({ error: 'All fields are required to launch a campaign.' });
    }

    const newCampaign = await (CampaignModel as any).create({
      title,
      story,
      category,
      fundingGoal: Number(fundingGoal),
      minimumContribution: Number(minimumContribution || 5),
      deadline,
      rewardInfo,
      imageUrl,
      status: 'pending',
      creatorName: req.user?.name || 'Creator',
      creatorEmail: req.user?.email || '',
      creatorId: req.user?.id,
      amountRaised: 0,
    });

    // Notify admins
    const admins = await (UserModel as any).find({ role: 'Admin' });
    for (const admin of admins) {
      await createNotification(admin.email, `New campaign submitted for approval: "${title}" by ${req.user?.name}`);
    }

    return res.json({ campaign: newCampaign, message: 'Campaign submitted successfully. Pending Admin approval.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Update campaign (Creator owns or Admin)
router.patch('/campaigns/:id', verifyToken, requireRole(['Creator', 'Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, story, rewardInfo, imageUrl, category, fundingGoal } = req.body;
    const campaign = await (CampaignModel as any).findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (req.user?.role !== 'Admin' && campaign.creatorEmail !== req.user?.email) {
      return res.status(403).json({ error: 'You can only edit your own campaigns.' });
    }

    if (title) campaign.title = title;
    if (story) campaign.story = story;
    if (rewardInfo) campaign.rewardInfo = rewardInfo;
    if (imageUrl) campaign.imageUrl = imageUrl;
    if (category) campaign.category = category;
    if (fundingGoal) campaign.fundingGoal = Number(fundingGoal);

    await campaign.save();

    return res.json({ campaign, message: 'Campaign updated successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete campaign & refund supporters
router.delete('/campaigns/:id', verifyToken, requireRole(['Creator', 'Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaign = await (CampaignModel as any).findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (req.user?.role !== 'Admin' && campaign.creatorEmail !== req.user?.email) {
      return res.status(403).json({ error: 'You can only delete your own campaigns.' });
    }

    // Refund all approved & pending supporters for this campaign
    const contributions = await (ContributionModel as any).find({
      campaignId: campaign._id.toString(),
      status: { $in: ['approved', 'pending'] },
    });

    for (const contrib of contributions) {
      const supporter = await (UserModel as any).findOne({ email: contrib.supporterEmail });
      if (supporter) {
        supporter.credits += contrib.amount;
        await supporter.save();

        await createNotification(
          supporter.email,
          `Campaign "${campaign.title}" was deleted. Refunded ${contrib.amount} credits back to your balance.`
        );
      }
      contrib.status = 'rejected';
      await contrib.save();
    }

    await (CampaignModel as any).findByIdAndDelete(req.params.id);

    return res.json({ message: 'Campaign deleted and all supporters refunded successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. CONTRIBUTIONS ROUTES
// ==========================================

// Submit Contribution (Supporter)
router.post('/contributions', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { campaignId, amount, message } = req.body;
    const contribAmount = Number(amount);

    if (!campaignId || !contribAmount || contribAmount <= 0) {
      return res.status(400).json({ error: 'Valid campaign ID and contribution amount are required.' });
    }

    const campaign = await (CampaignModel as any).findById(campaignId);
    if (!campaign || campaign.status !== 'approved') {
      return res.status(400).json({ error: 'Campaign is not active or not approved.' });
    }

    if (contribAmount < campaign.minimumContribution) {
      return res.status(400).json({ error: `Minimum contribution for this campaign is ${campaign.minimumContribution} credits.` });
    }

    const supporter = await (UserModel as any).findById(req.user?.id);
    if (!supporter) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    if (supporter.credits < contribAmount) {
      return res.status(400).json({ error: `Insufficient credits. You have ${supporter.credits} credits available, but need ${contribAmount}.` });
    }

    // Deduct credits immediately
    supporter.credits -= contribAmount;
    await supporter.save();

    const newContribution = await (ContributionModel as any).create({
      campaignId: campaign._id.toString(),
      campaignTitle: campaign.title,
      amount: contribAmount,
      supporterName: supporter.name,
      supporterEmail: supporter.email,
      creatorName: campaign.creatorName,
      creatorEmail: campaign.creatorEmail,
      status: 'pending',
      message: message || '',
    });

    // Notify Creator
    await createNotification(
      campaign.creatorEmail,
      `${supporter.name} contributed ${contribAmount} credits to your campaign "${campaign.title}" (Pending Review).`
    );

    return res.json({
      contribution: newContribution,
      userCredits: supporter.credits,
      message: 'Contribution submitted successfully! Pending Creator approval.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// My Contributions (Supporter) with Pagination
router.get('/contributions/my', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const skip = (page - 1) * limit;

    const totalCount = await (ContributionModel as any).countDocuments({ supporterEmail: req.user?.email });
    const contributions = await (ContributionModel as any).find({ supporterEmail: req.user?.email })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      contributions,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
      currentPage: page,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Approved Contributions for Supporter
router.get('/contributions/approved', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contributions = await (ContributionModel as any).find({
      supporterEmail: req.user?.email,
      status: 'approved',
    }).sort({ createdAt: -1 });

    return res.json({ contributions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Contributions To Review (Creator)
router.get('/contributions/to-review', verifyToken, requireRole(['Creator', 'Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contributions = await (ContributionModel as any).find({
      creatorEmail: req.user?.email,
      status: 'pending',
    }).sort({ createdAt: -1 });

    return res.json({ contributions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Approve Contribution (Creator)
router.post('/contributions/:id/approve', verifyToken, requireRole(['Creator', 'Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contribution = await (ContributionModel as any).findById(req.params.id);
    if (!contribution || contribution.status !== 'pending') {
      return res.status(400).json({ error: 'Contribution not found or already processed.' });
    }

    if (req.user?.role !== 'Admin' && contribution.creatorEmail !== req.user?.email) {
      return res.status(403).json({ error: 'You can only approve contributions for your own campaigns.' });
    }

    contribution.status = 'approved';
    await contribution.save();

    // Increase Campaign raised amount
    const campaign = await (CampaignModel as any).findById(contribution.campaignId);
    if (campaign) {
      campaign.amountRaised += contribution.amount;
      await campaign.save();
    }

    // Increase Creator's raised credits
    const creator = await (UserModel as any).findOne({ email: contribution.creatorEmail });
    if (creator) {
      creator.raisedCredits = (creator.raisedCredits || 0) + contribution.amount;
      await creator.save();
    }

    // Notify Supporter
    await createNotification(
      contribution.supporterEmail,
      `Your Contribution of ${contribution.amount} credits to ${contribution.campaignTitle} was approved by ${contribution.creatorName}`
    );

    return res.json({ message: 'Contribution approved successfully.', contribution });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Reject Contribution (Creator)
router.post('/contributions/:id/reject', verifyToken, requireRole(['Creator', 'Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contribution = await (ContributionModel as any).findById(req.params.id);
    if (!contribution || contribution.status !== 'pending') {
      return res.status(400).json({ error: 'Contribution not found or already processed.' });
    }

    if (req.user?.role !== 'Admin' && contribution.creatorEmail !== req.user?.email) {
      return res.status(403).json({ error: 'You can only reject contributions for your own campaigns.' });
    }

    contribution.status = 'rejected';
    await contribution.save();

    // Refund credits to Supporter
    const supporter = await (UserModel as any).findOne({ email: contribution.supporterEmail });
    if (supporter) {
      supporter.credits += contribution.amount;
      await supporter.save();

      await createNotification(
        supporter.email,
        `Your Contribution of ${contribution.amount} credits to ${contribution.campaignTitle} was rejected by ${contribution.creatorName}. Refunded to your balance.`
      );
    }

    return res.json({ message: 'Contribution rejected and credits refunded to supporter.', contribution });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. WITHDRAWAL ROUTES (20 credits = $1 USD, min 200 credits)
// ==========================================

router.post('/withdrawals', verifyToken, requireRole(['Creator', 'Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { withdrawalCredit, paymentSystem, accountNumber } = req.body;
    const creditsToWithdraw = Number(withdrawalCredit);

    if (!creditsToWithdraw || creditsToWithdraw < 200) {
      return res.status(400).json({ error: 'Minimum withdrawal is 200 credits ($10 USD).' });
    }

    const creator = await (UserModel as any).findById(req.user?.id);
    if (!creator) {
      return res.status(404).json({ error: 'Creator account not found.' });
    }

    if ((creator.raisedCredits || 0) < creditsToWithdraw) {
      return res.status(400).json({ error: `Insufficient raised credits. Available: ${creator.raisedCredits || 0} credits.` });
    }

    // 20 credits = $1 USD
    const withdrawalAmount = Number((creditsToWithdraw / 20).toFixed(2));

    const withdrawal = await (WithdrawalModel as any).create({
      creatorName: creator.name,
      creatorEmail: creator.email,
      withdrawalCredit: creditsToWithdraw,
      withdrawalAmount,
      paymentSystem: paymentSystem || 'Stripe',
      accountNumber: accountNumber || 'acct_default',
      status: 'pending',
    });

    // Notify Admins
    const admins = await (UserModel as any).find({ role: 'Admin' });
    for (const admin of admins) {
      await createNotification(admin.email, `New withdrawal request: $${withdrawalAmount} (${creditsToWithdraw} credits) by ${creator.name}`);
    }

    return res.json({ withdrawal, message: 'Withdrawal request submitted to Admin for approval.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/withdrawals/my', verifyToken, requireRole(['Creator', 'Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const withdrawals = await (WithdrawalModel as any).find({ creatorEmail: req.user?.email }).sort({ createdAt: -1 });
    return res.json({ withdrawals });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. CREDIT PURCHASE & PAYMENTS
// ==========================================

router.post('/payments/purchase-credits', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { credits, priceAmount, paymentMethod } = req.body;
    const creditCount = Number(credits);
    const amount = Number(priceAmount);

    if (!creditCount || !amount) {
      return res.status(400).json({ error: 'Valid credit package parameters required.' });
    }

    const user = await (UserModel as any).findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    user.credits += creditCount;
    await user.save();

    const paymentRecord = await (CreditPurchaseModel as any).create({
      userEmail: user.email,
      credits: creditCount,
      priceAmount: amount,
      paymentMethod: paymentMethod || 'Stripe Credit Card',
      stripePaymentId: `pi_stripe_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    });

    await createNotification(
      user.email,
      `Payment successful! Added ${creditCount} credits to your account balance for $${amount}.`
    );

    return res.json({
      message: 'Payment processed and credits added successfully!',
      credits: user.credits,
      paymentRecord,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/payments/history', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = await (CreditPurchaseModel as any).find({ userEmail: req.user?.email }).sort({ createdAt: -1 });
    return res.json({ history });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. ADMIN ROUTES
// ==========================================

router.get('/admin/stats', verifyToken, requireRole(['Admin']), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const totalSupporters = await (UserModel as any).countDocuments({ role: 'Supporter' });
    const totalCreators = await (UserModel as any).countDocuments({ role: 'Creator' });
    
    const allUsers = await (UserModel as any).find({});
    const totalAvailableCredits = allUsers.reduce((sum: number, u: any) => sum + (u.credits || 0), 0);

    const creditPurchases = await (CreditPurchaseModel as any).find({});
    const totalPaymentsProcessed = creditPurchases.reduce((sum: number, p: any) => sum + (p.priceAmount || 0), 0);

    return res.json({
      totalSupporters,
      totalCreators,
      totalAvailableCredits,
      totalPaymentsProcessed,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/admin/campaigns/pending', verifyToken, requireRole(['Admin']), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const campaigns = await (CampaignModel as any).find({ status: 'pending' }).sort({ createdAt: -1 });
    return res.json({ campaigns });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/admin/campaigns/:id/approve', verifyToken, requireRole(['Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaign = await (CampaignModel as any).findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    campaign.status = 'approved';
    await campaign.save();

    await createNotification(
      campaign.creatorEmail,
      `Your campaign "${campaign.title}" has been approved by the Admin and is now live to Supporters!`
    );

    return res.json({ message: 'Campaign approved successfully.', campaign });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/admin/campaigns/:id/reject', verifyToken, requireRole(['Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const campaign = await (CampaignModel as any).findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    campaign.status = 'rejected';
    await campaign.save();

    await createNotification(
      campaign.creatorEmail,
      `Your campaign "${campaign.title}" was rejected by the Admin.`
    );

    return res.json({ message: 'Campaign rejected.', campaign });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/admin/withdrawals/pending', verifyToken, requireRole(['Admin']), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const withdrawals = await (WithdrawalModel as any).find({ status: 'pending' }).sort({ createdAt: -1 });
    return res.json({ withdrawals });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/admin/withdrawals/:id/approve', verifyToken, requireRole(['Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const withdrawal = await (WithdrawalModel as any).findById(req.params.id);
    if (!withdrawal || withdrawal.status !== 'pending') {
      return res.status(400).json({ error: 'Withdrawal request not found or already processed.' });
    }

    const creator = await (UserModel as any).findOne({ email: withdrawal.creatorEmail });
    if (creator) {
      creator.raisedCredits = Math.max(0, (creator.raisedCredits || 0) - withdrawal.withdrawalCredit);
      await creator.save();
    }

    withdrawal.status = 'approved';
    await withdrawal.save();

    await createNotification(
      withdrawal.creatorEmail,
      `Your withdrawal request of $${withdrawal.withdrawalAmount} (${withdrawal.withdrawalCredit} credits) was processed successfully by Admin.`
    );

    return res.json({ message: 'Withdrawal approved and paid out.', withdrawal });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/admin/users', verifyToken, requireRole(['Admin']), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await (UserModel as any).find({}).sort({ createdAt: -1 });
    return res.json({ users });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/admin/users/:id/role', verifyToken, requireRole(['Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role } = req.body;
    if (!['Supporter', 'Creator', 'Admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid user role' });
    }

    const user = await (UserModel as any).findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.role = role;
    await user.save();

    return res.json({ message: `Role updated to ${role}`, user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/users/:id', verifyToken, requireRole(['Admin']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    await (UserModel as any).findByIdAndDelete(req.params.id);
    return res.json({ message: 'User removed from platform.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/admin/reports', verifyToken, requireRole(['Admin']), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const reports = await (ReportModel as any).find({}).sort({ createdAt: -1 });
    return res.json({ reports });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. NOTIFICATIONS & REPORTS
// ==========================================

router.get('/notifications', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const notifications = await (NotificationModel as any).find({ toEmail: req.user?.email }).sort({ createdAt: -1 });
    return res.json({ notifications });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.patch('/notifications/read-all', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await (NotificationModel as any).updateMany({ toEmail: req.user?.email, read: false }, { read: true });
    return res.json({ message: 'All notifications marked as read.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/reports', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { campaignId, campaignTitle, reason } = req.body;
    if (!campaignId || !reason) {
      return res.status(400).json({ error: 'Campaign ID and reason are required.' });
    }

    const report = await ReportModel.create({
      campaignId,
      campaignTitle: campaignTitle || 'Campaign',
      reporterName: req.user?.name || 'Supporter',
      reporterEmail: req.user?.email || '',
      reason,
    });

    return res.json({ report, message: 'Report submitted to platform Admin for review.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
// Refinement phase 1
// Refinement phase 2
// Refinement phase 3
// Refinement phase 4
// Refinement phase 5
// Refinement phase 6
// Refinement phase 7
