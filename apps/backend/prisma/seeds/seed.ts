import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const cover = (imageId: string) =>
  `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`;

// Shared by every non-admin account.
const DEFAULT_PASSWORD = 'password123';
// ponytail: default is fine for local, set SEED_ADMIN_PASSWORD before seeding a public DB.
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'GlitchAdmin!2026';

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

type UserSeed = {
  username: string;
  email: string;
  displayName: string;
  role?: UserRole;
  bio: string;
  location?: string;
};

const USERS: UserSeed[] = [
  {
    username: 'admin',
    email: 'admin@glitch.com',
    displayName: 'Administrator',
    role: UserRole.ADMIN,
    bio: 'System administrator and gaming enthusiast.',
  },
  {
    username: 'johndoe',
    email: 'john@example.com',
    displayName: 'John Doe',
    bio: 'Passionate gamer and indie game enthusiast. Love discovering hidden gems and supporting small developers.',
    location: 'San Francisco, CA',
  },
  {
    username: 'sarahgamer',
    email: 'sarah@example.com',
    displayName: 'Sarah Chen',
    bio: 'RPG fanatic and speedrunner. Always looking for the next great adventure.',
    location: 'Toronto, Canada',
  },
  {
    username: 'retrogamer',
    email: 'mike@example.com',
    displayName: 'Mike Rodriguez',
    bio: "Retro gaming collector and reviewer. If it's from the 90s, I've probably played it.",
    location: 'Austin, TX',
  },
  {
    username: 'luna_mod',
    email: 'luna.moderator@glitch.com',
    displayName: 'Luna Park',
    role: UserRole.MODERATOR,
    bio: 'Community moderator. Keeping the boards civil and the spoilers tagged.',
    location: 'Seoul, South Korea',
  },
  {
    username: 'pixelwitch',
    email: 'pixelwitch@example.com',
    displayName: 'Aria Novak',
    bio: 'Pixel art lover and metroidvania addict. If it is hand-drawn, I will play it.',
    location: 'Prague, Czechia',
  },
  {
    username: 'nordicwolf',
    email: 'nordicwolf@example.com',
    displayName: 'Erik Lindqvist',
    bio: 'Swedish RPG nerd. Three hundred hours in every large open world I touch.',
    location: 'Stockholm, Sweden',
  },
  {
    username: 'quietgamer',
    email: 'quietgamer@example.com',
    displayName: 'Mei Tanaka',
    bio: 'I mostly lurk, but when a game earns it I write about why.',
    location: 'Osaka, Japan',
  },
  {
    username: 'speedrunseb',
    email: 'speedrunseb@example.com',
    displayName: 'Sebastien Roy',
    bio: 'Any% runner and glitch hunter. Routing is half the fun.',
    location: 'Montreal, Canada',
  },
  {
    username: 'cozyplays',
    email: 'cozyplays@example.com',
    displayName: 'Nadia Haddad',
    bio: 'Cozy games and farming sims are my therapy.',
    location: 'Casablanca, Morocco',
  },
  {
    username: 'grimdarkfan',
    email: 'grimdarkfan@example.com',
    displayName: 'Tom Bergman',
    bio: 'Dark fantasy enthusiast. Lore is my hobby and my problem.',
    location: 'Berlin, Germany',
  },
  {
    username: 'juniorsoul',
    email: 'juniorsoul@example.com',
    displayName: 'Diego Marín',
    bio: 'Patient games, big worlds, no rush.',
    location: 'Valencia, Spain',
  },
  {
    username: 'ratgoblin',
    email: 'ratgoblin@example.com',
    displayName: 'Petra Kowalska',
    bio: 'Roguelikes, deckbuilders and permanent death.',
    location: 'Kraków, Poland',
  },
  {
    username: 'epicurioso',
    email: 'epicurioso@example.com',
    displayName: 'Camila Ríos',
    bio: 'I play everything once. Genre nomad by design.',
    location: 'Montevideo, Uruguay',
  },
  {
    username: 'frostcat',
    email: 'frostcat@example.com',
    displayName: 'Ola Nordmann',
    bio: 'Horror games at 2am with the lights off.',
    location: 'Oslo, Norway',
  },
  {
    username: 'achhunter',
    email: 'achhunter@example.com',
    displayName: 'Ryan Mitchell',
    bio: 'Completionist. One hundred percent or nothing.',
    location: 'Seattle, WA',
  },
  {
    username: 'storyfirst',
    email: 'storyfirst@example.com',
    displayName: 'Hana Kim',
    bio: 'Narrative over mechanics, always.',
    location: 'Busan, South Korea',
  },
  {
    username: 'theoldguard',
    email: 'theoldguard@example.com',
    displayName: 'Bernard Lévesque',
    bio: 'Playing since the NES. The standards are high and they stay high.',
    location: 'Lyon, France',
  },
  {
    username: 'arcadefiend',
    email: 'arcadefiend@example.com',
    displayName: 'Tariq Osei',
    bio: 'Arcade, fighting games and impossible combos.',
    location: 'Lagos, Nigeria',
  },
  {
    username: 'morningstar',
    email: 'morningstar@example.com',
    displayName: 'Elena Rossi',
    bio: 'Slow-burn RPGs and long weekends.',
    location: 'Milan, Italy',
  },
];

