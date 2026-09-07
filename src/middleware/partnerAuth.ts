import { SupabaseClient } from '@supabase/supabase-js';

export interface PartnerApp {
  id: string;
  name: string;
  slug: string;
  allowed_origins: string[] | null;
  allowed_courses: string[] | null;
  is_active: boolean;
  rate_limit_per_hour: number;
  webhook_url: string | null;
  api_secret: string;
}

export const authenticatePartner = (supabaseAdmin: SupabaseClient) => {
  return async (req: any, res: any, next: any) => {
    // Extract API key from header
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      return res.status(401).json({ error: 'Missing X-API-Key header' });
    }

    // Look up partner app
    const { data: partner, error } = await supabaseAdmin
      .from('partner_apps')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !partner) {
      return res.status(401).json({ error: 'Invalid or inactive API key' });
    }

    // Check rate limit
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count, error: countError } = await supabaseAdmin
      .from('partner_api_logs')
      .select('*', { count: 'exact', head: true })
      .eq('partner_app_id', partner.id)
      .gte('created_at', oneHourAgo);

    if (!countError && (count || 0) >= partner.rate_limit_per_hour) {
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }

    // Attach partner to request
    req.partner = partner;
    next();
  };
};
