import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AdminLoginRequest {
  email: string;
  password: string;
  userType: 'admin';
}

interface StaffLoginRequest {
  username: string;
  password: string;
  userType: 'staff';
}

type LoginRequest = AdminLoginRequest | StaffLoginRequest;

interface SetPasswordRequest {
  technicianId: string;
  password: string;
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
    const path = url.pathname.split('/').pop();

    if (path === 'login' && req.method === 'POST') {
      const body: LoginRequest = await req.json();

      if (!body.password || !body.userType) {
        return new Response(
          JSON.stringify({ error: 'Password and userType are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (body.userType === 'admin') {
        const { email, password } = body as AdminLoginRequest;
        
        if (!email) {
          return new Response(
            JSON.stringify({ error: 'Email is required for admin login' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabase.rpc('verify_admin_password', {
          p_email: email,
          p_password: password
        });

        if (error || !data || data.length === 0) {
          return new Response(
            JSON.stringify({ error: 'Invalid email or password' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabase
          .from('admin_users')
          .update({ last_login: new Date().toISOString() })
          .eq('email', email);

        return new Response(
          JSON.stringify({ 
            success: true, 
            user: { 
              id: data[0].id, 
              email: data[0].email, 
              name: data[0].name,
              type: 'admin' 
            } 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        const { username, password } = body as StaffLoginRequest;
        
        if (!username) {
          return new Response(
            JSON.stringify({ error: 'Username is required for staff login' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data, error } = await supabase.rpc('verify_staff_password', {
          p_username: username,
          p_password: password
        });

        if (error || !data || data.length === 0) {
          return new Response(
            JSON.stringify({ error: 'Invalid username or password' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            user: { 
              id: data[0].id, 
              email: data[0].email, 
              name: data[0].name,
              specialty: data[0].specialty,
              avatar_color: data[0].avatar_color,
              type: 'staff' 
            } 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (path === 'set-password' && req.method === 'POST') {
      const { technicianId, password }: SetPasswordRequest = await req.json();

      if (!technicianId || !password) {
        return new Response(
          JSON.stringify({ error: 'Technician ID and password are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (password.length < 8) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 8 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase.rpc('set_technician_password', {
        p_technician_id: technicianId,
        p_password: password
      });

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to set password' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
