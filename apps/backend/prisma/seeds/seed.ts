import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const cover = (imageId: string) =>
  `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`;

async function main() {
  console.log('🌱 Starting database seed...');

  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning existing data...');
    await prisma.userAchievement.deleteMany();
    await prisma.achievement.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.userSession.deleteMany();
    await prisma.gameListEntry.deleteMany();
    await prisma.gameList.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.like.deleteMany();
    await prisma.review.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.game.deleteMany();
    await prisma.user.deleteMany();
  }

  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 12);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@glitch.com',
        username: 'admin',
        displayName: 'Administrator',
        password: hashedPassword,
        role: UserRole.ADMIN,
        bio: 'System administrator and gaming enthusiast',
      },
    }),
    prisma.user.create({
      data: {
        email: 'john@example.com',
        username: 'johndoe',
        displayName: 'John Doe',
        password: hashedPassword,
        bio: 'Passionate gamer and indie game enthusiast. Love discovering hidden gems and supporting small developers.',
        location: 'San Francisco, CA',
      },
    }),
    prisma.user.create({
      data: {
        email: 'sarah@example.com',
        username: 'sarahgamer',
        displayName: 'Sarah Chen',
        password: hashedPassword,
        bio: 'RPG fanatic and speedrunner. Always looking for the next great adventure.',
        location: 'Toronto, Canada',
      },
    }),
    prisma.user.create({
      data: {
        email: 'mike@example.com',
        username: 'retrogamer',
        displayName: 'Mike Rodriguez',
        password: hashedPassword,
        bio: "Retro gaming collector and reviewer. If it's from the 90s, I've probably played it.",
        location: 'Austin, TX',
      },
    }),
  ]);

  console.log('🎮 Creating game anchors...');
  const games = await Promise.all([
    prisma.game.create({
      data: {
        igdbId: 1942,
        title: 'The Witcher 3: Wild Hunt',
        slug: 'the-witcher-3-wild-hunt',
        coverImage: cover('coaarl'),
      },
    }),
    prisma.game.create({
      data: {
        igdbId: 119133,
        title: 'Elden Ring',
        slug: 'elden-ring',
        coverImage: cover('co4jni'),
      },
    }),
    prisma.game.create({
      data: {
        igdbId: 26192,
        title: 'The Last of Us Part II',
        slug: 'the-last-of-us-part-ii',
        coverImage: cover('co5ziw'),
      },
    }),
    prisma.game.create({
      data: {
        igdbId: 26758,
        title: 'Super Mario Odyssey',
        slug: 'super-mario-odyssey',
        coverImage: cover('co1mxf'),
      },
    }),
  ]);

  console.log('📝 Creating reviews...');
  const reviews = await Promise.all([
    prisma.review.create({
      data: {
        title: 'A Masterpiece of Open World Design',
        content:
          "The Witcher 3 sets the gold standard for open-world RPGs. Every quest feels meaningful, every character has depth, and the world feels truly alive. The DLCs are worth the price of admission alone. Geralt's final adventure is one that will stay with you long after the credits roll.",
        rating: 9.5,
        userId: users[1].id,
        gameId: games[0].id,
        isPublished: true,
      },
    }),
    prisma.review.create({
      data: {
        title: 'Incredible but overwhelming',
        content:
          'While The Witcher 3 is undeniably a great game, I found myself overwhelmed by the sheer amount of content. The main story is excellent, but the side quests, while well-written, can feel endless. Still, this is a minor complaint for what is otherwise an exceptional RPG experience.',
        rating: 8.5,
        userId: users[2].id,
        gameId: games[0].id,
        isPublished: true,
      },
    }),
    prisma.review.create({
      data: {
        title: 'The King of RPGs',
        content:
          'Having played RPGs for over 20 years, I can confidently say The Witcher 3 is among the greatest ever made. The attention to detail, the moral complexity of choices, and the sheer scale of the world make this a must-play for any RPG fan.',
        rating: 10.0,
        userId: users[3].id,
        gameId: games[0].id,
        isPublished: true,
      },
    }),
    prisma.review.create({
      data: {
        title: "FromSoftware's Magnum Opus",
        content:
          "Elden Ring takes everything great about the Souls formula and places it in a breathtaking open world. The sense of discovery is unparalleled, and every boss fight feels like an epic encounter. This is easily FromSoftware's best work.",
        rating: 9.8,
        userId: users[1].id,
        gameId: games[1].id,
        isPublished: true,
      },
    }),
    prisma.review.create({
      data: {
        title: 'Beautiful but Brutal',
        content:
          'Elden Ring is stunning and the open world design is brilliant, but the difficulty can be punishing for newcomers to the series. The lack of clear direction might frustrate some players, but for those who enjoy exploration and challenge, this is perfect.',
        rating: 8.9,
        userId: users[2].id,
        gameId: games[1].id,
        isPublished: true,
      },
    }),
    prisma.review.create({
      data: {
        title: 'Emotional Powerhouse',
        content:
          "The Last of Us Part II is a bold sequel that isn't afraid to challenge players emotionally. While controversial, I found the story compelling and the gameplay refined. It's a game that demands to be experienced, even if it leaves you emotionally drained.",
        rating: 9.2,
        userId: users[1].id,
        gameId: games[2].id,
        isPublished: true,
      },
    }),
    prisma.review.create({
      data: {
        title: 'Pure Nintendo Magic',
        content:
          'Super Mario Odyssey reminds you why Nintendo is the king of platformers. The cap mechanics are ingenious, the worlds are creative and full of secrets, and the whole experience just radiates joy. A perfect game for players of all ages.',
        rating: 9.3,
        userId: users[2].id,
        gameId: games[3].id,
        isPublished: true,
      },
    }),
  ]);

  console.log('⭐ Recalculating game ratings...');
  for (const game of games) {
    const aggregate = await prisma.review.aggregate({
      where: { gameId: game.id, isPublished: true },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await prisma.game.update({
      where: { id: game.id },
      data: {
        averageRating: aggregate._avg.rating ?? 0,
        reviewCount: aggregate._count.rating,
      },
    });
  }

  console.log('🤝 Creating follows...');
  await Promise.all([
    prisma.follow.create({ data: { followerId: users[1].id, followingId: users[2].id } }),
    prisma.follow.create({ data: { followerId: users[1].id, followingId: users[3].id } }),
    prisma.follow.create({ data: { followerId: users[2].id, followingId: users[1].id } }),
    prisma.follow.create({ data: { followerId: users[2].id, followingId: users[3].id } }),
    prisma.follow.create({ data: { followerId: users[3].id, followingId: users[1].id } }),
  ]);

  console.log('❤️ Creating likes...');
  await Promise.all([
    prisma.like.create({ data: { userId: users[2].id, reviewId: reviews[0].id } }),
    prisma.like.create({ data: { userId: users[3].id, reviewId: reviews[0].id } }),
    prisma.like.create({ data: { userId: users[1].id, reviewId: reviews[1].id } }),
    prisma.like.create({ data: { userId: users[3].id, reviewId: reviews[3].id } }),
  ]);

  console.log('💬 Creating comments...');
  await Promise.all([
    prisma.comment.create({
      data: {
        content: 'Totally agree! The Blood and Wine DLC is practically a full game on its own.',
        userId: users[2].id,
        reviewId: reviews[0].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'Great review! I had similar feelings about the overwhelming amount of content.',
        userId: users[1].id,
        reviewId: reviews[1].id,
      },
    }),
    prisma.comment.create({
      data: {
        content:
          'FromSoftware really outdid themselves with this one. The boss designs are incredible.',
        userId: users[2].id,
        reviewId: reviews[3].id,
      },
    }),
  ]);

  console.log('📋 Creating game lists...');
  const gameLists = await Promise.all([
    prisma.gameList.create({
      data: {
        name: 'All-Time Favorites',
        description: 'Games that have left a lasting impact on me',
        userId: users[1].id,
        isPublic: true,
      },
    }),
    prisma.gameList.create({
      data: {
        name: 'Want to Play',
        description: "Games on my backlog that I'm excited to try",
        userId: users[1].id,
        isPublic: true,
      },
    }),
    prisma.gameList.create({
      data: {
        name: 'RPG Masterpieces',
        description: 'The best RPGs ever made',
        userId: users[2].id,
        isPublic: true,
      },
    }),
  ]);

  console.log('📝 Creating game list entries...');
  await Promise.all([
    prisma.gameListEntry.create({
      data: {
        gameListId: gameLists[0].id,
        gameId: games[0].id,
        order: 1,
        notes: 'The gold standard for open-world RPGs',
      },
    }),
    prisma.gameListEntry.create({
      data: {
        gameListId: gameLists[0].id,
        gameId: games[1].id,
        order: 2,
        notes: 'Challenging but incredibly rewarding',
      },
    }),
    prisma.gameListEntry.create({
      data: {
        gameListId: gameLists[2].id,
        gameId: games[0].id,
        order: 1,
        notes: 'Simply the best RPG experience available',
      },
    }),
    prisma.gameListEntry.create({
      data: {
        gameListId: gameLists[2].id,
        gameId: games[1].id,
        order: 2,
        notes: 'Revolutionary take on the RPG formula',
      },
    }),
  ]);

  console.log('🏆 Creating achievements...');
  const achievements = await Promise.all([
    prisma.achievement.create({
      data: {
        name: 'First Steps',
        description: 'Write your first game review',
        points: 10,
        icon: '📝',
      },
    }),
    prisma.achievement.create({
      data: {
        name: 'Social Butterfly',
        description: 'Follow 10 other users',
        points: 25,
        icon: '🦋',
      },
    }),
    prisma.achievement.create({
      data: {
        name: 'Prolific Reviewer',
        description: 'Write 50 game reviews',
        points: 100,
        icon: '✍️',
      },
    }),
    prisma.achievement.create({
      data: {
        name: 'Curator',
        description: 'Create your first game list',
        points: 15,
        icon: '📚',
      },
    }),
    prisma.achievement.create({
      data: {
        name: 'Popular',
        description: 'Get 100 likes on your reviews',
        points: 50,
        icon: '⭐',
      },
    }),
  ]);

  console.log('🎖️ Awarding achievements...');
  await Promise.all([
    prisma.userAchievement.create({
      data: { userId: users[1].id, achievementId: achievements[0].id },
    }),
    prisma.userAchievement.create({
      data: { userId: users[1].id, achievementId: achievements[3].id },
    }),
    prisma.userAchievement.create({
      data: { userId: users[2].id, achievementId: achievements[0].id },
    }),
    prisma.userAchievement.create({
      data: { userId: users[3].id, achievementId: achievements[0].id },
    }),
  ]);

  console.log('✅ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Users: ${users.length}`);
  console.log(`- Games: ${games.length}`);
  console.log(`- Reviews: ${reviews.length}`);
  console.log(`- Achievements: ${achievements.length}`);
  console.log(`- Game Lists: ${gameLists.length}`);

  console.log('\n🔐 Test Credentials:');
  console.log('Admin: admin@glitch.com / password123');
  console.log('User: john@example.com / password123');
  console.log('User: sarah@example.com / password123');
  console.log('User: mike@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