// Real IGDB ids, slugs and cover ids — the app resolves game anchors by igdbId,
// so these must match what IGDB actually returns.
const GAMES = [
  { igdbId: 72, title: 'Portal 2', slug: 'portal-2', cover: 'co1rs4' },
  { igdbId: 26192, title: 'The Last of Us Part II', slug: 'the-last-of-us-part-ii', cover: 'co5ziw' },
  { igdbId: 25076, title: 'Red Dead Redemption 2', slug: 'red-dead-redemption-2', cover: 'co1q1f' },
  { igdbId: 11737, title: 'Outer Wilds', slug: 'outer-wilds', cover: 'co65ac' },
  { igdbId: 14593, title: 'Hollow Knight', slug: 'hollow-knight', cover: 'cobfzp' },
  {
    igdbId: 7346,
    title: 'The Legend of Zelda: Breath of the Wild',
    slug: 'the-legend-of-zelda-breath-of-the-wild',
    cover: 'co3p2d',
  },
  { igdbId: 74, title: 'Mass Effect 2', slug: 'mass-effect-2', cover: 'co20ac' },
  { igdbId: 26758, title: 'Super Mario Odyssey', slug: 'super-mario-odyssey', cover: 'co1mxf' },
  { igdbId: 11208, title: 'NieR: Automata', slug: 'nier-automata', cover: 'co5pcj' },
  { igdbId: 1877, title: 'Cyberpunk 2077', slug: 'cyberpunk-2077', cover: 'coaih8' },
  { igdbId: 26226, title: 'Celeste', slug: 'celeste', cover: 'cob9dh' },
  { igdbId: 1942, title: 'The Witcher 3: Wild Hunt', slug: 'the-witcher-3-wild-hunt', cover: 'coaarl' },
  { igdbId: 131890, title: 'Sea of Stars', slug: 'sea-of-stars', cover: 'co215b' },
  { igdbId: 7334, title: 'Bloodborne', slug: 'bloodborne', cover: 'cob99l' },
  { igdbId: 80529, title: 'Hades', slug: 'hades', cover: 'co4rs3' },
  { igdbId: 26472, title: 'Disco Elysium', slug: 'disco-elysium', cover: 'co1sfj' },
  { igdbId: 549, title: 'God of War', slug: 'god-of-war', cover: 'co3ddc' },
  { igdbId: 17000, title: 'Stardew Valley', slug: 'stardew-valley', cover: 'coa93h' },
  { igdbId: 119133, title: 'Elden Ring', slug: 'elden-ring', cover: 'co4jni' },
];

type ReviewSeed = {
  game: number;
  user: number;
  rating: number;
  title: string;
  content: string;
  spoiler?: boolean;
};

