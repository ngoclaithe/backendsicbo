import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

@WebSocketGateway({ 
  namespace: 'game',
  cors: true 
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private countdownInterval: NodeJS.Timeout;
  private remainingTime: number = 45;
  private currentPhase: 'betting' | 'revealing' = 'betting';

  constructor(private gameService: GameService) {
    this.startGameLoop();
  }

  handleConnection(client: Socket) {
    console.log(`✅ Game client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Game client disconnected: ${client.id}`);
  }

  @SubscribeMessage('placeBet')
  async handlePlaceBet(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; bet: string; amount: number },
  ) {
    try {
      const result = await this.gameService.placeBet(data.userId, data.bet as 'tai' | 'xiu', data.amount);
      client.emit('betPlaced', result);
      
      const stats = this.gameService.getBettingStats();
      this.server.emit('bettingStats', stats);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  private async startGameLoop() {
    const runSession = async () => {
      // Phase 1: Betting - 45 giây
      this.currentPhase = 'betting';
      const session = await this.gameService.createNewSession();
      this.remainingTime = 45;

      this.server.emit('sessionStart', {
        sessionId: session.id,
        bettingTime: 45,
        totalTime: 60,
      });

      // Emit thống kê ban đầu (rỗng)
      this.server.emit('bettingStats', {
        tai: { count: 0, totalAmount: 0 },
        xiu: { count: 0, totalAmount: 0 },
      });

      this.countdownInterval = setInterval(() => {
        this.remainingTime--;
        
        // Lấy thống kê cược hiện tại
        const stats = this.gameService.getBettingStats();
        
        this.server.emit('countdown', { 
          remainingTime: this.remainingTime,
          phase: 'betting',
          bettingStats: stats,  
        });

        if (this.remainingTime <= 0) {
          clearInterval(this.countdownInterval);
          this.rollAndRevealDice();
        }
      }, 1000);
    };

    await runSession();
  }

  private async rollAndRevealDice() {
    this.server.emit('bettingClosed', {});

    // Lắc xúc xắc - 2 giây
    setTimeout(async () => {
      const result = await this.gameService.rollDice();
      
      this.server.emit('diceRolled', {
        sessionId: result.id,
        diceResults: result.diceResults,
        totalPoints: result.totalPoints,
        result: result.result,
      });

      // Phase 2: Revealing - 15 giây hiển thị kết quả
      this.currentPhase = 'revealing';
      this.remainingTime = 15;

      const revealInterval = setInterval(() => {
        this.remainingTime--;
        this.server.emit('countdown', { 
          remainingTime: this.remainingTime,
          phase: 'revealing',
        });

        if (this.remainingTime <= 0) {
          clearInterval(revealInterval);
          // Bắt đầu phiên mới
          this.startGameLoop();
        }
      }, 1000);

    }, 2000);
  }
}