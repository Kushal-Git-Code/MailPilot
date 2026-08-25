"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

const CONFETTI_COLORS = ["#FF6B6B", "#D9A056", "#FFD93D", "#7C6BFF", "#4D96FF"];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    const errorParam = searchParams.get("error");
    const errorCode = searchParams.get("error_code");
    if (!errorParam) return null;
    if (errorCode === "otp_expired") {
      return "That confirmation link expired or was already used. Sign up again to get a fresh one.";
    }
    if (errorParam === "auth_callback_failed") {
      return "Something went wrong signing in. Please try again.";
    }
    return "That link is no longer valid. Please try again.";
  });
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Mirrors the original's Take off -> Boarding... -> Welcome aboard label
  // sequence, but only "Welcome aboard" is shown after a genuine success,
  // never faked ahead of the actual auth result.
  const [launchPhase, setLaunchPhase] = useState<"idle" | "boarding" | "aboard">("idle");
  // Distinct from launchPhase: once a signup succeeds, the button must stay
  // visibly "done" (locked, muted) rather than reverting to a bright,
  // clickable "Create account" that looks like nothing happened — the real
  // next step is checking email, not resubmitting this form.
  const [signupComplete, setSignupComplete] = useState(false);
  // Next.js doesn't swap the page until /dashboard's server render finishes
  // (it does live, uncached Gmail API calls per CLAUDE.md's zero-storage
  // rule, so that's never instant) — without this, the button just sits
  // frozen on "Welcome aboard" for however long that takes, reading as
  // stuck rather than working.
  const [navigating, setNavigating] = useState(false);
  const [confetti, setConfetti] = useState<{ id: number; color: string; angle: number; dist: number; delay: number }[]>([]);
  const launchBtnRef = useRef<HTMLButtonElement>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  // Deliberately no card tilt: the card is a stable anchor, only the ambient
  // blobs/icons (--mx/--my + --depth, smoothed by CSS transitions) and the
  // spotlight (lerped below) react to the cursor.
  useEffect(() => {
    let sx = window.innerWidth / 2;
    let sy = window.innerHeight / 2;
    let tx = sx;
    let ty = sy;
    let raf = 0;

    function handleMouseMove(e: MouseEvent) {
      const px = e.clientX / window.innerWidth - 0.5;
      const py = e.clientY / window.innerHeight - 0.5;
      stageRef.current?.style.setProperty("--mx", px.toFixed(3));
      stageRef.current?.style.setProperty("--my", py.toFixed(3));
      tx = e.clientX;
      ty = e.clientY;
    }

    function tick() {
      sx += (tx - sx) * 0.08;
      sy += (ty - sy) * 0.08;
      if (spotlightRef.current) {
        spotlightRef.current.style.left = `${sx}px`;
        spotlightRef.current.style.top = `${sy}px`;
      }
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener("mousemove", handleMouseMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  function burstConfetti() {
    const dots = Array.from({ length: 10 }, (_, i) => ({
      id: Date.now() + i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      angle: Math.random() * Math.PI * 2,
      dist: 40 + Math.random() * 50,
      delay: 250 + Math.random() * 100,
    }));
    setConfetti(dots);
    setTimeout(() => setConfetti([]), 1400);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    setLaunchPhase("boarding");
    const supabase = createClient();

    if (mode === "signIn") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLaunchPhase("idle");
        setLoading(false);
      } else {
        burstConfetti();
        setLaunchPhase("aboard");
        setTimeout(() => setNavigating(true), 900);
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        setLaunchPhase("idle");
      } else {
        burstConfetti();
        setLaunchPhase("aboard");
        setTimeout(() => setSignupComplete(true), 1700);
        setInfo("Check your email to confirm your account before logging in.");
      }
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  const launchLabel = navigating
    ? "Taking you to your inbox..."
    : signupComplete
      ? "Check your email to continue"
      : launchPhase === "boarding"
        ? "Boarding..."
        : launchPhase === "aboard"
          ? "Welcome aboard ✓"
          : mode === "signIn"
            ? "Take off"
            : "Create account";

  return (
    <main ref={stageRef} className="login-stage">
      <div className="scene" aria-hidden="true">
        <div className="blob b1" style={{ "--depth": 0.6 } as React.CSSProperties}>
          <div className="blob-inner" />
        </div>
        <div className="blob b2" style={{ "--depth": 0.9 } as React.CSSProperties}>
          <div className="blob-inner" />
        </div>
        <div className="blob b3" style={{ "--depth": 0.4 } as React.CSSProperties}>
          <div className="blob-inner" />
        </div>
        <div className="blob b4" style={{ "--depth": 0.7 } as React.CSSProperties}>
          <div className="blob-inner" />
        </div>

        <div className="float-layer fl1" style={{ "--depth": 1.1 } as React.CSSProperties}>
          <svg className="float-item" width="30" height="30" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="5" width="20" height="14" rx="3" fill="#FF9AA2" />
            <path d="M3 6.5L12 13L21 6.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="float-layer fl2" style={{ "--depth": 0.8 } as React.CSSProperties}>
          <svg className="float-item" width="20" height="20" viewBox="0 0 24 24" fill="#F0C68C">
            <path d="M12 2l2.6 6.6L21 11l-6.4 2.4L12 20l-2.6-6.6L3 11l6.4-2.4L12 2z" />
          </svg>
        </div>
        <div className="float-layer fl3" style={{ "--depth": 1.3 } as React.CSSProperties}>
          <svg className="float-item" width="26" height="26" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="5" width="20" height="14" rx="3" fill="#8FC1FF" />
            <path d="M3 6.5L12 13L21 6.5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="float-layer fl4" style={{ "--depth": 0.5 } as React.CSSProperties}>
          <svg className="float-item" width="34" height="34" viewBox="0 0 24 24" fill="#C6ABFF" opacity="0.9">
            <path d="M6 17a4 4 0 01-.6-7.96A5.5 5.5 0 0116 8.05 4.5 4.5 0 0117.5 17H6z" />
          </svg>
        </div>
        <div className="float-layer fl5" style={{ "--depth": 1.5 } as React.CSSProperties}>
          <svg className="float-item" width="14" height="14" viewBox="0 0 24 24" fill="#FF6B6B">
            <path d="M12 2l2.6 6.6L21 11l-6.4 2.4L12 20l-2.6-6.6L3 11l6.4-2.4L12 2z" />
          </svg>
        </div>

        <svg className="hero-plane" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="heroPlaneGrad1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FF6B6B" />
              <stop offset="0.5" stopColor="#FFA45C" />
              <stop offset="1" stopColor="#7C6BFF" />
            </linearGradient>
          </defs>
          <path d="M2 12L22 2L14 22L11 13L2 12Z" fill="url(#heroPlaneGrad1)" stroke="#fff" strokeWidth="0.6" strokeLinejoin="round" />
          <circle cx="11" cy="12" r="1.3" fill="#4D96FF" />
        </svg>

        <svg className="hero-plane-2" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient id="heroPlaneGrad2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FFD93D" />
              <stop offset="0.5" stopColor="#FF9AA2" />
              <stop offset="1" stopColor="#4D96FF" />
            </linearGradient>
          </defs>
          <path d="M2 12L22 2L14 22L11 13L2 12Z" fill="url(#heroPlaneGrad2)" stroke="#fff" strokeWidth="0.6" strokeLinejoin="round" />
          <circle cx="11" cy="12" r="1.3" fill="#4D96FF" />
        </svg>

        <svg className="hero-envelope" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="5" width="20" height="14" rx="3" fill="#fff" stroke="#C6ABFF" strokeWidth="0.6" />
          <path d="M3 6.5L12 13L21 6.5" stroke="#7C6BFF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <svg className="hero-envelope-2" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="5" width="20" height="14" rx="3" fill="#fff" stroke="#F0C68C" strokeWidth="0.6" />
          <path d="M3 6.5L12 13L21 6.5" stroke="#D9A056" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="vignette" aria-hidden="true" />
      <div className="grain-overlay" aria-hidden="true" />
      <div ref={spotlightRef} className="spotlight" aria-hidden="true" />

      <svg className="sparkle sp1" width="16" height="16" viewBox="0 0 24 24" fill="#F0C68C" aria-hidden="true">
        <path d="M12 2l1.6 7.4L21 12l-7.4 1.6L12 22l-1.6-7.4L3 12l7.4-1.6L12 2z" />
      </svg>
      <svg className="sparkle sp2" width="12" height="12" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
        <path d="M12 2l1.6 7.4L21 12l-7.4 1.6L12 22l-1.6-7.4L3 12l7.4-1.6L12 2z" />
      </svg>
      <svg className="sparkle sp3" width="14" height="14" viewBox="0 0 24 24" fill="#FF9AA2" aria-hidden="true">
        <path d="M12 2l1.6 7.4L21 12l-7.4 1.6L12 22l-1.6-7.4L3 12l7.4-1.6L12 2z" />
      </svg>
      <svg className="sparkle sp4" width="10" height="10" viewBox="0 0 24 24" fill="#B7A6FF" aria-hidden="true">
        <path d="M12 2l1.6 7.4L21 12l-7.4 1.6L12 22l-1.6-7.4L3 12l7.4-1.6L12 2z" />
      </svg>

      <div className="stage">
        <div ref={cardRef} className="card">
          <div className="card-shimmer" aria-hidden="true" />

          <div className="brand reveal" style={{ animationDelay: "0.1s" }}>
            <div className="brand-badge">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M2 12L22 2L14 22L11 13L2 12Z" fill="#fff" />
              </svg>
            </div>
            <span className="brand-name">MailPilot</span>
          </div>

          <p className="eyebrow reveal" style={{ animationDelay: "0.14s" }}>
            AI-Powered Inbox Pilot
          </p>

          <h1 className="headline reveal" style={{ animationDelay: "0.26s" }}>
            {mode === "signIn" ? (
              <>
                Ready for{" "}
                <span className="accent">
                  takeoff?
                  <svg className="accent-underline" viewBox="0 0 140 14" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 9C24 3 55 3 78 7.5C101 12 122 6 138 3" stroke="#FF3B3B" strokeWidth="3" strokeLinecap="round" fill="none" />
                  </svg>
                </span>
              </>
            ) : (
              <>
                Join the{" "}
                <span className="accent">
                  crew.
                  <svg className="accent-underline" viewBox="0 0 140 14" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 9C24 3 55 3 78 7.5C101 12 122 6 138 3" stroke="#FF3B3B" strokeWidth="3" strokeLinecap="round" fill="none" />
                  </svg>
                </span>
              </>
            )}
            <svg className="headline-plane" viewBox="0 0 60 24" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="planeBodyGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#FF6B6B" />
                  <stop offset="0.45" stopColor="#FFA45C" />
                  <stop offset="0.75" stopColor="#FFD93D" />
                  <stop offset="1" stopColor="#7C6BFF" />
                </linearGradient>
                <linearGradient id="planeWingGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#7C6BFF" />
                  <stop offset="1" stopColor="#FF9AA2" />
                </linearGradient>
                <linearGradient id="flameOuterGrad" x1="1" y1="0.5" x2="0" y2="0.5">
                  <stop offset="0" stopColor="#FF6B6B" />
                  <stop offset="0.6" stopColor="#FFA45C" />
                  <stop offset="1" stopColor="#FFD93D" />
                </linearGradient>
                <linearGradient id="flameInnerGrad" x1="1" y1="0.5" x2="0" y2="0.5">
                  <stop offset="0" stopColor="#FFA45C" />
                  <stop offset="1" stopColor="#FFF6D8" />
                </linearGradient>
              </defs>
              <g transform="translate(0,4)">
                <path className="flame-outer" d="M22 8C13 4 4 6 0 10C7 12.5 15 11.5 22 8Z" fill="url(#flameOuterGrad)" opacity="0.9" />
                <path className="flame-inner" d="M22 8C15 5 8 6.5 3 9C9 11 15 10.5 22 8Z" fill="url(#flameInnerGrad)" opacity="0.95" />
                <circle className="ember e1" cx="5" cy="6" r="1.3" fill="#FFD93D" />
                <circle className="ember e2" cx="1" cy="11" r="1" fill="#FF9AA2" />
                <circle className="ember e3" cx="4" cy="3" r="0.8" fill="#FFA45C" />
              </g>
              <g transform="translate(26,0) rotate(90,12,12)">
                <path
                  d="M21 16v-2l-8-5V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2.5 1.5V22l4-1 4 1v-1.5L13 19v-5.5l8 2.5z"
                  fill="url(#planeBodyGrad)"
                  stroke="#fff"
                  strokeWidth="0.5"
                />
                <path d="M2 12L11 13L13 19L10 20.5V19L2 12Z" fill="url(#planeWingGrad)" opacity="0.85" />
                <circle className="nav-light" cx="11.5" cy="11.5" r="1.6" fill="#FF3B3B" />
              </g>
            </svg>
          </h1>
          <p className="subtext reveal" style={{ animationDelay: "0.34s" }}>
            {mode === "signIn" ? (
              <>
                Sign in and let your inbox fly on autopilot — <span className="accent-word">sorted, summarized, and stress-free</span>.
              </>
            ) : (
              "Create your account and let MailPilot start triaging from day one."
            )}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="field reveal" style={{ animationDelay: "0.4s" }}>
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="#1B2A4A" strokeWidth="1.6">
                <rect x="3" y="5" width="18" height="14" rx="2.5" />
                <path d="M4 6.5l8 6 8-6" />
              </svg>
              <input id="email" type="email" placeholder=" " required value={email} onChange={(e) => setEmail(e.target.value)} />
              <label htmlFor="email">Email address</label>
            </div>

            <div className="field reveal" style={{ animationDelay: "0.46s" }}>
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="#1B2A4A" strokeWidth="1.6">
                <rect x="4" y="10" width="16" height="10" rx="2.5" />
                <path d="M8 10V7a4 4 0 018 0v3" />
              </svg>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder=" "
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label htmlFor="password">Password</label>
              <button
                type="button"
                className="toggle-eye"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#1B2A4A" strokeWidth="1.6">
                    <path d="M3 3l18 18M10.6 10.6a3 3 0 004.2 4.2M9.9 5.1A11 11 0 0123 12s-1.7 3-4.8 5.1M6.1 6.1C3.7 7.6 2 9.9 1 12c0 0 4 7 11 7 1.6 0 3-.3 4.2-.9" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#1B2A4A" strokeWidth="1.6">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {mode === "signIn" && (
              <div className="row-between reveal" style={{ animationDelay: "0.5s" }}>
                <label className="remember">
                  <input type="checkbox" defaultChecked />
                  Remember me
                </label>
                {/* Not wired up yet — MailPilot has no password-reset flow
                    built, so this stays visual-only rather than a dead link
                    (an explicit decision when this page was built). */}
                <span className="forgot-inert">Forgot password?</span>
              </div>
            )}

            {error && <p className="message error">{error}</p>}
            {info && <p className="message info">{info}</p>}

            <button
              ref={launchBtnRef}
              type="submit"
              className={`launch-btn reveal ${launchPhase !== "idle" ? "is-launching" : ""} ${signupComplete ? "is-locked" : ""}`}
              style={{ animationDelay: "0.56s" }}
              disabled={loading || signupComplete || navigating}
            >
              <span className="btn-label">{launchLabel}</span>
              {navigating ? (
                <svg className="btn-plane btn-spinner" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                </svg>
              ) : signupComplete ? (
                <svg className="btn-plane" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                <svg className="btn-plane" viewBox="0 0 24 24" fill="#fff">
                  <path d="M2 12L22 2L14 22L11 13L2 12Z" />
                </svg>
              )}
              {confetti.map((dot) => (
                <span
                  key={dot.id}
                  className="confetti-dot"
                  style={
                    {
                      background: dot.color,
                      "--dx": `${Math.cos(dot.angle) * dot.dist}px`,
                      "--dy": `${Math.sin(dot.angle) * dot.dist}px`,
                      "--delay": `${dot.delay}ms`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </button>
          </form>

          <div className="divider reveal" style={{ animationDelay: "0.62s" }}>
            or continue with
          </div>

          <div className="social-row reveal" style={{ animationDelay: "0.68s" }}>
            <button type="button" className="social-btn" onClick={handleGoogleSignIn}>
              <svg viewBox="0 0 48 48" width="16" height="16">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.8l5.7-5.7C33.7 6.6 29.1 5 24 5 13 5 4 14 4 25s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.5z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c2.8 0 5.3 1 7.3 2.8l5.7-5.7C33.7 6.6 29.1 5 24 5c-7.6 0-14.2 4.3-17.7 10.7z" />
                <path fill="#4CAF50" d="M24 45c5.1 0 9.7-1.9 13.2-5l-6.1-5.2C29.2 36.4 26.7 37 24 37c-5.2 0-9.6-3.5-11.2-8.3l-6.5 5C9.7 40.6 16.3 45 24 45z" />
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.1 5.2C40.5 36.5 44 31.2 44 25c0-1.3-.1-2.6-.4-4.5z" />
              </svg>
              Google
            </button>
          </div>

          <p className="footer-line reveal" style={{ animationDelay: "0.74s" }}>
            {mode === "signIn" ? "New to MailPilot? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signIn" ? "signUp" : "signIn");
                setError(null);
                setInfo(null);
                setSignupComplete(false);
              }}
            >
              {mode === "signIn" ? "Create an account" : "Log in"}
            </button>
          </p>
        </div>
      </div>

      <style jsx>{`
        @property --rise {
          syntax: "<length>";
          inherits: false;
          initial-value: 14px;
        }

        .login-stage {
          --mx: 0;
          --my: 0;
          position: relative;
          min-height: 100vh;
          overflow-x: hidden;
          font-family: var(--font-jakarta), sans-serif;
          color: #1b2a4a;
          background: linear-gradient(135deg, #fff1c9 0%, #ffd3b0 26%, #ffaaae 50%, #c6abff 76%, #86bbff 100%);
          background-size: 300% 300%;
          animation: bgshift 24s ease-in-out infinite;
        }
        @keyframes bgshift {
          0% { background-position: 0% 30%; }
          50% { background-position: 100% 70%; }
          100% { background-position: 0% 30%; }
        }

        .scene { position: fixed; inset: 0; overflow: hidden; z-index: 0; pointer-events: none; }
        .vignette {
          position: fixed; inset: 0; z-index: 1; pointer-events: none;
          background: radial-gradient(ellipse at 50% 42%, transparent 38%, rgba(18, 14, 42, 0.2) 100%);
        }
        .grain-overlay {
          position: fixed; inset: 0; z-index: 1; pointer-events: none; opacity: 0.035; mix-blend-mode: overlay;
          background-image: ${GRAIN_URL};
        }

        .blob {
          position: absolute; border-radius: 50%; filter: blur(55px); opacity: 0.5;
          transform: translate(calc(var(--mx) * var(--depth) * 26px), calc(var(--my) * var(--depth) * 26px));
          transition: transform 0.25s ease-out;
        }
        .blob-inner { width: 100%; height: 100%; border-radius: 50%; animation: drift 15s ease-in-out infinite; }
        .blob.b1 { width: 460px; height: 460px; top: -120px; left: -100px; }
        .blob.b1 .blob-inner { background: radial-gradient(circle at 35% 35%, #7c6bff, transparent 70%); animation-duration: 16s; }
        .blob.b2 { width: 520px; height: 520px; bottom: -160px; right: -140px; }
        .blob.b2 .blob-inner { background: radial-gradient(circle at 60% 40%, #4d96ff, transparent 70%); animation-duration: 19s; animation-delay: -4s; }
        .blob.b3 { width: 360px; height: 360px; top: 20%; right: 8%; }
        .blob.b3 .blob-inner { background: radial-gradient(circle at 50% 50%, #f0c68c, transparent 70%); animation-duration: 13s; animation-delay: -2s; }
        .blob.b4 { width: 320px; height: 320px; bottom: 12%; left: 6%; }
        .blob.b4 .blob-inner { background: radial-gradient(circle at 50% 50%, #ff6b6b, transparent 70%); animation-duration: 17s; animation-delay: -7s; }
        @keyframes drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(24px, -30px) scale(1.08); }
        }

        .float-layer {
          position: absolute;
          transform: translate(calc(var(--mx) * var(--depth) * 46px), calc(var(--my) * var(--depth) * 46px));
          transition: transform 0.2s ease-out;
        }
        .float-item { display: block; animation: bob 6s ease-in-out infinite; filter: drop-shadow(0 10px 18px rgba(27, 42, 74, 0.16)); }
        @keyframes bob {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-18px) rotate(6deg); }
        }
        .fl1 { top: 14%; left: 10%; }
        .fl1 .float-item { animation-duration: 7s; }
        .fl2 { top: 64%; left: 16%; }
        .fl2 .float-item { animation-duration: 5.5s; animation-delay: -1.4s; }
        .fl3 { top: 22%; right: 12%; }
        .fl3 .float-item { animation-duration: 6.5s; animation-delay: -2.6s; }
        .fl4 { bottom: 16%; right: 9%; }
        .fl4 .float-item { animation-duration: 8s; animation-delay: -3.2s; }
        .fl5 { top: 48%; right: 22%; }
        .fl5 .float-item { animation-duration: 5s; animation-delay: -1s; }

        .hero-plane {
          position: fixed; top: 0; left: 0; width: 50px; z-index: 1;
          animation: flyAcross 15s ease-in-out infinite;
          filter: drop-shadow(0 8px 14px rgba(27, 42, 74, 0.22));
        }
        @keyframes flyAcross {
          0% { transform: translate(-10vw, 22vh) rotate(12deg) scale(0.9); opacity: 0; }
          8% { opacity: 1; }
          50% { transform: translate(48vw, 6vh) rotate(-6deg) scale(1.05); }
          92% { opacity: 1; }
          100% { transform: translate(112vw, 26vh) rotate(16deg) scale(0.9); opacity: 0; }
        }
        .hero-plane-2 {
          position: fixed; top: 0; left: 0; width: 44px; z-index: 1;
          animation: flyAcrossPlaneReverse 17s ease-in-out infinite;
          animation-delay: 6s;
          filter: drop-shadow(0 8px 14px rgba(27, 42, 74, 0.22));
        }
        @keyframes flyAcrossPlaneReverse {
          0% { transform: translate(110vw, 16vh) rotate(-168deg) scale(0.9); opacity: 0; }
          8% { opacity: 1; }
          50% { transform: translate(52vw, 30vh) rotate(-186deg) scale(1.05); }
          92% { opacity: 1; }
          100% { transform: translate(-12vw, 12vh) rotate(-164deg) scale(0.9); opacity: 0; }
        }
        .hero-envelope {
          position: fixed; top: 0; left: 0; width: 24px; z-index: 1; opacity: 0;
          animation: flyAcrossReverse 19s ease-in-out infinite;
          animation-delay: 3s;
          filter: drop-shadow(0 6px 10px rgba(27, 42, 74, 0.18));
        }
        @keyframes flyAcrossReverse {
          0% { transform: translate(110vw, 73vh) rotate(-10deg) scale(0.85); opacity: 0; }
          10% { opacity: 0.8; }
          50% { transform: translate(48vw, 79vh) rotate(8deg) scale(1); }
          90% { opacity: 0.8; }
          100% { transform: translate(-14vw, 75vh) rotate(-14deg) scale(0.85); opacity: 0; }
        }
        .hero-envelope-2 {
          position: fixed; top: 0; left: 0; width: 22px; z-index: 1; opacity: 0;
          animation: flyAcrossLow 19s ease-in-out infinite;
          animation-delay: 11s;
          filter: drop-shadow(0 6px 10px rgba(27, 42, 74, 0.18));
        }
        @keyframes flyAcrossLow {
          0% { transform: translate(-12vw, 71vh) rotate(8deg) scale(0.85); opacity: 0; }
          10% { opacity: 0.8; }
          50% { transform: translate(50vw, 77vh) rotate(-8deg) scale(1); }
          90% { opacity: 0.8; }
          100% { transform: translate(112vw, 73vh) rotate(10deg) scale(0.85); opacity: 0; }
        }

        .sparkle { position: fixed; z-index: 3; pointer-events: none; animation: twinkle 3.4s ease-in-out infinite; opacity: 0; }
        .sp1 { top: 16%; left: 32%; animation-delay: 0.2s; }
        .sp2 { top: 70%; left: 30%; animation-delay: 1.6s; animation-duration: 4s; }
        .sp3 { top: 24%; right: 16%; animation-delay: 0.9s; animation-duration: 3.8s; }
        .sp4 { bottom: 14%; right: 20%; animation-delay: 2.2s; }
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0.4) rotate(0deg); }
          50% { opacity: 0.9; transform: scale(1) rotate(25deg); }
        }

        .spotlight {
          position: fixed; z-index: 1; width: 640px; height: 640px;
          background: radial-gradient(circle, rgba(240, 198, 140, 0.28) 0%, rgba(255, 255, 255, 0.1) 35%, transparent 68%);
          transform: translate(-50%, -50%);
          pointer-events: none;
          transition: left 0.15s ease-out, top 0.15s ease-out;
          filter: blur(4px);
        }

        .stage {
          position: relative; z-index: 2; min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          padding: 32px 20px; perspective: 1400px;
        }

        .card {
          position: relative; width: 100%; max-width: 440px;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border: 1px solid rgba(255, 255, 255, 0.75);
          border-radius: 28px;
          padding: 38px 36px 30px;
          box-shadow: 0 40px 80px -24px rgba(70, 45, 120, 0.38), 0 14px 34px -12px rgba(255, 120, 120, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
          transform-style: preserve-3d;
          will-change: transform;
          animation: cardIn 1s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          isolation: isolate;
        }
        @keyframes cardIn {
          0% { opacity: 0; transform: translateY(40px) rotateX(10deg) scale(0.96); }
          100% { opacity: 1; transform: translateY(0) rotateX(0) scale(1); }
        }
        .card::before {
          content: ""; position: absolute; inset: -16px; border-radius: 36px; z-index: -1;
          background: conic-gradient(from 0deg, #ff6b6b, #f0c68c, #7c6bff, #4d96ff, #ff6b6b);
          filter: blur(22px); opacity: 0.45;
        }
        .card::after {
          content: ""; position: absolute; inset: 0; border-radius: 28px; z-index: 4;
          opacity: 0.035; mix-blend-mode: overlay; pointer-events: none;
          background-image: ${GRAIN_URL};
        }
        .card-shimmer { position: absolute; inset: 0; border-radius: 28px; overflow: hidden; pointer-events: none; z-index: 3; }
        .card-shimmer::before {
          content: ""; position: absolute; top: -40%; left: -60%; width: 60%; height: 180%;
          background: linear-gradient(75deg, transparent 20%, rgba(255, 255, 255, 0.55) 50%, transparent 80%);
          transform: translateX(-120%) rotate(8deg);
          animation: sweep 1.3s ease 1.1s 1 both;
        }
        @keyframes sweep {
          to { transform: translateX(260%) rotate(8deg); }
        }

        .reveal { opacity: 0; animation: riseIn 0.75s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        @keyframes riseIn {
          0% { opacity: 0; --rise: 14px; transform: translateY(var(--rise)); }
          100% { opacity: 1; --rise: 0px; transform: translateY(var(--rise)); }
        }

        .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 22px; }
        .brand-badge {
          width: 46px; height: 46px; border-radius: 14px;
          background: linear-gradient(135deg, #ff6b6b, #d9a056);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 10px 22px -6px rgba(255, 107, 107, 0.55);
          animation: badgeSpin 7s ease-in-out infinite;
        }
        @keyframes badgeSpin {
          0%, 100% { transform: rotate(-6deg); }
          50% { transform: rotate(6deg); }
        }
        .brand-badge svg { width: 24px; height: 24px; }
        .brand-name { font-family: var(--font-baloo), sans-serif; font-weight: 700; font-size: 22px; letter-spacing: 0.4px; }

        .eyebrow {
          font-family: var(--font-baloo), sans-serif; font-weight: 700; font-size: 11.5px;
          letter-spacing: 1.4px; text-transform: uppercase; color: #fff;
          display: inline-block; padding: 6px 14px; border-radius: 20px;
          background: linear-gradient(90deg, #ff6b6b, #7c6bff);
          box-shadow: 0 8px 18px -8px rgba(124, 107, 255, 0.55);
          margin: 0 0 14px;
        }

        .headline {
          font-family: var(--font-baloo), sans-serif; font-weight: 800; font-size: 26px; line-height: 1.2;
          margin: 0 0 14px; color: #1b2a4a;
        }
        .headline :global(.accent) {
          background: linear-gradient(90deg, #ff6b6b, #d9a056 55%, #7c6bff);
          -webkit-background-clip: text; background-clip: text; color: transparent;
          position: relative; display: inline-block;
        }
        .headline :global(.accent-underline) {
          position: absolute; left: -2px; bottom: -9px; width: calc(100% + 4px); height: 12px;
          overflow: visible; pointer-events: none;
        }
        .headline :global(.accent-underline path) {
          stroke-dasharray: 220; stroke-dashoffset: 220;
          animation: drawUnderline 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) 0.9s forwards;
        }
        @keyframes drawUnderline {
          to { stroke-dashoffset: 0; }
        }
        .headline :global(.headline-plane) {
          display: inline-block; width: 74px; height: 32px; margin-left: 6px; margin-bottom: -4px; vertical-align: middle;
          overflow: visible; animation: planeFloat 3s ease-in-out infinite;
          filter: drop-shadow(0 4px 8px rgba(27, 42, 74, 0.18));
        }
        @keyframes planeFloat {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-4px) rotate(4deg); }
        }
        .headline :global(.flame-outer),
        .headline :global(.flame-inner) {
          transform-box: fill-box; transform-origin: left center;
        }
        .headline :global(.flame-outer) { animation: flameFlicker 0.55s ease-in-out infinite; }
        .headline :global(.flame-inner) { animation: flameFlicker 0.4s ease-in-out infinite reverse; animation-delay: 0.05s; }
        @keyframes flameFlicker {
          0%, 100% { transform: scaleX(1) scaleY(1); opacity: 0.9; }
          25% { transform: scaleX(1.18) scaleY(0.85); opacity: 1; }
          50% { transform: scaleX(0.82) scaleY(1.1); opacity: 0.72; }
          75% { transform: scaleX(1.1) scaleY(0.95); opacity: 0.95; }
        }
        .headline :global(.ember) { transform-box: fill-box; transform-origin: center; animation: emberRise 1.1s ease-out infinite; }
        @keyframes emberRise {
          0% { transform: translate(0, 0) scale(1); opacity: 0.9; }
          100% { transform: translate(-8px, -9px) scale(0.15); opacity: 0; }
        }
        .headline :global(.e1) { animation-delay: 0s; }
        .headline :global(.e2) { animation-delay: 0.35s; }
        .headline :global(.e3) { animation-delay: 0.7s; }
        .headline :global(.nav-light) { animation: navBlink 2.2s ease-in-out infinite; }
        @keyframes navBlink {
          0%, 100% { opacity: 0.2; filter: drop-shadow(0 0 0px rgba(255, 59, 59, 0)); }
          50% { opacity: 1; filter: drop-shadow(0 0 4px rgba(255, 59, 59, 0.95)); }
        }

        .subtext {
          margin: 0 0 24px; color: #1b2a4a; font-size: 14.5px; font-weight: 600; line-height: 1.55;
        }
        .subtext :global(.accent-word) {
          animation: keyPhrasePulse 3.2s ease-in-out infinite;
        }
        @keyframes keyPhrasePulse {
          0%, 100% { color: inherit; }
          50% { color: #ff6b6b; }
        }

        form { transform-style: preserve-3d; }
        .field { position: relative; margin-bottom: 16px; }
        .field .icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; opacity: 0.55; }
        .field input {
          width: 100%; padding: 17px 16px 8px 44px; border-radius: 16px;
          border: 1.5px solid rgba(27, 42, 74, 0.12);
          background: rgba(255, 255, 255, 0.85);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65), 0 1px 3px rgba(27, 42, 74, 0.04);
          font-family: var(--font-jakarta), sans-serif; font-size: 14.5px; color: #1b2a4a;
          outline: none; transition: border-color 0.2s, box-shadow 0.25s, transform 0.15s;
        }
        .field input::placeholder { color: transparent; }
        .field input:focus {
          border-color: #7c6bff;
          box-shadow: 0 0 0 4px rgba(124, 107, 255, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.65);
          transform: translateY(-1px);
        }
        .field label {
          position: absolute; left: 44px; top: 16px; font-size: 14.5px; color: #63709a;
          pointer-events: none; transition: all 0.16s ease;
        }
        .field input:focus + label,
        .field input:not(:placeholder-shown) + label {
          top: 6px; left: 44px; font-size: 10.5px; font-weight: 600; letter-spacing: 0.4px;
          color: #7c6bff; text-transform: uppercase;
        }
        .toggle-eye {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; padding: 4px; opacity: 0.55; display: flex;
        }
        .toggle-eye:hover { opacity: 0.9; }
        .toggle-eye svg { width: 18px; height: 18px; }

        .row-between { display: flex; align-items: center; justify-content: space-between; margin: 4px 0 22px; font-size: 12.5px; }
        .remember { display: flex; align-items: center; gap: 7px; color: #1b2a4a; font-weight: 500; }
        .remember input { accent-color: #7c6bff; width: 14px; height: 14px; }
        .forgot-inert {
          color: #1b2a4a; font-weight: 600; cursor: default;
          text-decoration: underline dotted; text-underline-offset: 3px; text-decoration-color: rgba(27, 42, 74, 0.45);
        }

        .message { font-size: 12.5px; margin: -8px 0 14px; font-weight: 600; }
        .message.error { color: #e5484d; }
        .message.info { color: #1b2a4a; }

        .launch-btn {
          position: relative; width: 100%; border: none; border-radius: 16px; padding: 16px 20px;
          font-family: var(--font-baloo), sans-serif; font-weight: 700; font-size: 16.5px; color: #fff; letter-spacing: 0.3px;
          cursor: pointer;
          background: linear-gradient(90deg, #ff6b6b, #d9a056 55%, #ffa45c);
          background-size: 220% 100%;
          box-shadow: 0 16px 30px -10px rgba(217, 160, 86, 0.5), 0 8px 18px -8px rgba(255, 107, 107, 0.4);
          display: flex; align-items: center; justify-content: center; gap: 10px; overflow: hidden;
          transition: background-position 0.6s ease, transform 0.15s ease, box-shadow 0.25s ease;
        }
        .launch-btn:disabled { cursor: default; }
        .launch-btn.is-locked {
          background: linear-gradient(90deg, #8791ab, #63709a);
          box-shadow: none;
        }
        .launch-btn.is-locked::after { display: none; }
        .launch-btn.is-locked .btn-plane { animation: none; }
        .btn-spinner { animation: spin 0.8s linear infinite; }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .launch-btn::after {
          content: ""; position: absolute; top: 0; left: -40%; width: 35%; height: 100%;
          background: linear-gradient(75deg, transparent, rgba(255, 255, 255, 0.55), transparent);
          transform: skewX(-18deg);
          animation: btnShimmer 4.5s ease-in-out infinite;
        }
        @keyframes btnShimmer {
          0%, 68% { left: -40%; }
          85%, 100% { left: 120%; }
        }
        .launch-btn:hover:not(:disabled) {
          background-position: 100% 0;
          transform: translateY(-2px);
          box-shadow: 0 20px 36px -10px rgba(217, 160, 86, 0.6), 0 10px 22px -8px rgba(255, 107, 107, 0.48);
        }
        .launch-btn:active:not(:disabled) { transform: translateY(1px) scale(0.99); }
        .btn-plane { width: 18px; height: 18px; position: relative; z-index: 1; transition: transform 0.4s ease, opacity 0.4s ease; }
        .launch-btn.is-launching .btn-plane { animation: takeoff 0.85s ease forwards; }
        @keyframes takeoff {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
          60% { transform: translate(70px, -46px) rotate(35deg) scale(1.15); opacity: 1; }
          100% { transform: translate(160px, -110px) rotate(35deg) scale(0.4); opacity: 0; }
        }
        .btn-label { position: relative; z-index: 1; }
        .confetti-dot {
          position: absolute; width: 6px; height: 6px; border-radius: 50%; left: 50%; top: 50%;
          animation: confettiPop 0.9s ease-out var(--delay) both;
          pointer-events: none;
        }
        @keyframes confettiPop {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
        }

        .divider {
          display: flex; align-items: center; gap: 12px; margin: 24px 0 18px;
          color: #63709a; font-family: var(--font-jakarta), sans-serif; font-style: italic; font-size: 12.5px;
        }
        .divider::before,
        .divider::after { content: ""; flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(217, 160, 86, 0.4), transparent); }

        .social-row { display: flex; gap: 12px; }
        .social-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px;
          border-radius: 14px; border: 1.5px solid rgba(27, 42, 74, 0.12); background: rgba(255, 255, 255, 0.78);
          font-family: var(--font-jakarta), sans-serif; font-weight: 600; font-size: 13px; color: #1b2a4a;
          cursor: pointer; transition: transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s;
        }
        .social-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 22px -8px rgba(27, 42, 74, 0.25); border-color: rgba(217, 160, 86, 0.4); }

        .footer-line { margin: 22px 0 0; text-align: center; font-size: 13px; font-weight: 500; color: #1b2a4a; }
        .footer-line button {
          border: none; background: none; padding: 0; color: #ff6b6b; font-weight: 700; cursor: pointer;
          font-size: inherit; font-family: inherit;
        }
        .footer-line button:hover { text-decoration: underline; }

        @media (max-width: 480px) {
          .card { padding: 32px 24px 26px; border-radius: 24px; }
          .headline { font-size: 21px; white-space: normal; }
          .headline :global(.headline-plane) { width: 60px; height: 26px; margin-bottom: -3px; }
          .spotlight { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .login-stage,
          .blob-inner,
          .float-item,
          .hero-plane,
          .hero-plane-2,
          .hero-envelope,
          .hero-envelope-2,
          .sparkle,
          .card,
          .card::before,
          .card-shimmer::before,
          .brand-badge,
          .headline :global(.headline-plane),
          .headline :global(.flame-outer),
          .headline :global(.flame-inner),
          .headline :global(.ember),
          .headline :global(.nav-light),
          .launch-btn::after,
          .launch-btn .btn-plane,
          .subtext :global(.accent-word) {
            animation: none !important;
            transition: none !important;
          }
          .reveal { opacity: 1; }
        }
      `}</style>
    </main>
  );
}
