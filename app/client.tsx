"use client";

import { useEffect, useRef } from "react";

const CAPTURE_INTERVAL_MS = 10_000;
const JPEG_QUALITY = 0.7;
const MAX_DIMENSION = 1280;

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* ignore */
  }
}

function setAnswer(answer: string, latestRef: React.MutableRefObject<string>) {
  const value = (answer || "?").trim().slice(0, 1).toUpperCase() || "?";
  latestRef.current = value;
  document.title = value;
  void copyToClipboard(value);
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function captureFrame(video: HTMLVideoElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return resolve(null);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return resolve(null);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY);
  });
}

export default function Client() {
  const latestRef = useRef<string>("?");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let video: HTMLVideoElement | null = null;
    let intervalId: number | null = null;
    let cancelled = false;
    let inFlight = false;

    const stop = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        stream = null;
      }
      if (video) {
        video.srcObject = null;
        video = null;
      }
    };

    const sendImage = async (b64: string) => {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: b64 }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.answer) setAnswer(data.answer, latestRef);
      } catch {
        /* ignore */
      }
    };

    const tick = async () => {
      if (cancelled || inFlight || !video) return;
      inFlight = true;
      try {
        const blob = await captureFrame(video);
        if (!blob) return;
        const b64 = await blobToBase64(blob);
        await sendImage(b64);
      } finally {
        inFlight = false;
      }
    };

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
      } catch {
        return;
      }
      if (cancelled || !stream) return;

      video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;

      await new Promise<void>((resolve) => {
        video!.addEventListener("loadedmetadata", () => resolve(), { once: true });
        video!.play().catch(() => resolve());
      });

      // Wait for a decoded frame so videoWidth/videoHeight are non-zero
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

      stream.getVideoTracks()[0]?.addEventListener("ended", stop);

      intervalId = window.setInterval(tick, CAPTURE_INTERVAL_MS);
      void tick();
    };

    void start();

    const onPaste = async (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text") ?? "";
      if (!text.trim()) return;
      e.preventDefault();
      try {
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.answer) setAnswer(data.answer, latestRef);
      } catch {
        /* ignore */
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === "c" || e.key === "C")) {
        void copyToClipboard(latestRef.current);
      }
    };

    window.addEventListener("paste", onPaste);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      cancelled = true;
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("keydown", onKeyDown);
      stop();
    };
  }, []);

  return (
    <div
      tabIndex={0}
      autoFocus
      style={{
        position: "fixed",
        inset: 0,
        background: "#ffffff",
        outline: "none",
      }}
    />
  );
}
