import { useEffect } from 'react';
import type { GameDetail, PaginatedReviewsResponse, GameResponse } from '@glitch/shared-types';
import { setGameDetailWithCache, setSimilarGames } from '@/stores/games';
import { setGameReviews } from '@/stores/reviews';
import GameHeader from './GameHeader';
import GameTabs from './GameTabs';
import SimilarGamesSection from './SimilarGamesSection';

interface GameDetailPageProps {
  initialGame: GameDetail;
  initialReviews: PaginatedReviewsResponse;
  initialSimilarGames: GameResponse[];
}

export default function GameDetailPage({
  initialGame,
  initialReviews,
  initialSimilarGames,
}: GameDetailPageProps) {
  // Hydrate stores on mount with server-fetched data
  useEffect(() => {
    setGameDetailWithCache(initialGame, initialGame.game.slug);
    setGameReviews(initialReviews, initialGame.game.id);
    setSimilarGames(initialSimilarGames);
  }, [initialGame, initialReviews, initialSimilarGames]);

  return (
    <div className="min-h-screen bg-background">
      <div className="shell py-8 lg:py-10">
        <GameHeader game={initialGame} />
        <GameTabs game={initialGame} />
        <SimilarGamesSection similarGames={initialSimilarGames} />
      </div>
    </div>
  );
}
