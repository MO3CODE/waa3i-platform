// ============================================================
// src/hooks/useYouTubePlayer.js
// Manages YouTube IFrame API player lifecycle
// ============================================================
import { useRef, useEffect, useCallback } from "react";

/**
 * Injects the YouTube IFrame API script (once per page),
 * creates a player inside a given container div,
 * and exposes getCurrentTime / seekTo / destroy.
 *
 * @param {string}   containerId  - id of the <div> to inject the iframe into
 * @param {string}   playlistId   - YouTube playlist ID
 * @param {number}   videoIndex   - 1-based index within the playlist
 * @param {object}   callbacks    - { onProgress(pct), onEnded() }
 */
export function useYouTubePlayer(containerId, playlistId, videoIndex, callbacks) {
  const playerRef  = useRef(null);
  const intervalRef= useRef(null);
  const watchedRef = useRef(0);
  const cbRef      = useRef(callbacks);
  cbRef.current    = callbacks;   // always up-to-date without re-running effect

  const buildIframe = useCallback(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear previous
    clearInterval(intervalRef.current);
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch {}
      playerRef.current = null;
    }
    container.innerHTML = "";

    // Create a fresh iframe element
    const iframe        = document.createElement("iframe");
    iframe.id           = "yt-iframe-" + containerId;
    iframe.src          = [
      `https://www.youtube.com/embed/videoseries`,
      `?list=${playlistId}`,
      `&index=${videoIndex}`,
      `&rel=0&modestbranding=1&iv_load_policy=3`,
      `&enablejsapi=1`,
      `&origin=${encodeURIComponent(window.location.origin)}`,
      `&playsinline=1`,
    ].join("");
    iframe.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;border:none;";
    iframe.allow         = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    container.appendChild(iframe);

    // Bind YT.Player to the iframe
    try {
      playerRef.current = new window.YT.Player(iframe.id, {
        events: {
          onStateChange: event => {
            if (event.data === 1) {          // PLAYING
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
              if (event.data === 0) cbRef.current?.onEnded?.();  // ENDED
            }
          },
        },
      });
    } catch {}
  }, [containerId, playlistId, videoIndex]);

  // Load the API script once
  useEffect(() => {
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src   = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevReady?.();
      buildIframe();
    };

    if (window.YT?.Player) {
      setTimeout(buildIframe, 300);
    }

    return () => {
      clearInterval(intervalRef.current);
      try { playerRef.current?.destroy(); } catch {}
    };
  }, []);  // eslint-disable-line

  // Rebuild when lecture changes
  useEffect(() => {
    watchedRef.current = 0;
    if (window.YT?.Player) setTimeout(buildIframe, 300);
  }, [playlistId, videoIndex, buildIframe]);

  const getCurrentTime = useCallback(() => {
    try { return Math.floor(playerRef.current?.getCurrentTime?.() || 0); } catch { return 0; }
  }, []);

  const seekTo = useCallback(sec => {
    try { playerRef.current?.seekTo?.(sec, true); } catch {}
  }, []);

  return { getCurrentTime, seekTo };
}
