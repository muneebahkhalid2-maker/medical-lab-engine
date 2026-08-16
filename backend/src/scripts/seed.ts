import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Organization from '../models/Organization';
import Patient from '../models/Patient';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medextract';

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  console.log('Clearing old data...');
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Patient.deleteMany({});

  const org = await Organization.create({
    name: 'General Hospital',
    contactEmail: 'admin@generalhospital.com'
  });

  const passwordHash = await bcrypt.hash('password123', 10);

  const roles = [
    { email: 'admin@example.com', name: 'System Admin', role: 'ADMIN' },
    { email: 'doctor@example.com', name: 'Dr. Smith', role: 'DOCTOR' },
    { email: 'nurse@example.com', name: 'Nurse Jackie', role: 'NURSE' },
    { email: 'staff@example.com', name: 'John Doe', role: 'STAFF' }
  ];

  for (const r of roles) {
    await User.create({
      name: r.name,
      email: r.email,
      passwordHash,
      role: r.role as any,
      organizationId: org._id
    });
    console.log(`Created ${r.role}: ${r.email} / password123`);
  }

  const patient = await Patient.create({
    organizationId: org._id,
    patientId: 'P-1001',
    name: 'Jane Doe',
    age: 45,
    sex: 'Female'
  });

  console.log('Created sample patient:', patient.name);

  console.log('Seeding complete.');
  process.exit(0);
}

seed().catch(console.error);
