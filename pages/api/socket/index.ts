import SocketHandler, { NextResponseWithSocketIO } from "@/lib/Socket";
import { NextRequest } from "next/server";

const SocketIO = (req: NextRequest, res: NextResponseWithSocketIO) =>
  SocketHandler(req, res);

export default SocketIO;
