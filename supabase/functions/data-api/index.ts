import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
    const pathParts = url.pathname.split("/");
    const entity = pathParts[pathParts.length - 1];

    if (req.method === "GET") {
      if (entity === "departments") {
        const { data, error } = await supabase.from("department").select("*").order("dept_name");
        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (entity === "courses") {
        const { data, error } = await supabase
          .from("course")
          .select("*, department(dept_name)")
          .order("course_code");
        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (entity === "batches") {
        const { data, error } = await supabase
          .from("batch")
          .select("*, department(dept_name)")
          .order("year_of_study");
        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (entity === "rooms") {
        const { data, error } = await supabase.from("room").select("*").order("room_number");
        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (entity === "time-slots") {
        const { data, error } = await supabase
          .from("time_slot")
          .select("*")
          .order("day")
          .order("start_time");
        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (req.method === "POST") {
      const body = await req.json();

      if (entity === "departments") {
        const { data, error } = await supabase
          .from("department")
          .insert({ dept_name: body.dept_name })
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (entity === "courses") {
        const { data, error } = await supabase
          .from("course")
          .insert({
            course_name: body.course_name,
            course_code: body.course_code,
            dept_id: body.dept_id,
          })
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (entity === "batches") {
        const { data, error } = await supabase
          .from("batch")
          .insert({
            year_of_study: body.year_of_study,
            section: body.section,
            student_count: body.student_count,
            dept_id: body.dept_id,
          })
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (entity === "rooms") {
        const { data, error } = await supabase
          .from("room")
          .insert({
            room_number: body.room_number,
            room_type: body.room_type,
            capacity: body.capacity,
          })
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (entity === "time-slots") {
        const { data, error } = await supabase
          .from("time_slot")
          .insert({
            day: body.day,
            start_time: body.start_time,
            end_time: body.end_time,
          })
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