// One review per (user, game) — enforced by @@unique([userId, gameId]).
// Ratings are half-steps only: the API validates with @IsHalfStep.
const REVIEWS: ReviewSeed[] = [
  // The Witcher 3: Wild Hunt
  {
    game: 11,
    user: 0,
    rating: 10,
    title: 'The benchmark I keep coming back to',
    content:
      'Three hundred hours in and I am still finding quests I never saw. The Blood and Wine expansion alone justifies the price, and the way the game handles moral ambiguity is still unmatched. Every open-world RPG since has been measured against it.',
  },
  {
    game: 11,
    user: 4,
    rating: 9,
    title: 'A world that respects your time, mostly',
    content:
      'The writing is exceptional and the side content is genuinely worth doing, which is rare. My only gripe is the inventory and crafting bloat. Trim that and it would be flawless.',
  },
  {
    game: 11,
    user: 9,
    rating: 8.5,
    title: 'Beautiful, but emotionally heavy',
    content:
      'I came for the scenery and stayed for the characters. It is not a relaxing game by any measure, and some quests left me genuinely sad for days. Worth it, but pace yourself.',
  },
  {
    game: 11,
    user: 17,
    rating: 9.5,
    title: 'Proof that scale and craft can coexist',
    content:
      'I have been playing RPGs since the eighties and few games have this level of confidence. The dialogue trees actually change outcomes. Novigrad is one of the great cities in the medium.',
  },

  // Elden Ring
  {
    game: 18,
    user: 2,
    rating: 10,
    title: 'The open world finally justified itself',
    content:
      'The first time I crested a hill and saw a dragon fighting a giant in the distance, I understood what the genre had been missing. It trusts you to get lost and rewards you for it. Combat is tight and the build variety is enormous.',
  },
  {
    game: 18,
    user: 7,
    rating: 9.5,
    title: 'Brutal, but fair in the ways that matter',
    content:
      'I bounced off Souls games twice before this. The difference is the freedom: if a boss walls you, there are five other places to go. That single design choice turned the series around for me.',
  },
  {
    game: 18,
    user: 13,
    rating: 9,
    title: 'Astonishing, though the last third drags',
    content:
      'The opening twenty hours are the best I have had this generation. The Mountaintops and the late-game difficulty spike are a real blemish on an otherwise extraordinary package.',
  },
  {
    game: 18,
    user: 19,
    rating: 10,
    title: 'The best game I have ever played',
    content:
      'I have finished it four times with four different builds and it still surprises me. The lore is dense without being obtuse and the art direction is unmatched in fantasy. Nothing else comes close.',
  },

  // Cyberpunk 2077
  {
    game: 9,
    user: 1,
    rating: 9,
    title: 'Night City is the real protagonist',
    content:
      'The city is the most convincing open world ever built: vertical, dense and genuinely alive at night. The gunplay is far better than it has any right to be, and the expansion finally delivered the story the base game promised.',
  },
  {
    game: 9,
    user: 11,
    rating: 8.5,
    title: 'Redeemed, not perfect',
    content:
      'The 2.0 rework transformed the build systems and the Phantom Liberty arc is excellent. Driving is still floaty and the police system remains thin. Still, this is not the game it launched as.',
  },
  {
    game: 9,
    user: 16,
    rating: 9.5,
    title: 'A quiet story about mortality in a loud world',
    content:
      'What stays with me is not the shooting, it is the conversations. The game is at its best in small rooms with a dying friend. The genre trappings are almost a distraction from the writing.',
  },

  // Breath of the Wild
  {
    game: 5,
    user: 3,
    rating: 9.5,
    title: 'Nintendo rewrote the rules again',
    content:
      'I grew up on the original and this is the most radical thing they have done to the formula. The climb-anything system removes the invisible walls that defined the series. My only complaint is weapon durability, which never stopped annoying me.',
  },
  {
    game: 5,
    user: 8,
    rating: 9,
    title: 'A physics sandbox disguised as an adventure',
    content:
      'From a routing perspective this game is a gift. The systems interact in ways the designers clearly did not anticipate, and the community is still discovering new tech years later. That is the mark of real depth.',
  },
  {
    game: 5,
    user: 14,
    rating: 8,
    title: 'Magical, but sparse',
    content:
      'The exploration is genuinely special and the art style will age beautifully. The dungeons are the weakest in the series, though, and the world can feel empty outside the main paths.',
  },

  // The Last of Us Part II
  {
    game: 1,
    user: 5,
    rating: 9.5,
    title: 'Uncomfortable on purpose',
    content:
      'This game made me put the controller down more than once, and I think that was the point. The performances are the best in the medium. It is not fun, and it was not trying to be.',
  },
  {
    game: 1,
    user: 12,
    rating: 8.5,
    title: 'Craft above reproach, pacing below',
    content:
      'The level design and animation work are extraordinary. The middle act reshuffles the timeline in a way that broke my momentum rather than deepening it. I respect it more than I enjoyed it.',
  },
  {
    game: 1,
    user: 18,
    rating: 7.5,
    title: 'A technical marvel I never want to replay',
    content:
      'Every system is polished to an absurd degree and the accessibility options are industry-leading. But the story is relentlessly bleak, and it left me exhausted rather than moved. Once was enough.',
  },

  // Red Dead Redemption 2
  {
    game: 2,
    user: 6,
    rating: 10,
    title: 'The most detailed world ever rendered',
    content:
      'People complain about the slow animations; I think they are the point. The game forces you to live at the pace of its era, and the payoff is a relationship with a fictional gang that I have never matched in any other game.',
  },
  {
    game: 2,
    user: 10,
    rating: 9,
    title: 'A tragedy told at a walking pace',
    content:
      'The writing is literary and the epilogue lands harder than most full games. The mission design is rigid, though: step off the scripted path and you fail instantly.',
  },
  {
    game: 2,
    user: 15,
    rating: 9.5,
    title: 'Enormous, and the completion is worth it',
    content:
      'Yes, the hundred percent grind is punishing, but the collectibles and stranger missions are genuinely written, not filler. I spent ninety hours and did not regret a single one.',
  },

  // Hollow Knight
  {
    game: 4,
    user: 0,
    rating: 9.5,
    title: 'The best value in the genre',
    content:
      'A small team produced a metroidvania with more content and confidence than most full-price releases. The map system rewards patience and the boss design escalates perfectly.',
  },
  {
    game: 4,
    user: 7,
    rating: 10,
    title: 'Hand-drawn perfection',
    content:
      'Every frame is beautiful and the soundtrack has stayed with me for years. It is hard without being cruel, and the sense of discovery when you finally open a new area is unmatched.',
  },
  {
    game: 4,
    user: 12,
    rating: 9,
    title: 'Atmospheric and unforgiving',
    content:
      'The trek back to a boss after dying is the one flaw: it wastes time the game otherwise uses so well. Everything else, from the charm system to the art, is top tier.',
  },

  // Disco Elysium
  {
    game: 15,
    user: 2,
    rating: 10,
    title: 'The best writing in any game, full stop',
    content:
      'There is no combat and it does not need any. The skill checks, the internal voices, the politics and the sadness all cohere into something literature rarely achieves. Play it with patience.',
  },
  {
    game: 15,
    user: 9,
    rating: 8.5,
    title: 'A book that argues with you',
    content:
      'It is dense and initially hostile to newcomers, but once the dialogue system clicks it becomes compulsive. The voice acting in the Final Cut is a huge improvement.',
  },
  {
    game: 15,
    user: 18,
    rating: 9.5,
    title: 'Nothing else plays like it',
    content:
      'I came in expecting a detective game and got an interrogation of my own assumptions. The failure states are often funnier and more interesting than the successes.',
  },

  // Hades
  {
    game: 14,
    user: 1,
    rating: 9.5,
    title: 'The roguelike that solved narrative',
    content:
      'Dying advances the story instead of resetting it, which sounds simple and changes everything. The combat loop is fast and readable, and the voice cast is absurdly good.',
  },
  {
    game: 14,
    user: 13,
    rating: 9,
    title: 'Tight, fast, endlessly replayable',
    content:
      'Runs are short enough that a bad build never feels wasted and the boon system creates real variety. My only issue is that the later heats can push the difficulty into tedium.',
  },
  {
    game: 14,
    user: 17,
    rating: 9.5,
    title: "Supergiant's best work",
    content:
      'The art direction, the music and the moment-to-moment feel are all elite. It respects your time in a genre that usually does not. I have cleared it dozens of times and it still feels good.',
  },

  // Celeste
  {
    game: 10,
    user: 4,
    rating: 10,
    title: 'A game about difficulty and kindness',
    content:
      'The assist mode is not a compromise, it is the thesis. The platforming is precise and the story about anxiety is handled with a sincerity that most games avoid entirely.',
  },
  {
    game: 10,
    user: 8,
    rating: 9.5,
    title: 'Designed by people who understand movement',
    content:
      'Every dash, every wall bounce, every screen is tuned to the millisecond. The B-sides are the best challenge content in any platformer I have played.',
  },
  {
    game: 10,
    user: 16,
    rating: 9,
    title: 'Mechanics and story in perfect sync',
    content:
      'Climbing the mountain is the metaphor and the gameplay simultaneously. It never overexplains. The pixel art and soundtrack make the whole thing feel like a memory.',
  },

  // God of War
  {
    game: 16,
    user: 3,
    rating: 9.5,
    title: 'A franchise reborn with restraint',
    content:
      'They took a loud series and made it intimate. The single-take camera is a gimmick that works, and the relationship between father and son carries the whole runtime.',
  },
  {
    game: 16,
    user: 11,
    rating: 9,
    title: 'Weighty combat and real heart',
    content:
      'The axe feels incredible and the recall timing never gets old. The enemy variety runs thin by the end and the realm traversal is repetitive, but the core is superb.',
  },
  {
    game: 16,
    user: 19,
    rating: 9.5,
    title: 'The most confident reboot I have seen',
    content:
      'It understands exactly what to discard from the old games. The optional bosses are the highlight and the ending earns its emotion.',
  },

  // Stardew Valley
  {
    game: 17,
    user: 5,
    rating: 9,
    title: 'A decade of my life, gently',
    content:
      'One person made this and it has more heart than most studios manage in a generation. The farming loop is a genuine comfort and the character writing is deceptively sharp.',
  },
  {
    game: 17,
    user: 6,
    rating: 9.5,
    title: 'The most generous game ever made',
    content:
      'Free content updates for years, no monetisation, and a loop that respects your schedule. It is the only game I can play while listening to a podcast and still feel productive.',
  },
  {
    game: 17,
    user: 14,
    rating: 8.5,
    title: 'Wonderful, but it consumes you',
    content:
      'The first in-game year is magical. The late-game optimisation grind is where it lost me, but I got eighty hours of genuine joy before that.',
  },

  // Portal 2
  {
    game: 0,
    user: 10,
    rating: 10,
    title: 'The best-written comedy in games',
    content:
      'Every line lands and the puzzles are engineered so that the solution always feels like your idea. The co-op campaign is a full second game. Aged perfectly.',
  },
  {
    game: 0,
    user: 15,
    rating: 9.5,
    title: 'Short, flawless, endlessly quotable',
    content:
      'It does not waste a single room. The pacing is immaculate and the workshop community gave it years of extra life. The benchmark for puzzle design.',
  },

  // Outer Wilds
  {
    game: 3,
    user: 9,
    rating: 10,
    title: 'The only game I wish I could forget',
    content:
      'Its entire progression is knowledge, which means you can never replay it properly. The twenty-two minute loop is the most elegant structure in the medium. Go in blind.',
  },
  {
    game: 3,
    user: 19,
    rating: 9.5,
    title: 'Awe, dread and a banjo',
    content:
      'The moment the true nature of the solar system becomes clear is one of the great reveals in games, and the ending recontextualises everything you did before it. It is genuinely terrifying in places and never once cheap.',
    spoiler: true,
  },

  // Mass Effect 2
  {
    game: 6,
    user: 0,
    rating: 9.5,
    title: 'The high-water mark of the series',
    content:
      'The suicide mission structure means your preparation actually pays off, and the loyalty missions are the best character work BioWare ever did. The shooting is a big step up from the first game.',
  },
  {
    game: 6,
    user: 12,
    rating: 9,
    title: 'A masterclass in sequel design',
    content:
      'It trims the inventory bloat and doubles down on characters. The main plot is thin compared to the first game, but the crew carries it entirely.',
  },

  // Super Mario Odyssey
  {
    game: 7,
    user: 8,
    rating: 9.5,
    title: 'Movement tech for days',
    content:
      'The cap throw and dive chain give you an enormous skill ceiling that the game never forces you to reach. It is as deep as you want it to be, which is exactly right.',
  },
  {
    game: 7,
    user: 17,
    rating: 9,
    title: 'Joy, distilled and mechanical',
    content:
      'The kingdoms are inventive and the possession mechanic keeps surprising you well past the credits. Some moons are pure filler, which dilutes the hunt a little.',
  },

  // NieR: Automata
  {
    game: 8,
    user: 13,
    rating: 9.5,
    title: 'You have to finish it three times',
    content:
      'The first ending is not the game. What it does with the credits late in the story is the single boldest thing I have seen a game attempt, and it only works because of everything that came before it.',
    spoiler: true,
  },
  {
    game: 8,
    user: 14,
    rating: 9,
    title: 'Beautiful, strange and occasionally dull',
    content:
      'The combat is stylish but thin, and the open world is empty by design. The narrative and soundtrack more than compensate. Repeating the first playthrough is a real hurdle.',
  },

  // Sea of Stars
  {
    game: 12,
    user: 6,
    rating: 8.5,
    title: 'A loving homage with its own identity',
    content:
      'The timing-based combat keeps turn-based fights engaging and the art is gorgeous. The story is light and the party banter is limited, but the dungeons are clever and it never overstays.',
  },
  {
    game: 12,
    user: 11,
    rating: 8,
    title: 'Gorgeous, pleasant, a bit safe',
    content:
      'It nails the look and feel of the era it is channelling. I wanted more risk in the writing. Still a very easy game to recommend to anyone who loved the classics.',
  },

  // Bloodborne
  {
    game: 13,
    user: 4,
    rating: 10,
    title: 'The most cohesive FromSoftware world',
    content:
      'The shift from gothic horror to cosmic dread is the best tonal pivot in the series. Aggression is rewarded, which makes combat feel completely different from the Souls games.',
  },
  {
    game: 13,
    user: 7,
    rating: 9.5,
    title: 'Worth buying a console for',
    content:
      'The frame rate is the only complaint I can muster. The trick weapon design is the best in the genre and the art direction is genuinely unsettling rather than merely dark.',
  },
];

