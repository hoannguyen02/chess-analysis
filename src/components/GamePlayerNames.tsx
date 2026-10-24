import type { GamePlayer } from '@/lib/chess/game-player-title';
import styles from '@/styles/GamePlayerNames.module.css';

export default function GamePlayerNames({
  players,
  fallback,
}: {
  players?: GamePlayer[];
  fallback: string;
}) {
  if (!players?.length) return <>{fallback}</>;
  return (
    <span className={styles.matchup}>
      {players.map((player, index) => (
        <span className={styles.player} key={index}>
          {index > 0 && <span className={styles.separator}>—</span>}
          {player.title && <span className={styles.title}>{player.title}</span>}
          <span className={styles.name} title={player.name}>
            {player.name}
          </span>
          {player.rating && (
            <span className={styles.rating} title="Elo theo dữ liệu ván đấu">
              ({player.rating})
            </span>
          )}
        </span>
      ))}
    </span>
  );
}
