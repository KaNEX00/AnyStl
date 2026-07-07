import { getHeartbeatState, markHeartbeat } from "@/lib/heartbeat-state";

export async function POST() {
  markHeartbeat();
  return new Response(null, { status: 204 });
}

export async function GET() {
  const state = getHeartbeatState();
  return Response.json({
    ageMs: Date.now() - state.lastHeartbeat,
    goodbye: state.goodbye,
  });
}
