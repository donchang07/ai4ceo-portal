import { requireLmsAccess } from "@/lib/db/auth";
import { ChatRoomView } from "./chat-room-view";

export default async function ChatRoomPage() {
  await requireLmsAccess();
  return <ChatRoomView />;
}
