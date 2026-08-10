import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const expectedToken = process.env.KEEP_ALIVE_TOKEN;

  if (!token || !expectedToken || token !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("branches")
    .select("*", { count: "exact", head: true });

  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    db: error ? "unreachable" : "reachable",
  });
}
