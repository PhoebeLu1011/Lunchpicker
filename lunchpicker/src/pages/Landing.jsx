import "../styles/Landing.css";

export default function Landing({ onStart }) {
  return (
    <div className="landing-shell">
      {/* 背景層（完全沿用你現在的） */}
      <div className="landing-bg moving-blobs" aria-hidden="true" />
      <div className="landing-hero-wave" aria-hidden="true" />

      {/* Hero */}
      <main className="landing-center">
        <h1 className="landing-brand">Lunchpicker</h1>
        <p className="landing-tagline">
          Your personal lunch decision assistant.
        </p>

        <button
          className="landing-cta"
          onClick={onStart}
          type="button"
        >
          Get Started
        </button>
      </main>
    </div>
  );
}
