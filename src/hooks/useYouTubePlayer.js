// ============================================================
// src/hooks/useYouTubePlayer.js
// YouTube IFrame API — playlist player
// Player is created once; lecture changes use playVideoAt()
// ============================================================
import { useRef, useEffect, useCallback } from "react";

export function useYouTubePlayer(containerId, playlistId, videoIndex, callbacks) {
  const playerRef   = useRef(null);
  const intervalRef = useRef(null);
  const watchedRef  = useRef(0);
  const cbRef       = useRef(callbacks);
  const readyRef    = useRef(false);
  const pendingIdx  = useRef(videoIndex);

  cbRef.current = callbacks;

  // ── Create player ───────────────────────────────────────────
  function createPlayer() {
    const container = document.getElementById(containerId);
    if (!container || playerRef.current) return;

    container.innerHTML = '<div id="yt-iframe-inner"></div>';

    playerRef.current = new window.YT.Player("yt-iframe-inner", {
      width:  "100%",
      height: "100%",
      playerVars: {
        listType:        "playlist",
        list:            playlistId,
        index:           pendingIdx.current - 1,   // 0-based
        rel:             0,
        modestbranding:  1,
        iv_load_policy:  3,
        playsinline:     1,
      },
      events: {
        onReady: () => {
          readyRef.current = true;
          // Navigate to correct index if it changed before ready
          if (pendingIdx.current > 1) {
            try { playerRef.current.playVideoAt(pendingIdx.current - 1); } catch {}
          }
        },
        onStateChange: event => {
          if (event.data === 1) {   // PLAYING
            clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
              try {
                const cur = event.target.getCurrentTime();
                const tot = event.target.getDuration();
                if (tot > 0) {
                  watchedRef.current += 1;
                  const posPct     = Math.round((cur / tot) * 100);
                  const watchedPct = Math.round((watchedRef.current / tot) * 100);
                  const effective  = Math.min(posPct, watchedPct, 100);
                  cbRef.current?.onProgress?.(effective);
                }
              } catch {}
            }, 1000);
          } else {
            clearInterval(intervalRef.current);
            if (event.data === 0) cbRef.current?.onEnded?.();   // ENDED
          }
        },
      },
    });

    // Expose player globally for getCurrentTime hack in CourseView
    window._ytplayer = playerRef.current;
  }

  // ── Load API once ────────────────────────────────────────────
  useEffect(() => {
    if (window.YT?.Player) {
      setTimeout(createPlayer, 100);
    } else {
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src   = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        createPlayer();
      };
    }

    return () => {
      clearInterval(intervalRef.current);
      try { playerRef.current?.destroy(); } catch {}
      playerRef.current = null;
      readyRef.current  = false;
      window._ytplayer  = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigate on lecture change ────────────────────────────────
  useEffect(() => {
    pendingIdx.current  = videoIndex;
    watchedRef.current  = 0;

    if (readyRef.current && playerRef.current) {
      try {
        playerRef.current.playVideoAt(videoIndex - 1);  // 0-based
      } catch {}
    }
  }, [videoIndex]);

  const getCurrentTime = useCallback(() => {
    try { return Math.floor(playerRef.current?.getCurrentTime?.() || 0); } catch { return 0; }
  }, []);

  const seekTo = useCallback(sec => {
    try { playerRef.current?.seekTo?.(sec, true); } catch {}
  }, []);

  return { getCurrentTime, seekTo };
}
