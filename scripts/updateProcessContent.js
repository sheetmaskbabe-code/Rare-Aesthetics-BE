import 'dotenv/config';
import { connectDB } from '../config/db.js';
import { ProcessPageContent } from '../models/ProcessPageContent.js';
import { DEFAULT_PROCESS_STEPS, defaultProcessData } from '../routes/process.js';

async function run() {
  await connectDB();
  await ProcessPageContent.findOneAndUpdate(
    { id: 'process_page' },
    {
      $set: {
        eyebrow: 'Our Approach',
        title: 'The Pathway to Beauty Innovation',
        description: defaultProcessData.description,
        steps: DEFAULT_PROCESS_STEPS,
      },
    },
    { upsert: true }
  );
  console.log('Updated ProcessPageContent with complete fields successfully!');
  process.exit(0);
}

run();
