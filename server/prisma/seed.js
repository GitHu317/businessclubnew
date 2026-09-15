import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ---- Board of Directors (BOD) admin accounts ----
  const bodAccounts = [
    {
      fullName: 'Dr. Abel Tesfaye',
      email: 'acct-tg6vymkgcvm88k@kuebc.edu',
      plainPassword: '2dTXW0T7FCvgVp8BbvWSIx!9',
      bodRole: 'PRESIDENT',
      studentId: 'KUE-ADMIN-001',
      department: 'Business Education',
    },
    {
      fullName: 'Selamawit Tadesse',
      email: 'acct-bejopzqjmyldpt@kuebc.edu',
      plainPassword: 'SF4FC9u2mk4Pqj9wM2QVWe!9',
      bodRole: 'BOD',
      studentId: 'KUE-BOD-001',
      department: 'Business Education',
    },
    {
      fullName: 'Yonas Girma',
      email: 'acct-avp33ositg0jln@kuebc.edu',
      plainPassword: '1bkTY7fhylco1OLlm33TAn!9',
      bodRole: 'BOD',
      studentId: 'KUE-BOD-002',
      department: 'Management',
    },
    {
      fullName: 'Bethel Alemu',
      email: 'acct-h3ana4aosicvuz@kuebc.edu',
      plainPassword: 'MxcphN81lNV2S7jEYndn8D!9',
      bodRole: 'BOD',
      studentId: 'KUE-BOD-003',
      department: 'Accounting & Finance',
    },
    {
      fullName: 'Robel Kebede',
      email: 'acct-1rn52amlhd3i5t@kuebc.edu',
      plainPassword: 'ucps2Gr6DQNEsAIFmwO126!9',
      bodRole: 'BOD',
      studentId: 'KUE-BOD-004',
      department: 'Marketing',
    },
    {
      fullName: 'Meron Haile',
      email: 'acct-gpok13t5cpubhl@kuebc.edu',
      plainPassword: '8Sp18fxCSC3UpnK77JSWs7!9',
      bodRole: 'BOD',
      studentId: 'KUE-BOD-005',
      department: 'Marketing & Outreach',
    },
  ];

  for (const a of bodAccounts) {
    const passwordHash = await bcrypt.hash(a.plainPassword, 10);
    await prisma.user.upsert({
      where: { email: a.email },
      update: {
        role: 'ADMIN',
        bodRole: a.bodRole,
        fullName: a.fullName,
        passwordHash,
      },
      create: {
        fullName: a.fullName,
        email: a.email,
        passwordHash,
        studentId: a.studentId,
        department: a.department,
        role: 'ADMIN',
        bodRole: a.bodRole,
        membershipStatus: 'VERIFIED',
        membershipTier: 'HONORARY',
      },
    });
  }
  console.log(`  ✓ Created ${bodAccounts.length} BOD admin accounts (1 President + 5 BOD Members)`);

  // ---- Sample student (with onboarding data + gamification) ----
  const studentEmail = 'acct-cdebh6sbpkatu3@kuebc.edu';
  const studentPassword = await bcrypt.hash('FyQLQ1kGp5wuvQBQ4cd30m!9', 10);

  const student = await prisma.user.upsert({
    where: { email: studentEmail },
    update: { passwordHash: studentPassword },
    create: {
      fullName: 'Hanna Bekele',
      email: studentEmail,
      passwordHash: studentPassword,
      studentId: 'KUE-2024-0456',
      department: 'Science Education',
      role: 'STUDENT',
      membershipStatus: 'ACTIVE',
      membershipTier: 'PREMIUM',
      hasOnboarded: true,
      heardAbout: 'Friend / classmate',
      institution: 'Kotebe University of Education',
      usageGoals: 'Start my own campus-based business and learn financial basics.',
      xp: 120,
      level: 2,
    },
  });
  console.log('  ✓ Created sample student account (with onboarding + gamification)');

  // ---- 6 Board Members ----
  const boardMembers = [
    {
      fullName: 'Dr. Abel Tesfaye',
      title: 'President',
      bio: 'Dr. Abel leads strategic initiatives, partnerships with local enterprises, and the annual entrepreneurship summit at Kotebe University.',
      email: 'acct-tg6vymkgcvm88k@kuebc.edu',
      linkedin: 'https://linkedin.com/in/abel-tesfaye',
      twitter: 'https://twitter.com/abel_t',
      instagram: 'https://instagram.com/abel.t',
      order: 1,
    },
    {
      fullName: 'Selamawit Tadesse',
      title: 'Vice President',
      bio: 'Vice President responsible for academic programs and the LMS initiative. Selamawit coordinates course design and ensures every member has access to quality entrepreneurship training.',
      email: 'acct-bejopzqjmyldpt@kuebc.edu',
      linkedin: 'https://linkedin.com/in/selamawit-tadesse',
      twitter: 'https://twitter.com/selam_t',
      instagram: 'https://instagram.com/selam.t',
      order: 2,
    },
    {
      fullName: 'Yonas Girma',
      title: 'Secretary General',
      bio: 'Secretary General handling records, meeting minutes, membership verification, and club communications. Yonas keeps the club organised and transparent across both campuses.',
      email: 'acct-avp33ositg0jln@kuebc.edu',
      linkedin: 'https://linkedin.com/in/yonas-girma',
      twitter: 'https://twitter.com/yonas_g',
      instagram: 'https://instagram.com/yonas.g',
      order: 3,
    },
    {
      fullName: 'Bethel Alemu',
      title: 'Finance Head',
      bio: 'Finance Head managing club budgets, sponsorship deals, and the business simulation treasury. Bethel brings real-world accounting discipline from her internship at a local microfinance institution.',
      email: 'acct-h3ana4aosicvuz@kuebc.edu',
      linkedin: 'https://linkedin.com/in/bethel-alemu',
      twitter: 'https://twitter.com/bethel_a',
      instagram: 'https://instagram.com/bethel.a',
      order: 4,
    },
    {
      fullName: 'Robel Kebede',
      title: 'Events & Games Coordinator',
      bio: 'Coordinator of business games, case competitions, and the weekly simulation league. Robel designs the rulesets and scoring systems that make the club\'s games competitive and fun.',
      email: 'acct-1rn52amlhd3i5t@kuebc.edu',
      linkedin: 'https://linkedin.com/in/robel-kebede',
      twitter: 'https://twitter.com/robel_k',
      instagram: 'https://instagram.com/robel.k',
      order: 5,
    },
    {
      fullName: 'Meron Haile',
      title: 'Marketing & Outreach Lead',
      bio: 'Marketing lead driving the club\'s social media, recruitment campaigns, and partnerships with the Science Shared Campus. Meron runs the verification and certificate branding initiative.',
      email: 'acct-gpok13t5cpubhl@kuebc.edu',
      linkedin: 'https://linkedin.com/in/meron-haile',
      twitter: 'https://twitter.com/meron_h',
      instagram: 'https://instagram.com/meron.h',
      order: 6,
    },
  ];

  for (const m of boardMembers) {
    const existing = await prisma.boardMember.findFirst({ where: { email: m.email } });
    if (existing) {
      await prisma.boardMember.update({ where: { id: existing.id }, data: m });
    } else {
      await prisma.boardMember.create({ data: m });
    }
  }
  console.log(`  ✓ Ensured ${boardMembers.length} board members exist`);

  // ---- Creator / instructor profile (approved, linked to the President) ----
  const president = await prisma.user.findUnique({ where: { email: 'acct-tg6vymkgcvm88k@kuebc.edu' } });
  const creator = await prisma.creatorProfile.upsert({
    where: { userId: president.id },
    update: {},
    create: {
      userId: president.id,
      fullName: 'Dr. Abel Tesfaye',
      headline: 'President, Business Club — Senior Lecturer, Business Department',
      bio: 'Dr. Abel Tesfaye is a senior lecturer in the Business Department at Kotebe University of Education and the founding President of the Business Club. With over a decade of experience mentoring student entrepreneurs, he leads the club’s curriculum design and the annual entrepreneurship summit. His research focuses on early-stage venture finance in emerging markets.',
      expertise: JSON.stringify(['Entrepreneurship', 'Venture Finance', 'Business Modelling', 'Pitch Coaching']),
      avatarUrl: '',
      credentials: 'PhD in Business Administration, MBA in Finance, Certified Entrepreneurship Educator',
      approved: true,
      approvedAt: new Date(),
    },
  });
  console.log('  ✓ Ensured creator profile for President');

  // ---- Badges catalog ----
  const badges = [
    { key: 'first_step', name: 'First Step', description: 'Enrolled in your first course.', xpRequired: 0 },
    { key: 'lesson_master', name: 'Lesson Master', description: 'Completed 5 lessons.', xpRequired: 50 },
    { key: 'course_graduate', name: 'Course Graduate', description: 'Completed a full course.', xpRequired: 100 },
    { key: 'certified', name: 'Certified', description: 'Earned your first certificate.', xpRequired: 150 },
    { key: 'scholar', name: 'Scholar', description: 'Earned 3 certificates.', xpRequired: 450 },
    { key: 'game_on', name: 'Game On', description: 'Registered for a business game.', xpRequired: 20 },
  ];
  for (const b of badges) {
    await prisma.badge.upsert({
      where: { key: b.key },
      update: { name: b.name, description: b.description, xpRequired: b.xpRequired },
      create: b,
    });
  }
  console.log(`  ✓ Ensured ${badges.length} badges`);

  // Award a couple of badges to the sample student
  const firstStepBadge = await prisma.badge.findUnique({ where: { key: 'first_step' } });
  const gameOnBadge = await prisma.badge.findUnique({ where: { key: 'game_on' } });
  for (const badge of [firstStepBadge, gameOnBadge]) {
    const existing = await prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId: student.id, badgeId: badge.id } },
    });
    if (!existing) {
      await prisma.userBadge.create({ data: { userId: student.id, badgeId: badge.id } });
    }
  }
  console.log('  ✓ Awarded starter badges to sample student');

  // ---- Collectibles catalog (Pokémon-style) ----
  const collectibles = [
    { key: 'coin_starter', name: 'Starter Coin', description: 'A shiny coin for joining the club.', rarity: 'COMMON' },
    { key: 'gear_bronze', name: 'Bronze Gear', description: 'Bronze gear for completing your first lesson.', rarity: 'COMMON' },
    { key: 'trophy_silver', name: 'Silver Trophy', description: 'Silver trophy for finishing a course.', rarity: 'RARE' },
    { key: 'crown_gold', name: 'Gold Crown', description: 'Gold Crown for earning a certificate.', rarity: 'EPIC' },
    { key: 'phoenix_legend', name: 'Phoenix Emblem', description: 'Legendary Phoenix Emblem for 3 certificates.', rarity: 'LEGENDARY' },
  ];
  for (const c of collectibles) {
    await prisma.collectible.upsert({
      where: { key: c.key },
      update: { name: c.name, description: c.description, rarity: c.rarity },
      create: c,
    });
  }
  console.log(`  ✓ Ensured ${collectibles.length} collectibles`);

  // Award a starter collectible to the sample student
  const starterCoin = await prisma.collectible.findUnique({ where: { key: 'coin_starter' } });
  const existingCollectible = await prisma.userCollectible.findUnique({
    where: { userId_collectibleId: { userId: student.id, collectibleId: starterCoin.id } },
  });
  if (!existingCollectible) {
    await prisma.userCollectible.create({ data: { userId: student.id, collectibleId: starterCoin.id } });
  }
  console.log('  ✓ Awarded starter collectible to sample student');

  // ---- FAQ ----
  const faqs = [
    { question: 'Who can join the Business Club?', answer: 'Any registered student of Kotebe University of Education can join. Simply sign up with your student email, complete the short onboarding questionnaire, and you’re in!', category: 'Membership', order: 1 },
    { question: 'Are the courses free?', answer: 'Yes. All courses on the platform are free for Business Club members. Some premium games and events may have a small registration fee, which will be clearly marked.', category: 'Courses', order: 2 },
    { question: 'How do I earn a certificate?', answer: 'Enroll in a course, complete all lessons, and pass the final exam with at least 70%. You will automatically receive a verifiable certificate with a unique Certificate ID.', category: 'Certificates', order: 3 },
    { question: 'Can I become a course creator?', answer: 'Yes! Submit an instructor application from your dashboard. The Board of Directors reviews qualifications and, once approved, you can create and publish your own courses.', category: 'Courses', order: 4 },
    { question: 'What are Business Games?', answer: 'Business Games are optional club activities such as case challenges and friendly competitions organised by SSC. Register from the Games page to take part.', category: 'Games', order: 5 },
    { question: 'How does gamification work?', answer: 'You earn XP by enrolling, completing lessons, finishing courses, and earning certificates. XP determines your level. You also collect badges and reward items shown on your dashboard.', category: 'Gamification', order: 6 },
    { question: 'How do I verify a certificate?', answer: 'Use the Verify Certificate page and enter the Certificate ID. Anyone can verify a certificate’s authenticity without logging in.', category: 'Certificates', order: 7 },
    { question: 'I forgot my password, what do I do?', answer: 'Contact the Secretary General or any Board of Directors member through the club email. They will reset your account credentials securely.', category: 'Account', order: 8 },
  ];
  for (const f of faqs) {
    const existing = await prisma.fAQ.findFirst({ where: { question: f.question } });
    if (existing) {
      await prisma.fAQ.update({ where: { id: existing.id }, data: f });
    } else {
      await prisma.fAQ.create({ data: f });
    }
  }
  console.log(`  ✓ Ensured ${faqs.length} FAQ entries`);

  // ---- Sample chat messages ----
  const chatSeeds = [
    { userId: president.id, channel: 'board', body: 'Welcome to the Board chat. Use this space for internal coordination.' },
    { userId: president.id, channel: 'board', body: 'Reminder: the monthly membership review is this Friday.' },
  ];
  for (const c of chatSeeds) {
    const existing = await prisma.chatMessage.findFirst({ where: { body: c.body, channel: c.channel } });
    if (!existing) {
      await prisma.chatMessage.create({ data: c });
    }
  }
  console.log(`  ✓ Ensured ${chatSeeds.length} board chat messages`);

  // ---- Course 1: Foundations of Entrepreneurship (with tags + creator + rich media) ----
  const course1 = await prisma.course.upsert({
    where: { slug: 'foundations-of-entrepreneurship' },
    update: {
      title: 'Foundations of Entrepreneurship',
      description:
        'A foundational course introducing the mindset, tools, and processes every entrepreneur needs. Covers idea validation, market research, business modelling, financial basics, and pitching. Designed for members of the Business Club at Kotebe University of Education.',
      category: 'Entrepreneurship',
      level: 'Beginner',
      thumbnailUrl: '',
      published: true,
      cardOrder: 1,
      tags: JSON.stringify(['#business', '#free', '#entrepreneurship']),
      creatorId: creator.id,
    },
    create: {
      title: 'Foundations of Entrepreneurship',
      slug: 'foundations-of-entrepreneurship',
      description:
        'A foundational course introducing the mindset, tools, and processes every entrepreneur needs. Covers idea validation, market research, business modelling, financial basics, and pitching. Designed for members of the Business Club at Kotebe University of Education.',
      category: 'Entrepreneurship',
      level: 'Beginner',
      thumbnailUrl: '',
      published: true,
      cardOrder: 1,
      tags: JSON.stringify(['#business', '#free', '#entrepreneurship']),
      creatorId: creator.id,
    },
  });

  const lessons = [
    {
      title: 'Lesson 1: The Entrepreneurial Mindset',
      content:
        'Entrepreneurship begins with a mindset — a way of seeing problems as opportunities. In this lesson we explore the core traits of successful entrepreneurs: resilience, curiosity, bias for action, and comfort with uncertainty. You will reflect on your own strengths and identify which traits you want to develop during your time in the Business Club.',
      order: 1,
      durationMins: 18,
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      videoType: 'youtube',
    },
    {
      title: 'Lesson 2: Idea Validation & Market Research',
      content:
        'A great idea is only valuable if real customers want it. This lesson covers lean validation techniques: the problem-solution fit, customer interviews, the Mom Test, and building a simple landing page to test demand.',
      order: 2,
      durationMins: 22,
      videoUrl: '',
      videoType: 'none',
    },
    {
      title: 'Lesson 3: Business Model Canvas',
      content:
        'The Business Model Canvas is a one-page tool that captures how your venture creates, delivers, and captures value. We walk through all nine building blocks and apply them to a sample campus-based business.',
      order: 3,
      durationMins: 25,
      videoUrl: 'https://player.vimeo.com/video/76979871',
      videoType: 'vimeo',
    },
    {
      title: 'Lesson 4: Financial Basics for Startups',
      content:
        'Numbers tell the story of your business. This lesson introduces the three core financial statements in plain language. You will learn how to forecast revenue, estimate break-even, and price your product.',
      order: 4,
      durationMins: 20,
      videoUrl: '',
      videoType: 'none',
    },
    {
      title: 'Lesson 5: Pitching & Telling Your Story',
      content:
        'Investors, partners, and customers all buy into a story before they buy a product. This lesson covers the structure of a winning pitch. You will draft a 90-second pitch for your own idea.',
      order: 5,
      durationMins: 15,
      videoUrl: '',
      videoType: 'none',
    },
  ];

  for (const l of lessons) {
    const existingLesson = await prisma.lesson.findFirst({ where: { courseId: course1.id, title: l.title } });
    let lessonRecord;
    if (existingLesson) {
      lessonRecord = await prisma.lesson.update({ where: { id: existingLesson.id }, data: { ...l, courseId: course1.id } });
    } else {
      lessonRecord = await prisma.lesson.create({ data: { ...l, courseId: course1.id } });
    }

    // Add media to lesson 3 (sample image + document)
    if (l.title.includes('Business Model Canvas')) {
      const existingMedia = await prisma.mediaAttachment.findFirst({ where: { lessonId: lessonRecord.id, filename: 'business-model-canvas.png' } });
      if (!existingMedia) {
        await prisma.mediaAttachment.create({
          data: {
            lessonId: lessonRecord.id,
            type: 'image',
            url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Business_Model_Canvas.png/1200px-Business_Model_Canvas.png',
            filename: 'business-model-canvas.png',
            caption: 'The nine building blocks of the Business Model Canvas.',
            order: 1,
          },
        });
      }
      const existingDoc = await prisma.mediaAttachment.findFirst({ where: { lessonId: lessonRecord.id, filename: 'bmc-template.pdf' } });
      if (!existingDoc) {
        await prisma.mediaAttachment.create({
          data: {
            lessonId: lessonRecord.id,
            type: 'document',
            url: 'https://www.edrawsoft.com/templates/pdf/business-model-canvas.pdf',
            filename: 'bmc-template.pdf',
            caption: 'Printable Business Model Canvas template.',
            order: 2,
          },
        });
      }
    }

    // Add an embedded mini-quiz to lesson 1
    if (l.title.includes('Entrepreneurial Mindset')) {
      const existingQuiz = await prisma.lessonQuiz.findUnique({ where: { lessonId: lessonRecord.id } });
      if (!existingQuiz) {
        await prisma.lessonQuiz.create({
          data: {
            lessonId: lessonRecord.id,
            title: 'Mindset Quick Check',
            questions: {
              create: [
                {
                  text: 'A bias for action means preferring to act rather than wait for perfect information.',
                  type: 'TRUE_FALSE',
                  options: JSON.stringify([]),
                  answer: 'true',
                  order: 1,
                },
                {
                  text: 'The single most important trait of an entrepreneur is _____.',
                  type: 'FILL_BLANK',
                  options: JSON.stringify([]),
                  answer: 'resilience',
                  order: 2,
                },
                {
                  text: 'Which is a core trait of successful entrepreneurs?',
                  type: 'MCQ',
                  options: JSON.stringify(['Avoiding all risk', 'Curiosity', 'Waiting for certainty', 'Disliking change']),
                  answer: '1',
                  order: 3,
                },
              ],
            },
          },
        });
      }
    }
  }
  console.log(`  ✓ Ensured course 1 "${course1.title}" with rich-media lessons, media & quizzes`);

  // ---- Exam for course 1 (multi-type questions) ----
  let exam1 = await prisma.exam.findFirst({ where: { courseId: course1.id, title: 'Foundations of Entrepreneurship — Final Exam' } });
  if (!exam1) {
    exam1 = await prisma.exam.create({
      data: {
        courseId: course1.id,
        title: 'Foundations of Entrepreneurship — Final Exam',
        description:
          'Test your understanding of the core concepts covered in the course. You need 70% to pass and earn your Certificate of Completion.',
        passingScore: 70,
        durationMins: 20,
        questions: {
          create: [
            {
              text: 'Which trait is most closely associated with the entrepreneurial mindset?',
              type: 'MCQ',
              options: JSON.stringify(['Avoiding all risk', 'Comfort with uncertainty and a bias for action', 'Waiting for perfect information', 'Preferring stability over growth']),
              correctIndex: 1,
              points: 1,
            },
            {
              text: 'What is the primary goal of customer interviews in the idea validation stage?',
              type: 'MCQ',
              options: JSON.stringify(['To sell the product early', 'To collect compliments', 'To learn about the customer’s real problems', 'To convince investors']),
              correctIndex: 2,
              points: 1,
            },
            {
              text: 'The Business Model Canvas is a one-page visual tool that captures how a venture creates, delivers, and captures value.',
              type: 'TRUE_FALSE',
              options: JSON.stringify([]),
              answer: 'true',
              points: 1,
            },
            {
              text: 'The financial statement that shows whether a business is profitable over a period is the _____ statement.',
              type: 'FILL_BLANK',
              options: JSON.stringify([]),
              answer: 'income',
              points: 1,
            },
            {
              text: 'In one or two sentences, explain why break-even matters for a new venture.',
              type: 'SHORT_ANSWER',
              options: JSON.stringify([]),
              answer: 'Break-even shows the point where revenue covers costs, indicating the minimum viability threshold before profit.',
              points: 2,
            },
            {
              text: 'A strong pitch typically includes the problem, solution, market, traction, and a clear ask.',
              type: 'TRUE_FALSE',
              options: JSON.stringify([]),
              answer: 'true',
              points: 1,
            },
          ],
        },
      },
    });
  }
  if (exam1) console.log(`  ✓ Exam ready: "${exam1.title}" with multi-type questions`);

  // ---- Course 2: Advanced Marketing Strategy (prerequisite = course 1, locked until cert) ----
  const course2 = await prisma.course.upsert({
    where: { slug: 'advanced-marketing-strategy' },
    update: {
      title: 'Advanced Marketing Strategy',
      description:
        'Building on the foundations, this advanced course dives into market segmentation, positioning, digital marketing channels, and growth hacking. Only available to members who have earned the Foundations of Entrepreneurship certificate.',
      category: 'Marketing',
      level: 'Advanced',
      thumbnailUrl: '',
      published: true,
      cardOrder: 2,
      tags: JSON.stringify(['#business', '#marketing', '#advanced']),
      prerequisiteId: course1.id,
      creatorId: creator.id,
    },
    create: {
      title: 'Advanced Marketing Strategy',
      slug: 'advanced-marketing-strategy',
      description:
        'Building on the foundations, this advanced course dives into market segmentation, positioning, digital marketing channels, and growth hacking. Only available to members who have earned the Foundations of Entrepreneurship certificate.',
      category: 'Marketing',
      level: 'Advanced',
      thumbnailUrl: '',
      published: true,
      cardOrder: 2,
      tags: JSON.stringify(['#business', '#marketing', '#advanced']),
      prerequisiteId: course1.id,
      creatorId: creator.id,
    },
  });
  console.log(`  ✓ Ensured course 2 "${course2.title}" (prerequisite linked to course 1)`);

  // Lessons for course 2
  const lessons2 = [
    { title: 'Lesson 1: Segmentation & Targeting', content: 'Learn to divide a market into segments and choose which to target using demographic, geographic, and behavioural criteria.', order: 1, durationMins: 20, videoUrl: '', videoType: 'none' },
    { title: 'Lesson 2: Positioning & Brand', content: 'Craft a positioning statement and build a brand narrative that resonates with your target audience.', order: 2, durationMins: 22, videoUrl: '', videoType: 'none' },
    { title: 'Lesson 3: Digital Channels', content: 'Overview of SEO, social media, email marketing, and paid acquisition with practical budgeting guidance.', order: 3, durationMins: 25, videoUrl: '', videoType: 'none' },
  ];
  for (const l of lessons2) {
    const existingLesson = await prisma.lesson.findFirst({ where: { courseId: course2.id, title: l.title } });
    if (existingLesson) {
      await prisma.lesson.update({ where: { id: existingLesson.id }, data: { ...l, courseId: course2.id } });
    } else {
      await prisma.lesson.create({ data: { ...l, courseId: course2.id } });
    }
  }
  console.log(`  ✓ Ensured course 2 has ${lessons2.length} lessons`);

  // ---- Reviews for course 1 ----
  const reviewSeeds = [
    { userId: student.id, courseId: course1.id, rating: 5, comment: 'Excellent introduction — the pitch lesson alone was worth it!' },
  ];
  for (const r of reviewSeeds) {
    const existing = await prisma.review.findUnique({ where: { userId_courseId: { userId: r.userId, courseId: r.courseId } } });
    if (existing) {
      await prisma.review.update({ where: { id: existing.id }, data: { rating: r.rating, comment: r.comment, published: true } });
    } else {
      await prisma.review.create({ data: { ...r, published: true } });
    }
  }
  console.log(`  ✓ Ensured ${reviewSeeds.length} review(s)`);

  // ---- Business Games ----
  const games = [
    {
      title: 'SSC Business Activity Day',
      description:
        'A practical SSC club activity where students work together, discuss business ideas, and apply what they learn in a friendly school-club setting.',
      type: 'COMPETITION',
      rules:
        '1. Open to registered SSC members. 2. Participants work in small teams. 3. Follow the activity instructions shared by the club. 4. Respectful collaboration is expected.',
      schedule: 'As announced by the SSC club – Science Shared Campus',
      status: 'UPCOMING',
      registrationOpen: true,
      registrationUrl: '',
      announcement: 'Registration is now open. Join fellow SSC members for a practical club activity.',
      startDate: new Date('2026-10-01T09:00:00Z'),
      endDate: new Date('2026-12-15T17:00:00Z'),
    },
    {
      title: 'Business Case Challenge: The Addis Coffee Problem',
      description:
        'A one-day case competition. Teams receive a real business case about scaling a local coffee roaster and have 6 hours to prepare a recommendation, financial model, and pitch.',
      type: 'CASE_CHALLENGE',
      rules: '1. Teams of 3–4. 2. 6 hours total. 3. Submit a 10-slide deck + 1-page financial summary. 4. Top 3 teams pitch 7 min + 3 min Q&A.',
      schedule: 'Saturday, 9:00 AM – 5:00 PM',
      status: 'UPCOMING',
      registrationOpen: true,
      registrationUrl: '',
      announcement: 'Judges confirmed: two local founders and one faculty member. Prizes for top 3 teams.',
      startDate: new Date('2026-09-26T06:00:00Z'),
      endDate: new Date('2026-09-26T14:00:00Z'),
    },
    {
      title: 'Monthly Pitch Night',
      description:
        'A monthly event where members pitch their ideas in 90 seconds to the club and invited guests. The audience votes, and the winner gets mentorship hours with the board.',
      type: 'COMPETITION',
      rules: '1. 90-second pitch, no slides. 2. Open to all members. 3. Audience vote decides the winner. 4. Winner receives 2 hours of mentorship.',
      schedule: 'Last Thursday of every month, 5:00 PM',
      status: 'ONGOING',
      registrationOpen: true,
      registrationUrl: '',
      announcement: 'Next Pitch Night features a guest investor from the Addis startup scene.',
    },
  ];

  const oldSimulation = await prisma.businessGame.findFirst({ where: { title: 'Campus Startup Simulation League' } });
  if (oldSimulation) {
    await prisma.businessGame.update({ where: { id: oldSimulation.id }, data: { title: 'SSC Business Activity Day' } });
  }
  for (const g of games) {
    const existingGame = await prisma.businessGame.findFirst({ where: { title: g.title } });
    if (existingGame) {
      await prisma.businessGame.update({ where: { id: existingGame.id }, data: g });
    } else {
      await prisma.businessGame.create({ data: g });
    }
  }
  console.log(`  ✓ Ensured ${games.length} business games exist`);

  // ---- Announcements ----
  const announcements = [
    {
      title: 'Welcome to SSC at Kotebe University of Education',
      content:
        'We are thrilled to welcome all new and returning SSC members. Explore the platform, enroll in courses, take part in club activities, and grow together with fellow students.',
      category: 'GENERAL',
      pinned: true,
    },
    {
      title: 'Foundations of Entrepreneurship course now live',
      content:
        'Our flagship course "Foundations of Entrepreneurship" is now available. Complete all 5 lessons and pass the final exam to earn your verifiable Certificate of Completion.',
      category: 'COURSE',
      pinned: false,
    },
    {
      title: 'SSC club activity workshop',
      content:
        'Join us for an SSC club activity workshop. We will explain the activity, answer questions, and help members take part.',
      category: 'EVENT',
      pinned: false,
    },
  ];

  for (const a of announcements) {
    const existingAnn = await prisma.announcement.findFirst({ where: { title: a.title } });
    if (existingAnn) {
      await prisma.announcement.update({ where: { id: existingAnn.id }, data: a });
    } else {
      await prisma.announcement.create({ data: a });
    }
  }
  console.log(`  ✓ Ensured ${announcements.length} announcements exist`);

  console.log('\n✅ Seed complete!');
  console.log('   President:  acct-tg6vymkgcvm88k@kuebc.edu / 2dTXW0T7FCvgVp8BbvWSIx!9');
  console.log('   BOD 1:      acct-bejopzqjmyldpt@kuebc.edu / SF4FC9u2mk4Pqj9wM2QVWe!9');
  console.log('   BOD 2:      acct-avp33ositg0jln@kuebc.edu / 1bkTY7fhylco1OLlm33TAn!9');
  console.log('   BOD 3:      acct-h3ana4aosicvuz@kuebc.edu / MxcphN81lNV2S7jEYndn8D!9');
  console.log('   BOD 4:      acct-1rn52amlhd3i5t@kuebc.edu / ucps2Gr6DQNEsAIFmwO126!9');
  console.log('   BOD 5:      acct-gpok13t5cpubhl@kuebc.edu / 8Sp18fxCSC3UpnK77JSWs7!9');
  console.log('   Student:    acct-cdebh6sbpkatu3@kuebc.edu / FyQLQ1kGp5wuvQBQ4cd30m!9');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
