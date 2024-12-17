import { Socket } from "net";
import { NextRequest, NextResponse } from "next/server";
import { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import ClientApi from "@/lib/api/ClientApi";

const api = new ClientApi();

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
		console.log("Socket is initializing");
		const io = new Server(res.socket.server, {
			path: "/api/socketio",
			addTrailingSlash: false,
		});
		res.socket.server.io = io;

		io.on("connect", (socket) => {
			socket.on("form-update", (data) => {
				socket.broadcast.emit("form-update", data);
			});

			socket.on("form-submit", (_id) => {
				socket.broadcast.emit("form-submit", _id);
			});

			socket.on("update-checkin", (reportId) => {
				console.log("Checkin");
				socket.broadcast.emit("update-checkin", reportId);
			});

			socket.on("update-checkout", (reportId) => {
				socket.broadcast.emit("update-checkout", reportId);
				console.log("Checkout");
			});
		});
	}
	//@ts-ignore
	res.end();
};

export default SocketHandler;
