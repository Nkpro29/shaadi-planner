import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface OpenIntent {
  compose?: boolean;
  editId?: string;
  eventId?: string;
}

export function useOpenIntent(handlers: {
  onCreate?: (extra: OpenIntent) => void;
  onEdit?: (id: string) => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const state = location.state as OpenIntent | null;
    if (!state?.compose && !state?.editId) return;
    if (state.editId) ref.current.onEdit?.(state.editId);
    else if (state.compose) ref.current.onCreate?.(state);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);
}
