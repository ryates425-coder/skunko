import AsyncStorage from '@react-native-async-storage/async-storage';

const STATS_KEY = '@bunco/stats';

export interface PlayerStats {
  individualGamesPlayed: number;
  individualGamesWon: number;
  individualRoundsPlayed: number;
  individualRoundsWon: number;
  individualBuncosCount: number;
  individualMiniBuncosCount: number;
  teamGamesPlayed: number;
  teamGamesWon: number;
  teamRoundsPlayed: number;
  teamRoundsWon: number;
  teamBuncosCount: number;
  teamMiniBuncosCount: number;
  individualHighScores: Array<{ score: number; createdAt: number }>;
  teamHighScores: Array<{ score: number; createdAt: number }>;
}

const DEFAULT_STATS: PlayerStats = {
  individualGamesPlayed: 0,
  individualGamesWon: 0,
  individualRoundsPlayed: 0,
  individualRoundsWon: 0,
  individualBuncosCount: 0,
  individualMiniBuncosCount: 0,
  teamGamesPlayed: 0,
  teamGamesWon: 0,
  teamRoundsPlayed: 0,
  teamRoundsWon: 0,
  teamBuncosCount: 0,
  teamMiniBuncosCount: 0,
  individualHighScores: [],
  teamHighScores: [],
};

async function loadStats(): Promise<PlayerStats> {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (!raw) return { ...DEFAULT_STATS };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATS, ...parsed };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

async function saveStats(stats: PlayerStats): Promise<void> {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

function addToTopScores(
  scores: Array<{ score: number; createdAt: number }>,
  score: number,
  max = 10
): Array<{ score: number; createdAt: number }> {
  const next = [...scores, { score, createdAt: Date.now() }];
  next.sort((a, b) => b.score - a.score);
  return next.slice(0, max);
}

type ScoringMode = 'individual' | 'team';

export async function recordGameComplete(params: {
  scoringMode: ScoringMode;
  humanWon: boolean;
  humanTotalScore: number;
}): Promise<void> {
  const stats = await loadStats();
  const { scoringMode, humanWon, humanTotalScore } = params;

  if (scoringMode === 'individual') {
    stats.individualGamesPlayed++;
    if (humanWon) stats.individualGamesWon++;
    stats.individualHighScores = addToTopScores(
      stats.individualHighScores,
      humanTotalScore
    );
  } else {
    stats.teamGamesPlayed++;
    if (humanWon) stats.teamGamesWon++;
    stats.teamRoundsPlayed += 6;
    stats.teamHighScores = addToTopScores(
      stats.teamHighScores,
      humanTotalScore
    );
  }

  await saveStats(stats);
}

export async function recordRoundComplete(params: {
  scoringMode: ScoringMode;
  humanWonRound: boolean;
}): Promise<void> {
  const stats = await loadStats();
  const { scoringMode, humanWonRound } = params;

  if (scoringMode === 'individual') {
    stats.individualRoundsPlayed++;
    if (humanWonRound) stats.individualRoundsWon++;
  } else {
    stats.teamRoundsPlayed++;
    if (humanWonRound) stats.teamRoundsWon++;
  }

  await saveStats(stats);
}

export async function recordBunco(scoringMode: ScoringMode): Promise<void> {
  const stats = await loadStats();
  if (scoringMode === 'individual') {
    stats.individualBuncosCount++;
  } else {
    stats.teamBuncosCount++;
  }
  await saveStats(stats);
}

export async function recordMiniBunco(scoringMode: ScoringMode): Promise<void> {
  const stats = await loadStats();
  if (scoringMode === 'individual') {
    stats.individualMiniBuncosCount++;
  } else {
    stats.teamMiniBuncosCount++;
  }
  await saveStats(stats);
}

export async function getStats(): Promise<PlayerStats> {
  return loadStats();
}
