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

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
}

@WebSocketGateway({ 
  namespace: 'chat',
  cors: true 
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private messages: ChatMessage[] = [];
  private readonly MAX_MESSAGES = 100;

  handleConnection(client: Socket) {
    console.log(`Chat client connected: ${client.id}`);
    
    client.emit('chatHistory', this.messages);
  }

  handleDisconnect(client: Socket) {
    console.log(`Chat client disconnected: ${client.id}`);
  }

  @SubscribeMessage('sendMessage')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; username: string; message: string },
  ) {
    try {
      if (!data.message || data.message.trim().length === 0) {
        client.emit('error', { message: 'Message cannot be empty' });
        return;
      }

      if (data.message.length > 500) {
        client.emit('error', { message: 'Message too long (max 500 characters)' });
        return;
      }

      const chatMessage: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: data.userId,
        username: data.username,
        message: data.message.trim(),
        timestamp: new Date(),
      };

      this.messages.push(chatMessage);

      if (this.messages.length > this.MAX_MESSAGES) {
        this.messages.shift();
      }

      this.server.emit('newMessage', chatMessage);

    } catch (error) {
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('getHistory')
  handleGetHistory(@ConnectedSocket() client: Socket) {
    client.emit('chatHistory', this.messages);
  }
}