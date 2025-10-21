export class DiceHistoryResponseDto {
  dice1: number[];
  dice2: number[];
  dice3: number[];
}

export class SessionHistoryItemDto {
  sessionId: string;
  totalPoints: number;
  result: 'tai' | 'xiu';
  createdAt: Date;
}

export class TopWinnerDto {
  userId: string;
  username: string;
  totalWin: number;
  totalGames: number;
  winRate: number;
  biggestWin: number;
}