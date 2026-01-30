/**
 * Seed Question Bank - Prisma Version
 * Apex Virtus honest questions system
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding question bank...');

  // Failure micro-review questions (mandatory on incomplete)
  const failureQuestions = [
    {
      scope: 'attempt_fail',
      category: 'constraint',
      prompt: 'What was the first limiter that prevented completion?',
      answerType: 'enum',
      options: [
        'time',
        'energy',
        'attention',
        'environment',
        'health',
        'competing_obligation',
        'planning_error',
        'other'
      ]
    },
    {
      scope: 'attempt_fail',
      category: 'execution_integrity',
      prompt: 'Was this failure preventable with your current resources?',
      answerType: 'boolean',
      options: ['yes', 'no']
    },
    {
      scope: 'attempt_fail',
      category: 'next_adjustment',
      prompt: 'What adjustment will you make next?',
      answerType: 'enum',
      options: [
        'change_method',
        'change_schedule',
        'change_asset_usage',
        'change_environment',
        'rescope_action',
        'enforce_constraint_fix'
      ]
    }
  ];

  // Success micro-review questions (optional on complete)
  const successQuestions = [
    {
      scope: 'attempt_success',
      category: 'execution_integrity',
      prompt: 'What enabled success today?',
      answerType: 'enum',
      options: [
        'clear_schedule',
        'high_energy',
        'good_environment',
        'accountability',
        'momentum',
        'tool_usage',
        'asset_usage',
        'other'
      ]
    },
    {
      scope: 'attempt_success',
      category: 'constraint',
      prompt: 'What would most likely cause this to fail tomorrow?',
      answerType: 'enum',
      options: [
        'time_conflict',
        'low_energy',
        'environment_change',
        'competing_priority',
        'loss_of_accountability',
        'tool_unavailable',
        'asset_depleted',
        'other'
      ]
    }
  ];

  // Daily review questions
  const dailyQuestions = [
    {
      scope: 'daily',
      category: 'execution_integrity',
      prompt: 'Did you follow your committed schedule today?',
      answerType: 'boolean',
      options: ['yes', 'no']
    },
    {
      scope: 'daily',
      category: 'constraint',
      prompt: 'What was the biggest constraint today?',
      answerType: 'enum',
      options: ['time', 'energy', 'attention', 'environment', 'health', 'external', 'none']
    }
  ];

  // Cycle review questions (mandatory at endDate or periodic intervals)
  const cycleQuestions = [
    {
      scope: 'cycle',
      category: 'tools',
      prompt: 'Which tools did you consistently apply?',
      answerType: 'text',
      options: null as string[] | null
    },
    {
      scope: 'cycle',
      category: 'tools',
      prompt: 'Which tools did you ignore or forget?',
      answerType: 'text',
      options: null as string[] | null
    },
    {
      scope: 'cycle',
      category: 'assets',
      prompt: 'Which assets were effectively deployed?',
      answerType: 'text',
      options: null as string[] | null
    },
    {
      scope: 'cycle',
      category: 'assets',
      prompt: 'Which assets were wasted or misaligned?',
      answerType: 'text',
      options: null as string[] | null
    },
    {
      scope: 'cycle',
      category: 'method',
      prompt: 'Did this method prove effective?',
      answerType: 'enum',
      options: ['supported', 'partially_supported', 'invalidated', 'insufficient_data']
    },
    {
      scope: 'cycle',
      category: 'method',
      prompt: 'What method adjustment is needed?',
      answerType: 'enum',
      options: [
        'keep_method',
        'adjust_method',
        'replace_method',
        'adjust_assets',
        'adjust_timeline',
        'refine_targets'
      ]
    },
    {
      scope: 'cycle',
      category: 'transfer',
      prompt: 'What is the single most transferable lesson from this cycle?',
      answerType: 'text',
      options: null as string[] | null
    },
    {
      scope: 'cycle',
      category: 'next_adjustment',
      prompt: 'What is your explicit replanning decision?',
      answerType: 'enum',
      options: [
        'continue_as_is',
        'adjust_targets',
        'change_method',
        'add_tools',
        'replace_assets',
        'extend_timeline',
        'pause_goal',
        'abandon_goal'
      ]
    }
  ];

  try {
    let count = 0;

    // Insert all questions
    for (const q of [...failureQuestions, ...successQuestions, ...dailyQuestions, ...cycleQuestions]) {
      await prisma.question.create({
        data: {
          scope: q.scope,
          category: q.category,
          prompt: q.prompt,
          answerType: q.answerType,
          options: q.options ? JSON.stringify(q.options) : null
        }
      });
      count++;
    }

    console.log(`✓ Successfully seeded ${count} questions`);
    console.log(`  - ${failureQuestions.length} failure micro-review questions`);
    console.log(`  - ${successQuestions.length} success micro-review questions`);
    console.log(`  - ${dailyQuestions.length} daily review questions`);
    console.log(`  - ${cycleQuestions.length} cycle review questions`);
  } catch (error) {
    console.error('✗ Error seeding questions:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
