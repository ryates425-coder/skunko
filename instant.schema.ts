import { i } from '@instantdb/react-native';

const _schema = i.schema({
  entities: {
    $users: i.entity({}),
    playerStats: i.entity({
      individualGamesPlayed: i.number(),
      individualGamesWon: i.number(),
      individualRoundsPlayed: i.number(),
      individualRoundsWon: i.number(),
      individualBuncosCount: i.number(),
      individualMiniBuncosCount: i.number(),
      teamGamesPlayed: i.number(),
      teamGamesWon: i.number(),
      teamRoundsPlayed: i.number(),
      teamRoundsWon: i.number(),
      teamBuncosCount: i.number(),
      teamMiniBuncosCount: i.number(),
    }),
    individualHighScores: i.entity({
      score: i.number().indexed(),
      createdAt: i.date(),
    }),
    teamHighScores: i.entity({
      score: i.number().indexed(),
      createdAt: i.date(),
    }),
  },
  links: {
    playerStatsUser: {
      forward: {
        on: 'playerStats',
        has: 'one',
        label: '$user',
      },
      reverse: {
        on: '$users',
        has: 'one',
        label: 'playerStats',
      },
    },
    individualHighScoresUser: {
      forward: {
        on: 'individualHighScores',
        has: 'one',
        label: '$user',
      },
      reverse: {
        on: '$users',
        has: 'many',
        label: 'individualHighScores',
      },
    },
    teamHighScoresUser: {
      forward: {
        on: 'teamHighScores',
        has: 'one',
        label: '$user',
      },
      reverse: {
        on: '$users',
        has: 'many',
        label: 'teamHighScores',
      },
    },
  },
  rooms: {},
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
