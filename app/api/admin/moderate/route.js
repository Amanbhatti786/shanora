import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const AUTHORIZED_ADMIN_EMAIL = 'amanullahmahtam7@gmail.com';

function getUserScopedClient(req) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authHeader = req.headers.get('authorization') || '';

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {}
    }
  });
}

export async function POST(req) {
  try {
    const supabase = getUserScopedClient(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: sign in required.' }, { status: 401 });
    }

    const userEmail = String(user.email || '').trim().toLowerCase();
    const { data: isAdmin } = await supabase.rpc('is_shanora_admin');

    if (userEmail !== AUTHORIZED_ADMIN_EMAIL && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: administrator access required.' }, { status: 403 });
    }

    const body = await req.json();
    const { targetType, targetId, action, reason, suspendDays, targetEmail, targetUserId } = body || {};

    if (!targetType || !targetId || !action || !String(reason || '').trim()) {
      return NextResponse.json(
        { error: 'targetType, targetId, action, and a non-empty reason are required.' },
        { status: 400 }
      );
    }

    const cleanReason = String(reason).trim();

    if (targetType === 'post') {
      if (action === 'verify') {
        const { error } = await supabase
          .from('user_posts')
          .update({ is_verified: true, moderation_reason: cleanReason })
          .eq('id', targetId);
        if (error) throw error;
      } else if (action === 'unverify') {
        const { error } = await supabase
          .from('user_posts')
          .update({ is_verified: false, moderation_reason: cleanReason })
          .eq('id', targetId);
        if (error) throw error;
      } else if (action === 'hide') {
        const { error } = await supabase
          .from('user_posts')
          .update({ is_hidden: true, moderation_reason: cleanReason })
          .eq('id', targetId);
        if (error) throw error;
      } else if (action === 'unhide') {
        const { error } = await supabase
          .from('user_posts')
          .update({ is_hidden: false, moderation_reason: cleanReason })
          .eq('id', targetId);
        if (error) throw error;
      } else if (action === 'soft_delete') {
        const { error } = await supabase
          .from('user_posts')
          .update({ is_deleted: true, deleted_at: new Date().toISOString(), moderation_reason: cleanReason })
          .eq('id', targetId);
        if (error) throw error;
      } else if (action === 'restore') {
        const { error } = await supabase
          .from('user_posts')
          .update({ is_deleted: false, deleted_at: null, moderation_reason: cleanReason })
          .eq('id', targetId);
        if (error) throw error;
      } else if (action === 'permanent_delete') {
        const { error } = await supabase
          .from('user_posts')
          .delete()
          .eq('id', targetId);
        if (error) throw error;
      } else if (action === 'warn') {
        const { error } = await supabase.from('moderation_warnings').insert([{
          target_email: targetEmail || 'unknown@shanora.local',
          target_user_id: targetUserId || null,
          target_type: 'post',
          target_id: String(targetId),
          reason: cleanReason,
          issued_by_admin_id: user.id
        }]);
        if (error) throw error;
      }
    } else if (targetType === 'account') {
      if (action === 'verify_account') {
        const { error } = await supabase
          .from('profiles')
          .update({ is_verified: true, moderation_reason: cleanReason })
          .eq('id', targetId);
        if (error) throw error;
      } else if (action === 'unverify_account') {
        const { error } = await supabase
          .from('profiles')
          .update({ is_verified: false, moderation_reason: cleanReason })
          .eq('id', targetId);
        if (error) throw error;
      } else if (action === 'suspend') {
        const days = Math.max(1, Number(suspendDays || 7));
        const untilIso = new Date(Date.now() + days * 86400000).toISOString();
        const { error } = await supabase
          .from('profiles')
          .update({
            account_status: 'suspended',
            suspension_until: untilIso,
            moderation_reason: cleanReason
          })
          .eq('id', targetId);
        if (error) throw error;
      } else if (action === 'ban') {
        const { error } = await supabase
          .from('profiles')
          .update({
            account_status: 'banned',
            suspension_until: null,
            moderation_reason: cleanReason
          })
          .eq('id', targetId);
        if (error) throw error;
      } else if (action === 'reactivate') {
        const { error } = await supabase
          .from('profiles')
          .update({
            account_status: 'active',
            suspension_until: null,
            moderation_reason: cleanReason
          })
          .eq('id', targetId);
        if (error) throw error;
      } else if (action === 'delete_account') {
        const { error } = await supabase
          .from('profiles')
          .update({
            account_status: 'deleted',
            moderation_reason: cleanReason
          })
          .eq('id', targetId);
        if (error) throw error;
      } else if (action === 'warn_account') {
        const { error } = await supabase.from('moderation_warnings').insert([{
          target_email: targetEmail || 'unknown@shanora.local',
          target_user_id: targetId,
          target_type: 'account',
          target_id: String(targetId),
          reason: cleanReason,
          issued_by_admin_id: user.id
        }]);
        if (error) throw error;
      }
    } else if (targetType === 'comment') {
      if (action === 'hide_comment') {
        const { error } = await supabase
          .from('post_comments')
          .update({ is_hidden: true, moderation_reason: cleanReason })
          .eq('id', targetId);
        if (error) throw error;
      } else if (action === 'unhide_comment') {
        const { error } = await supabase
          .from('post_comments')
          .update({ is_hidden: false, moderation_reason: cleanReason })
          .eq('id', targetId);
        if (error) throw error;
      } else if (action === 'delete_comment') {
        const { error } = await supabase
          .from('post_comments')
          .update({ is_deleted: true, deleted_at: new Date().toISOString(), moderation_reason: cleanReason })
          .eq('id', targetId);
        if (error) throw error;
      } else if (action === 'warn_commenter') {
        const { error } = await supabase.from('moderation_warnings').insert([{
          target_email: targetEmail || 'unknown@shanora.local',
          target_user_id: targetUserId || null,
          target_type: 'comment',
          target_id: String(targetId),
          reason: cleanReason,
          issued_by_admin_id: user.id
        }]);
        if (error) throw error;
      }
    } else {
      return NextResponse.json({ error: 'Unsupported targetType.' }, { status: 400 });
    }

    const { error: logError } = await supabase.from('admin_audit_logs').insert([{
      admin_id: user.id,
      target_id: String(targetId),
      target_type: targetType,
      action,
      reason: cleanReason
    }]);
    if (logError) throw logError;

    return NextResponse.json({ ok: true, message: `Action "${action}" recorded with audit log.` });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Moderation action failed.' }, { status: 500 });
  }
}

