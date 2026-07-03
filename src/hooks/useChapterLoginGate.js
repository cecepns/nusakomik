import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  requiresLoginForChapter,
  CHAPTER_LOGIN_LOCK_MESSAGE,
} from '../utils/latestChapter';

export function useChapterLoginGate() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loginPopupOpen, setLoginPopupOpen] = useState(false);
  const [pendingChapterSlug, setPendingChapterSlug] = useState(null);

  const isChapterLocked = (chapter, chapters) =>
    requiresLoginForChapter(chapter, chapters, isAuthenticated);

  const guardChapterClick = (event, chapter, chapters) => {
    if (!requiresLoginForChapter(chapter, chapters, isAuthenticated)) return false;
    event.preventDefault();
    event.stopPropagation();
    setPendingChapterSlug(chapter.slug);
    setLoginPopupOpen(true);
    return true;
  };

  const closeLoginPopup = () => {
    setLoginPopupOpen(false);
    setPendingChapterSlug(null);
  };

  const handleLoginSuccess = () => {
    if (pendingChapterSlug) {
      navigate(`/view/${pendingChapterSlug}`);
    }
    setPendingChapterSlug(null);
  };

  return {
    isChapterLocked,
    guardChapterClick,
    loginPopupProps: {
      open: loginPopupOpen,
      onClose: closeLoginPopup,
      onSuccess: handleLoginSuccess,
      message: CHAPTER_LOGIN_LOCK_MESSAGE,
    },
  };
}