const GAME_LISTS = [
  { name: 'All-Time Favorites', description: 'Games that have left a lasting impact on me' },
  { name: 'Want to Play', description: "Games on my backlog that I'm excited to try" },
  { name: 'RPG Masterpieces', description: 'The best RPGs ever made' },
  { name: 'Comfort Games', description: 'What I replay when I need something familiar' },
  { name: 'Hidden Gems', description: 'Games more people should have played' },
  { name: 'Greatest of All Time', description: 'The shortlist when someone asks for a recommendation' },
];

const ENTRY_NOTES = [
  'The gold standard for the genre',
  'Challenging but incredibly rewarding',
  'Simply the best experience available',
  'Revolutionary take on a tired formula',
  'Returned to this one more times than I can count',
  'A slow burn that pays off completely',
];

const COMMENT_POOL = [
  'Completely agree. This one stayed with me for weeks afterwards.',
  'Great write-up. You put into words what I could not.',
  'I had the opposite experience, but I see exactly where you are coming from.',
  'This review convinced me to finally give it a proper try.',
  'Adding it to the backlog right now, thanks for the detail.',
  'The part about the pacing is spot on and nobody else mentions it.',
  'I bounced off it twice before it clicked. Glad I went back.',
  'Solid take. The soundtrack alone is worth the price of entry.',
];

