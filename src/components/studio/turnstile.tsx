"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (element: HTMLElement, options: {
    sitekey: string;
    theme: "light";
    size: "flexible";
    appearance: "interaction-only";
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
  }) => string;
  remove: (id: string) => void;
};

export function Turnstile({ siteKey, onToken }: { siteKey: string; onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const widget = (window as Window & { turnstile?: TurnstileApi }).turnstile;
    if (!ready || !container.current || !widget) return;
    const id = widget.render(container.current, {
      sitekey: siteKey,
      theme: "light",
      size: "flexible",
      appearance: "interaction-only",
      callback: (token) => {
        setFailed(false);
        onToken(token);
      },
      "expired-callback": () => onToken(""),
      "error-callback": () => {
        onToken("");
        setFailed(true);
      },
    });
    return () => widget.remove(id);
  }, [ready, onToken, siteKey]);

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={() => setReady(true)} onError={() => setFailed(true)} />
      <div ref={container} />
      {failed && <p role="alert" className="text-sm text-destructive">Verification couldn’t load. Refresh the page to try again.</p>}
    </>
  );
}
