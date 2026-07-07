import { markGoodbye } from "@/lib/heartbeat-state";

export async function POST() {
  markGoodbye();
  return new Response(null, { status: 204 });
}
