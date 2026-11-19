import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordResetApi } from "../api/authApi";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitted(false);
    try {
      await requestPasswordResetApi(email);
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to request a password reset.");
    }
  }

  return (
    <main className="min-h-[calc(100vh-72px)] px-4 py-10 flex items-center justify-center bg-gradient-to-br from-slate-100 via-cyan-50 to-emerald-50">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Account recovery</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Forgot your password?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Enter your account email and we’ll send a one-time password reset link if it matches an account.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <label htmlFor="reset-email" className="grid gap-2 text-sm font-medium text-slate-700">
            Email address
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-emerald-400"
              required
            />
          </label>

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {submitted && (
            <p role="status" className="text-sm text-emerald-700">
              If an account matches that email, password reset instructions will be sent.
            </p>
          )}

          <button type="submit" className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800">
            Send reset link
          </button>
        </form>

        <Link to="/login" className="mt-5 inline-block text-sm font-semibold text-emerald-700 hover:underline">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
