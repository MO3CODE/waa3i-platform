// ============================================================
// src/hooks/useYouTubePlayer.js
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

  function createPlayer() {
    const container = document.getElementById(containerId);
    if (!container || playerRef.current) return;
    container.innerHTML = "";

    playerRef.current = new window.YT.Player(containerId, {
      playerVars: {
        list:           playlistId,
        listType:       "playlist",
        // No index — let YouTube start from first embeddable video
        enablejsapi:    1,
        origin:         window.location.origin,
        rel:            0,
        modestbranding: 1,
        iv_load_policy: 3,
        playsinline:    1,
      },
      events: {
        onReady: () => {
          readyRef.current = true;
          // Fix iframe CSS
          try {
            const f = playerRef.current.getIframe();
            if (f) f.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;border:none;";
          } catch {}
          // Navigate to requested lecture
          const idx = (pendingIdx.current || 1) - 1;
          if (idx > 0) {
            try { playerRef.current.playVideoAt(idx); } catch {}
          }
        },
        onStateChange: event => {
          if (event.data === 1) {       // PLAYING
            clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
              try {
                const cur = event.target.getCurrentTime();
                const tot = event.target.getDuration();
                if (tot > 0) {
                  watchedRef.current += 1;
                  const posPct   = Math.round((cur / tot) * 100);
                  const watchPct = Math.round((watchedRef.current / tot) * 100);
                  cbRef.current?.onProgress?.(Math.min(posPct, watchPct, 100));
                }
              } catch {}
            }, 1000);
          } else {
            clearInterval(intervalRef.current);
            if (event.data === 0) cbRef.current?.onEnded?.(); // ENDED
          }
        },
      },
    });
  }

  // Build player once
  useEffect(() => {
    if (!playlistId) return;

    if (window.YT?.Player) {
      createPlayer();
    } else {
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement("script");
        s.src   = "https://www.youtube.com/iframe_api";
        document.head.appendChild(s);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); createPlayer(); };
    }

    return () => {
      clearInterval(intervalRef.current);
      try { playerRef.current?.destroy(); } catch {}
      playerRef.current = null;
      readyRef.current  = false;
    };
  }, [playlistId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigate when lecture changes
  useEffect(() => {
    pendingIdx.current = videoIndex;
    watchedRef.current = 0;
    if (!readyRef.current || !playerRef.current) return;
    try { playerRef.current.playVideoAt((videoIndex || 1) - 1); } catch {}
  }, [videoIndex]);

  const getCurrentTime = useCallback(() => {
    try { return Math.floor(playerRef.current?.getCurrentTime?.() || 0); } catch { return 0; }
  }, []);

  const seekTo = useCallback(sec => {
    try { playerRef.current?.seekTo?.(sec, true); } catch {}
  }, []);

  return { getCurrentTime, seekTo };
}
