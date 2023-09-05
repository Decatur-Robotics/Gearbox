import { Socket } from "net"
import { NextRequest, NextResponse } from "next/server"
import { Server as HTTPServer } from "http"
import { Server } from "socket.io"

export interface SocketServer extends HTTPServer {
    io?: Server | undefined;
}

export interface SocketIO extends Socket {
    server: SocketServer;
}

export interface NextResponseWithSocketIO extends NextResponse {
    socket: SocketIO;
}

const SocketHandler = (req: NextRequest, res: NextResponseWithSocketIO) => {
  if (!res.socket.server.io) {
    console.log('Socket is initializing')
    const io = new Server(res.socket.server, {path:'/api/socketio',  addTrailingSlash: false});
    res.socket.server.io = io
  }
  //@ts-ignore
  res.end();
}

export default SocketHandler