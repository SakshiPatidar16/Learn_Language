import logoImage from "../assets/Logo.png";

function Header({ session, onLogout, onOpenSignIn, onOpenSignUp }) {
  return (
    <header className="w-full bg-slate-900 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img
            src={logoImage}
            alt="Learn Program"
            className="w-10 h-10 md:w-12 md:h-12 object-contain bg-white rounded-md p-1"
          />
          <div>
            <h1 className="text-2xl font-bold">Learn Program</h1>
          </div>
        </div>

        {session ? (
          <button
            type="button"
            onClick={onLogout}
            className="bg-white text-slate-900 px-4 py-2 rounded-lg font-semibold"
          >
            Logout 
          </button>
        ) : (
          <div className="flex gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={onOpenSignIn}
              className="bg-white text-slate-900 px-4 py-2 rounded-lg font-semibold"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={onOpenSignUp}
              className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold"
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;