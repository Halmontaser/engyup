import { SupabaseClient } from '@supabase/supabase-js';

export class WebhookService {
  static async notifyPartner(
    supabaseAdmin: SupabaseClient,
    partnerId: string,
    event: {
      type: 'activity_completed' | 'lesson_completed' | 'quiz_scored';
      externalUserId: string;
      data: Record<string, any>;
    }
  ) {
    const { data: partner } = await supabaseAdmin
      .from('partner_apps')
      .select('webhook_url, api_secret')
      .eq('id', partnerId)
      .single();

    if (!partner?.webhook_url) return;

    const payload = {
      event: event.type,
      external_user_id: event.externalUserId,
      data: event.data,
      timestamp: new Date().toISOString()
    };

    try {
      await fetch(partner.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': partner.api_secret  // Partner verifies this
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error(`Webhook delivery failed for partner ${partnerId}:`, err);
    }
  }

  /**
   * Dispatch a webhook directly with pre-fetched URL and secret.
   * Use this when the caller already has the partner's webhook_url and api_secret.
   */
  static async dispatch(
    webhookUrl: string,
    apiSecret: string,
    payload: {
      event: string;
      external_user_id: string;
      data: Record<string, any>;
      timestamp: string;
    }
  ) {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': apiSecret
      },
      body: JSON.stringify(payload)
    });
  }
}
