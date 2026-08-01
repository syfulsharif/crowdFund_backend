import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  UserModel,
  CampaignModel,
  ContributionModel,
  WithdrawalModel,
  CreditPurchaseModel,
  NotificationModel,
  ReportModel,
} from './models.js';

let mongoMemoryInstance: MongoMemoryServer | null = null;

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  let mongoUri = process.env.MONGODB_URI;

  try {
    if (mongoUri && !mongoUri.includes('127.0.0.1:27017')) {
      console.log('Connecting to provided MONGODB_URI...');
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
      console.log('MongoDB connected successfully to remote URI.');
    } else {
      throw new Error('Using in-memory MongoDB fallback');
    }
  } catch (err) {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      console.error('Fatal: MONGODB_URI is required in production/Vercel. Cannot start in-memory fallback.');
      throw new Error('Database connection failed in production.');
    }
    console.log('Using in-memory MongoDB instance for instant sandbox startup...');
    mongoMemoryInstance = await MongoMemoryServer.create();
    mongoUri = mongoMemoryInstance.getUri();
    await mongoose.connect(mongoUri);
    console.log('In-memory MongoDB initialized and connected.');
  }

  await seedInitialData();
}

async function seedInitialData() {
  const userCount = await UserModel.countDocuments();
  if (userCount === 0) {
    console.log('Seeding initial CrowdFund platform data...');
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('AdminPassword123!', salt);
    const creatorPassword = await bcrypt.hash('Creator123!', salt);
    const supporterPassword = await bcrypt.hash('Supporter123!', salt);

    // Seed Users
    const adminUser = await UserModel.create({
      name: 'Platform Admin',
      email: 'admin@crowdfund.org',
      passwordHash: adminPassword,
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      role: 'Admin',
      credits: 1000,
      raisedCredits: 0,
    });

    const creatorUser = await UserModel.create({
      name: 'Elena Rostova',
      email: 'creator@crowdfund.org',
      passwordHash: creatorPassword,
      photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      role: 'Creator',
      credits: 250,
      raisedCredits: 1250,
    });

    const supporterUser = await UserModel.create({
      name: 'Marcus Vance',
      email: 'supporter@crowdfund.org',
      passwordHash: supporterPassword,
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'Supporter',
      credits: 350,
      raisedCredits: 0,
    });

    const creator2 = await UserModel.create({
      name: 'Dr. Aris Thorne',
      email: 'aris.thorne@eco-tech.org',
      passwordHash: creatorPassword,
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      role: 'Creator',
      credits: 80,
      raisedCredits: 890,
    });

    // Seed Campaigns
    const c1 = await CampaignModel.create({
      title: 'Solar-Powered Micro-Irrigation for Rural Farmers',
      story: 'Traditional diesel irrigation pumps consume up to 40% of smallholder farmer revenue in arid areas. Our solar-powered water pump system uses high-efficiency photovoltaic cells and intelligent soil moisture sensors to reduce water waste by 60% and eliminate fuel costs completely. We need credits to deploy 50 pilot pumps to co-op communities.',
      category: 'Technology',
      fundingGoal: 1500,
      minimumContribution: 10,
      deadline: '2026-10-15',
      rewardInfo: 'Pledge 50+ credits for a digital harvest certificate and real-time solar yield monitoring dashboard access.',
      imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80',
      status: 'approved',
      creatorName: creatorUser.name,
      creatorEmail: creatorUser.email,
      creatorId: creatorUser._id.toString(),
      amountRaised: 1250,
    });

    const c2 = await CampaignModel.create({
      title: 'Urban Rooftop Hydroponic Honey & Pollinator Haven',
      story: 'Converting underutilized urban rooftop concrete into flourishing native wildflower gardens and modular hydroponic bee sanctuaries. This project boosts local biodiversity, combats urban heat islands, and provides fresh neighborhood honey to community kitchens.',
      category: 'Environment',
      fundingGoal: 1000,
      minimumContribution: 15,
      deadline: '2026-11-01',
      rewardInfo: 'Pledge 100+ credits for a jar of artisan rooftop honey and your name engraved on the sanctuary planter wall.',
      imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&auto=format&fit=crop&q=80',
      status: 'approved',
      creatorName: creator2.name,
      creatorEmail: creator2.email,
      creatorId: creator2._id.toString(),
      amountRaised: 890,
    });

    const c3 = await CampaignModel.create({
      title: 'Open Source AI Literacy Kit for Underfunded Schools',
      story: 'Equipping Title 1 middle schools with interactive hardware kits and hands-on curriculum to teach machine learning, ethics, and robotics without expensive cloud subscriptions.',
      category: 'Education',
      fundingGoal: 800,
      minimumContribution: 20,
      deadline: '2026-09-30',
      rewardInfo: 'Pledge 30+ credits to receive full digital curriculum PDFs and sponsor a student robotics kit.',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
      status: 'approved',
      creatorName: creatorUser.name,
      creatorEmail: creatorUser.email,
      creatorId: creatorUser._id.toString(),
      amountRaised: 620,
    });

    const c4 = await CampaignModel.create({
      title: 'Autonomous Coastal Plastic Collector Vessel',
      story: 'Building solar-powered catamaran cleanup vessels equipped with computer vision to harvest floating plastic debris in harbors and estuaries before it reaches deep ocean currents.',
      category: 'Environment',
      fundingGoal: 2000,
      minimumContribution: 25,
      deadline: '2026-12-20',
      rewardInfo: 'Pledge 150+ credits for a recycled ocean-plastic commemorative plaque and GPS track logging.',
      imageUrl: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?w=800&auto=format&fit=crop&q=80',
      status: 'approved',
      creatorName: creator2.name,
      creatorEmail: creator2.email,
      creatorId: creator2._id.toString(),
      amountRaised: 1800,
    });

    const c5 = await CampaignModel.create({
      title: 'Community Mobile Dental & Vision Clinic Van',
      story: 'Bringing zero-cost preventive oral healthcare and prescription eyeglasses directly to underserved elderly centers and remote agricultural communities.',
      category: 'Health',
      fundingGoal: 1200,
      minimumContribution: 10,
      deadline: '2026-08-30',
      rewardInfo: 'Pledge 50+ credits to sponsor a complete eye exam for a senior in need.',
      imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
      status: 'approved',
      creatorName: 'Aria Sterling',
      creatorEmail: 'aria.sterling@carevan.org',
      amountRaised: 940,
    });

    const c6 = await CampaignModel.create({
      title: 'Artisan Pottery & Heritage Crafts Collective Studio',
      story: 'A collaborative maker space preserving traditional ceramic techniques while teaching modern kiln safety and sustainable clay reclamation.',
      category: 'Art',
      fundingGoal: 700,
      minimumContribution: 15,
      deadline: '2026-10-01',
      rewardInfo: 'Pledge 75+ credits for a custom handcrafted espresso mug made by resident craftspeople.',
      imageUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&auto=format&fit=crop&q=80',
      status: 'approved',
      creatorName: creatorUser.name,
      creatorEmail: creatorUser.email,
      creatorId: creatorUser._id.toString(),
      amountRaised: 520,
    });

    // Seed Pending Campaign for Admin Approval
    await CampaignModel.create({
      title: 'Biodegradable Algae-Based Packaging Containers',
      story: 'Replacing single-use styrofoam and thin film plastics with compostable marine-algae packaging that dissolves safely in natural soil within 30 days.',
      category: 'Technology',
      fundingGoal: 1800,
      minimumContribution: 20,
      deadline: '2026-11-30',
      rewardInfo: 'Pledge 50+ credits for a sample eco-packaging kit and sustainable merchant seal.',
      imageUrl: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=800&auto=format&fit=crop&q=80',
      status: 'pending',
      creatorName: creatorUser.name,
      creatorEmail: creatorUser.email,
      creatorId: creatorUser._id.toString(),
      amountRaised: 0,
    });

    // Seed Contributions
    await ContributionModel.create({
      campaignId: c1._id.toString(),
      campaignTitle: c1.title,
      amount: 150,
      supporterName: supporterUser.name,
      supporterEmail: supporterUser.email,
      creatorName: creatorUser.name,
      creatorEmail: creatorUser.email,
      status: 'approved',
      message: 'So excited to see clean energy powering sustainable agriculture!',
    });

    await ContributionModel.create({
      campaignId: c1._id.toString(),
      campaignTitle: c1.title,
      amount: 80,
      supporterName: supporterUser.name,
      supporterEmail: supporterUser.email,
      creatorName: creatorUser.name,
      creatorEmail: creatorUser.email,
      status: 'pending',
      message: 'Happy to contribute to solar pump expansion.',
    });

    await ContributionModel.create({
      campaignId: c2._id.toString(),
      campaignTitle: c2.title,
      amount: 100,
      supporterName: supporterUser.name,
      supporterEmail: supporterUser.email,
      creatorName: creator2.name,
      creatorEmail: creator2.email,
      status: 'approved',
      message: 'Keep urban pollinator sanctuaries thriving!',
    });

    // Seed Withdrawal Request
    await WithdrawalModel.create({
      creatorName: creatorUser.name,
      creatorEmail: creatorUser.email,
      withdrawalCredit: 400,
      withdrawalAmount: 20, // 400 credits / 20 = $20
      paymentSystem: 'Stripe',
      accountNumber: 'acct_198273918237',
      status: 'pending',
    });

    // Seed Credit Purchase
    await CreditPurchaseModel.create({
      userEmail: supporterUser.email,
      credits: 300,
      priceAmount: 25,
      paymentMethod: 'Stripe Credit Card',
      stripePaymentId: 'pi_3M291837192837',
    });

    // Seed Notifications
    await NotificationModel.create({
      toEmail: supporterUser.email,
      message: 'Your Contribution of 150 credits to Solar-Powered Micro-Irrigation for Rural Farmers was approved by Elena Rostova',
      actionRoute: '/dashboard',
      read: false,
    });

    await NotificationModel.create({
      toEmail: creatorUser.email,
      message: 'Marcus Vance pledged 80 credits to Solar-Powered Micro-Irrigation for Rural Farmers',
      actionRoute: '/dashboard',
      read: false,
    });

    // Seed Report
    await ReportModel.create({
      campaignId: c6._id.toString(),
      campaignTitle: c6.title,
      reporterName: supporterUser.name,
      reporterEmail: supporterUser.email,
      reason: 'Requesting verification of kiln installation location and local workshop permit compliance.',
    });

    console.log('CrowdFund initial database successfully seeded with realistic sample data!');
  }
}
