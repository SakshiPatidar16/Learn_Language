import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPasswordApi } from "../api/authApi";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await resetPasswordApi({ token, password });
      setSuccess(true);
    } catch (requestError) {
      setError(requestError.message || "Unable to reset the password.");
    }
  }

  return (
    <main className="min-h-[calc(100vh-72px)] px-4 py-10 flex items-center justify-center bg-gradient-to-br from-slate-100 via-cyan-50 to-emerald-50">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Account recovery</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Set a new password</h2>

        {!token ? (
          <p role="alert" className="mt-4 text-sm text-red-600">This password reset link is invalid or has expired.</p>
        ) : success ? (
          <div className="mt-4 grid gap-4">
            <p role="status" className="text-sm text-emerald-700">Password updated. You can now sign in.</p>
            <Link to="/login" className="font-semibold text-emerald-700 hover:underline">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <label htmlFor="new-password" className="grid gap-2 text-sm font-medium text-slate-700">
              New password
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-emerald-400"
                required
              />
            </label>
            <p className="text-xs text-slate-500">Use at least 6 characters, including an uppercase letter and a number.</p>
            <label htmlFor="confirm-password" className="grid gap-2 text-sm font-medium text-slate-700">
              Confirm new password
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:ring-2 focus:ring-emerald-400"
                required
              />
            </label>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800">
              Update password
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
