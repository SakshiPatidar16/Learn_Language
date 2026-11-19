import { useNavigate } from "react-router-dom";
import { FiLogOut, FiUser } from "react-icons/fi";
import logoImage from "../assets/Logo.png";

function Header({ session, onLogout, onOpenSignIn, onOpenSignUp }) {
  const navigate = useNavigate();
  return (
    <header className="w-full bg-slate-900 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-8 py-3 md:py-4 flex items-center justify-between gap-2 sm:gap-3">
        <div
          className="flex min-w-0 items-center gap-2 sm:gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img
            src={logoImage}
            alt="Learn Program"
            className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 shrink-0 object-contain bg-white rounded-md p-1"
          />
          <div className="min-w-0">
            <h1 className="whitespace-nowrap text-lg sm:text-2xl font-bold">Learn Program</h1>
          </div>
        </div>

        <div className="flex shrink-0 gap-1.5 sm:gap-2">
          {!session ? (
            <>
              <button
                type="button"
                onClick={onOpenSignIn}
                className="bg-white text-slate-900 px-2.5 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-semibold"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={onOpenSignUp}
                className="bg-emerald-500 text-white px-2.5 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-semibold"
              >
                Sign Up
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span
                title={session.email}
                aria-label={`Signed in as ${session.email}`}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
              >
                <FiUser aria-hidden="true" className="h-5 w-5" />
              </span>
              <span className="hidden text-sm font-medium text-slate-300 sm:inline">
                {session.email}
              </span>
              <button
                type="button"
                onClick={onLogout}
                title="Sign out"
                aria-label="Sign out"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
              >
                <FiLogOut aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;