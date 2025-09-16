// useStompChat.ts
import { useEffect, useRef, useState } from "react";
import { Client, type IMessage, StompHeaders } from "@stomp/stompjs";
import SockJS from "sockjs-client/dist/sockjs";
import Cookies from "js-cookie";
import { baseUrl } from "@/utils/AxiosInterceptor";
import type { ChatMessageRes } from "@/services/chat";

const join = (root: string | undefined, path: string) => {
  const r = (root || "").replace(/\/+$/, "");
  if (!r) return path;                         // same-origin
  if (r.toLowerCase().endsWith("/api")) {
    // r=/api  + path=/api/ws  -> /api/ws
    return `${r}${path.replace(/^\/api/, "")}`;
  }
  return `${r}${path}`;                        // http://host:8080 + /api/ws
};

export function useStompChat(
  roomId: string,
  onMessage: (m: ChatMessageRes) => void
) {
  const [connected, setConnected] = useState(false);
  const ref = useRef<Client | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const url = join(baseUrl, "/api/ws");      // ✅ chỉ /api/ws
    const token = Cookies.get("accessToken") || "";
    const headers: StompHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const client = new Client({
      webSocketFactory: () => {
        console.log("[WS] SockJS ->", url);
        return new SockJS(url);
      },
      connectHeaders: headers,
      reconnectDelay: 3000,
      heartbeatIncoming: 15000,
      heartbeatOutgoing: 15000,
      debug: (s) => console.log("[STOMP]", s),
      onConnect: () => {
        console.log("[STOMP] connected");
        setConnected(true);
        const dest = `/topic/rooms/${roomId}`;
        console.log("[STOMP] subscribe", dest);
        client.subscribe(dest, (msg: IMessage) => {
          try {
            onMessage(JSON.parse(msg.body) as ChatMessageRes);
          } catch (e) {
            console.error("parse error", e, msg.body);
          }
        });
      },
      onWebSocketClose: (e) => {
        console.warn("[WS CLOSE]", e);
        setConnected(false);
      },
      onWebSocketError: (e) => {
        console.error("[WS ERROR]", e);
      },
      onStompError: (f) => {
        console.error("[STOMP ERROR]", f.headers["message"], f.body);
      },
      onDisconnect: () => setConnected(false),
    });

    client.activate();
    ref.current = client;
    return () => {
      try { client.deactivate(); } catch {}
      ref.current = null;
    };
  }, [roomId, onMessage]);

  // useStompChat.ts
const sendMessage = (payload: { type: string; content: string; parentId?: number | null }) => {
  ref.current?.publish({
    destination: `/app/rooms/${roomId}/send`,
    body: JSON.stringify(payload),
    headers: { "content-type": "application/json" }, // 👈 bắt buộc cho Spring
  });
};


  return { connected, sendMessage };
}
