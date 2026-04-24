function matchesHint(hint, request) {
  if (hint.task_type !== request.task_type) {
    return false;
  }

  if (hint.actor_id && hint.actor_id !== request.actor_id) {
    return false;
  }

  if (request.app_id && hint.app_id && hint.app_id !== request.app_id) {
    return false;
  }

  if (request.domain_tag && hint.domain_tags && !hint.domain_tags.includes(request.domain_tag)) {
    return false;
  }

  if (hint.active === false) {
    return false;
  }

  return true;
}

export function resolveActiveHints({ request, hintStore }) {
  const matched = (hintStore?.hints ?? []).filter((hint) => matchesHint(hint, request));

  const sorted = matched.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  const activeStuRefs = [...new Set(sorted.flatMap((hint) => hint.active_stu_refs ?? []))];
  const routeFlags = [...new Set(sorted.flatMap((hint) => hint.route_flags ?? []))];

  return {
    hints: sorted.map((hint) => ({
      hint_id: hint.hint_id,
      priority: hint.priority ?? 0,
      content: hint.content,
      expires_at: hint.expires_at ?? null
    })),
    active_stu_refs: activeStuRefs,
    route_flags: routeFlags
  };
}
