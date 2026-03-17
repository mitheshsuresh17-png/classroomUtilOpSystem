import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ScheduleRequest {
  course_id: string;
  batch_id: string;
  room_id: string;
  slot_id: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    if (req.method === "GET" && path === "schedules") {
      const { data, error } = await supabase
        .from("detailed_schedule_view")
        .select("*")
        .order("day", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET" && path === "utilization") {
      const { data, error } = await supabase
        .from("room_utilization_summary")
        .select("*")
        .order("total_allocations", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET" && path === "conflicts") {
      const { data, error } = await supabase
        .from("conflict_detection_view")
        .select("*");

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET" && path === "free-rooms") {
      const { data, error } = await supabase
        .from("free_rooms_view")
        .select("*");

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST" && path === "allocate") {
      const body: ScheduleRequest = await req.json();

      const { data, error } = await supabase.rpc("allocate_room_with_conflict_check", {
        p_course_id: body.course_id,
        p_batch_id: body.batch_id,
        p_room_id: body.room_id,
        p_slot_id: body.slot_id,
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ data, message: "Room allocated successfully" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "DELETE" && path === "schedule") {
      const { schedule_id } = await req.json();

      const { error } = await supabase
        .from("course_schedule")
        .delete()
        .eq("schedule_id", schedule_id);

      if (error) throw error;

      return new Response(JSON.stringify({ message: "Schedule deleted successfully" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "GET" && path === "time-slot-usage") {
      const { data, error } = await supabase
        .from("time_slot_usage_view")
        .select("*")
        .order("times_used", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Route not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
