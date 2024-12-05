import { useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export async function ClientSocket() {
	await fetch("/api/socket");
	return io({ path: "/api/socketio" });
}
