"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui";

export interface VideoPlayerHandle {
  seekTo: (sec: number) => void;
}

type Provider = "youtube" | "mp4" | "drive" | "unknown";

function detect(url: string): { provider: Provider; embed: string; id?: string } {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) {
    const id = yt[1];
    return { provider: "youtube", id, embed: `https://www.youtube.com/embed/${id}?enablejsapi=1&rel=0` };
  }
  if (/\.mp4($|\?)/i.test(url)) return { provider: "mp4", embed: url };
  const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (drive) return { provider: "drive", id: drive[1], embed: `https://drive.google.com/file/d/${drive[1]}/preview` };
  return { provider: "unknown", embed: url };
}

// Design Ref: D-3 — 강의 영상 재생 + 특정 지점 이동(seek).
// YouTube: postMessage seekTo (enablejsapi). mp4: native currentTime. Drive: preview(재생만).
export const VideoPlayer = forwardRef<VideoPlayerHandle, { url: string }>(function VideoPlayer({ url }, ref) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { provider, embed } = detect(url);

  useImperativeHandle(ref, () => ({
    seekTo(sec: number) {
      if (provider === "youtube" && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "seekTo", args: [sec, true] }),
          "*",
        );
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "playVideo", args: [] }),
          "*",
        );
      } else if (provider === "mp4" && videoRef.current) {
        videoRef.current.currentTime = sec;
        void videoRef.current.play();
      }
      // drive/unknown: seek 불가 — 무시
    },
  }));

  return (
    <div className="relative aspect-video overflow-hidden rounded-[15px] bg-dark">
      <div className="absolute right-3 top-3 z-10">
        <Badge tone="neutral" className="bg-surface/90">
          <Lock size={12} className="text-muted" /> 읽기 전용
        </Badge>
      </div>
      {provider === "mp4" ? (
        <video ref={videoRef} src={embed} controls className="h-full w-full" />
      ) : (
        <iframe
          ref={iframeRef}
          src={embed}
          className="h-full w-full"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="강의 영상"
        />
      )}
    </div>
  );
});
