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

    // Build a styled iframe manually so it fills the container
    const iframeId = "yt-player-iframe";
    container.innerHTML = "";

    const iframe           = document.createElement("iframe");
    iframe.id              = iframeId;
    iframe.style.cssText   = "position:absolute;top:0;left:0;width:100%;height:100%;border:none;";
    iframe.allow           = "autoplay; encrypted-media; fullscreen";
    iframe.allowFullscreen = true;
    iframe.src = [
      "https://www.youtube.com/embed/videoseries",
      `?list=${playlistId}`,
      "&index=0",
      "&enablejsapi=1",
      `&origin=${encodeURIComponent(window.location.origin)}`,
      "&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1",
    ].join("");
    container.appendChild(iframe);

    // Bind YT.Player to the existing iframe
    playerRef.current = new window.YT.Player(iframeId, {
      events: {
        onReady: e => {
          readyRef.current = true;
          // Navigate to the correct lecture
          if (pendingIdx.current > 1) {
            try { e.target.playVideoAt(pendingIdx.current - 1); } catch {}
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
                  const posPct    = Math.round((cur / tot) * 100);
                  const watchPct  = Math.round((watchedRef.current / tot) * 100);
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

  // Load YouTube API script once
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigate to correct lecture when videoIndex changes
  useEffect(() => {
    pendingIdx.current = videoIndex;
    watchedRef.current = 0;

    if (!readyRef.current || !playerRef.current) return;
    try { playerRef.current.playVideoAt(videoIndex - 1); } catch {}
  }, [videoIndex]);

  const getCurrentTime = useCallback(() => {
    try { return Math.floor(playerRef.current?.getCurrentTime?.() || 0); } catch { return 0; }
  }, []);

  const seekTo = useCallback(sec => {
    try { playerRef.current?.seekTo?.(sec, true); } catch {}
  }, []);

  return { getCurrentTime, seekTo };
}