const ACHIEVEMENTS = [
  { name: 'First Steps', description: 'Write your first game review', points: 10, icon: '📝' },
  { name: 'Social Butterfly', description: 'Follow 10 other users', points: 25, icon: '🦋' },
  { name: 'Prolific Reviewer', description: 'Write 50 game reviews', points: 100, icon: '✍️' },
  { name: 'Curator', description: 'Create your first game list', points: 15, icon: '📚' },
  { name: 'Popular', description: 'Get 100 likes on your reviews', points: 50, icon: '⭐' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function assertUniqueReviews() {
  const seen = new Set<string>();
  for (const review of REVIEWS) {
    const key = `${review.user}:${review.game}`;
    if (seen.has(key)) {
      throw new Error(`Duplicate review pair (user ${review.user}, game ${review.game})`);
    }
    seen.add(key);
  }
}

async function wipeDatabase() {
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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🌱 Starting database seed...');

  if (process.env.NODE_ENV === 'production' && process.env.SEED_ALLOW_PRODUCTION !== 'true') {
    throw new Error(
      'Refusing to wipe a production database. Set SEED_ALLOW_PRODUCTION=true to override.',
    );
  }

  assertUniqueReviews();
  await wipeDatabase();

  console.log('👤 Creating users...');
  const [hashedPassword, hashedAdminPassword] = await Promise.all([
    bcrypt.hash(DEFAULT_PASSWORD, 12),
    bcrypt.hash(ADMIN_PASSWORD, 12),
  ]);
  const users = await Promise.all(
    USERS.map((user) =>
      prisma.user.create({
        data: {
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          password: user.role === UserRole.ADMIN ? hashedAdminPassword : hashedPassword,
          role: user.role ?? UserRole.USER,
          bio: user.bio,
          location: user.location,
        },
      }),
    ),
  );

  console.log('🎮 Creating game anchors...');
  const games = await Promise.all(
    GAMES.map((game) =>
      prisma.game.create({
        data: {
          igdbId: game.igdbId,
          title: game.title,
          slug: game.slug,
          coverImage: cover(game.cover),
        },
      }),
    ),
  );

  console.log('📝 Creating reviews...');
  const reviews = await Promise.all(
    REVIEWS.map((review) =>
      prisma.review.create({
        data: {
          title: review.title,
          content: review.content,
          rating: review.rating,
          isSpoiler: review.spoiler ?? false,
          userId: users[review.user].id,
          gameId: games[review.game].id,
        },
      }),
    ),
  );

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
  await prisma.follow.createMany({
    data: USERS.flatMap((_, i) =>
      [1, 2, 3].map((offset) => ({
        followerId: users[i].id,
        followingId: users[(i + offset) % USERS.length].id,
      })),
    ),
  });

  console.log('❤️ Creating likes...');
  await prisma.like.createMany({
    data: REVIEWS.flatMap((review, i) =>
      Array.from({ length: 1 + (i % 3) }, (_, k) => ({
        userId: users[(review.user + k + 1) % USERS.length].id,
        reviewId: reviews[i].id,
      })),
    ),
  });

  console.log('💬 Creating comments...');
  await prisma.comment.createMany({
    data: REVIEWS.map((review, i) => ({ review, i }))
      .filter(({ i }) => i % 2 === 0)
      .map(({ review, i }) => ({
        content: COMMENT_POOL[(i / 2) % COMMENT_POOL.length],
        userId: users[(review.user + 5) % USERS.length].id,
        reviewId: reviews[i].id,
      })),
  });

  console.log('📋 Creating game lists...');
  const gameLists = await Promise.all(
    USERS.map((_, i) =>
      prisma.gameList.create({
        data: {
          name: GAME_LISTS[i % GAME_LISTS.length].name,
          description: GAME_LISTS[i % GAME_LISTS.length].description,
          userId: users[i].id,
          isPublic: true,
        },
      }),
    ),
  );

  console.log('📝 Creating game list entries...');
  await prisma.gameListEntry.createMany({
    data: USERS.flatMap((_, i) =>
      [0, 5, 11].map((offset, position) => ({
        gameListId: gameLists[i].id,
        gameId: games[(i + offset) % GAMES.length].id,
        order: position + 1,
        notes: ENTRY_NOTES[(i + position) % ENTRY_NOTES.length],
      })),
    ),
  });

  console.log('🏆 Creating achievements...');
  const achievements = await Promise.all(
    ACHIEVEMENTS.map((achievement) => prisma.achievement.create({ data: achievement })),
  );

  console.log('🎖️ Awarding achievements...');
  await prisma.userAchievement.createMany({
    data: USERS.flatMap((_, i) =>
      [0, 3].map((awarded) => ({
        userId: users[i].id,
        achievementId: achievements[awarded].id,
      })),
    ),
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Users: ${users.length}`);
  console.log(`- Games: ${games.length}`);
  console.log(`- Reviews: ${reviews.length}`);
  console.log(`- Achievements: ${achievements.length}`);
  console.log(`- Game Lists: ${gameLists.length}`);

  console.log('\n🔐 Test Credentials:');
  console.log(
    process.env.SEED_ADMIN_PASSWORD
      ? 'Admin: admin@glitch.com / <SEED_ADMIN_PASSWORD>'
      : `Admin: admin@glitch.com / ${ADMIN_PASSWORD}`,
  );
  console.log(`Moderator: luna.moderator@glitch.com / ${DEFAULT_PASSWORD}`);
  console.log(`User: john@example.com / ${DEFAULT_PASSWORD}`);
  console.log(`User: sarah@example.com / ${DEFAULT_PASSWORD}`);
  console.log(`User: mike@example.com / ${DEFAULT_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
