import type { CompanyDetail, GameResponse } from '@glitch/shared-types';
import GameCard from './GameCard.tsx';

interface CompanyPageProps {
  company: CompanyDetail;
  games: GameResponse[];
  role: 'developer' | 'publisher';
}

export default function CompanyPage({ company, games, role }: CompanyPageProps) {
  const roleLabel = role === 'developer' ? 'Developer' : 'Publisher';

  return (
    <div className="shell py-8 lg:py-10">
      <div className="mb-8 flex flex-col gap-5 border-b border-border pb-8 sm:flex-row sm:items-start">
        {company.logo && (
          <img
            src={company.logo}
            alt=""
            width="72"
            height="72"
            loading="eager"
            decoding="async"
            className="size-18 shrink-0 rounded-md border border-border bg-muted object-contain p-2"
          />
        )}
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {roleLabel}
          </p>
          <h1 className="mt-2 text-2xl tracking-tight sm:text-3xl">{company.name}</h1>
          {company.description && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
              {company.description}
            </p>
          )}
        </div>
      </div>

      {games.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {games.map((game) => (
            <GameCard key={game.game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <h2 className="text-lg font-semibold text-foreground">No games to show yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We could not find any games for this {role} in the catalogue.
          </p>
          <a
            href="/games"
            className="mt-6 inline-flex items-center rounded-md border border-border-strong px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            Back to the catalogue
          </a>
        </div>
      )}
    </div>
  );
}
