import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import Login from "./components/Login";
import Register from "./components/Register";
import LanguageTerminal from "./components/LanguageTerminal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

function App() {
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [session, setSession] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [requestedPath, setRequestedPath] = useState("");

  const [nameInput, setNameInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [editId, setEditId] = useState("");

  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [isProgramFormOpen, setIsProgramFormOpen] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState("");
  const [questionInput, setQuestionInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [outputInput, setOutputInput] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = useMemo(() => session?.role === "admin", [session]);
  const isLoginPage = location.pathname === "/login";
  const isSignupPage = location.pathname === "/signup";
  const showAuthPage = !session && (isLoginPage || isSignupPage);
  const showMainSections = !showAuthPage;

  const languagePathMatch = location.pathname.match(/^\/languages\/([^/]+)$/);
  const terminalPathMatch = location.pathname.match(/^\/languages\/([^/]+)\/programs\/([^/]+)\/terminal$/);
  const activeLanguageId = terminalPathMatch
    ? decodeURIComponent(terminalPathMatch[1])
    : languagePathMatch
      ? decodeURIComponent(languagePathMatch[1])
      : "";
  const activeTerminalProgramId = terminalPathMatch ? decodeURIComponent(terminalPathMatch[2]) : "";
  const isLanguageProgramsPage = Boolean(languagePathMatch);
  const isTerminalPage = Boolean(terminalPathMatch);
  const showHomePage = showMainSections && !isLanguageProgramsPage && !isTerminalPage;

  const languageCount = languages.length;
  const activeLanguage = useMemo(
    () => languages.find((item) => item.id === activeLanguageId) || null,
    [languages, activeLanguageId]
  );
  const activeTerminalProgram = useMemo(
    () => programs.find((item) => item.id === activeTerminalProgramId) || null,
    [programs, activeTerminalProgramId]
  );

  function clearProgramForm() {
    setQuestionInput("");
    setCodeInput("");
    setOutputInput("");
    setEditingProgramId("");
  }

  async function fetchPublicLanguages() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/public/languages`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load languages");
      }

      setLanguages(data);
    } catch (err) {
      setError(err.message || "Failed to load languages");
    } finally {
      setLoading(false);
    }
  }

  async function fetchLanguages(activeSession) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/languages`, {
        headers: {
          Authorization: `Bearer ${activeSession.token}`
        }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load languages");
      }

      setLanguages(data);
    } catch (err) {
      setError(err.message || "Failed to load languages");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPrograms(languageId) {
    if (!languageId) return;

    setLoadingPrograms(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/public/languages/${languageId}/programs`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to load programs");
      }

      setPrograms(data);
    } catch (err) {
      setError(err.message || "Failed to load programs");
    } finally {
      setLoadingPrograms(false);
    }
  }

  async function login(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, password: passwordInput })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      setSession(data);
      setShowAuthPrompt(false);
      navigate(requestedPath || "/");
      setRequestedPath("");
      await fetchLanguages(data);
    } catch (err) {
      setError(err.message || "Login failed");
    }
  }

  async function signup(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (passwordInput !== confirmPasswordInput) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupName,
          email: emailInput,
          phone: signupPhone,
          password: passwordInput
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Signup failed");
      }

      setMessage("Signup successful. Please sign in now.");
      navigate("/login");
      setPasswordInput("");
      setConfirmPasswordInput("");
      setSignupName("");
      setSignupPhone("");
    } catch (err) {
      setError(err.message || "Signup failed");
    }
  }

  async function handleAddOrUpdate(e) {
    e.preventDefault();
    if (!isAdmin || !session) return;

    const payload = {
      name: nameInput,
      description: descriptionInput
    };

    const isEdit = Boolean(editId);
    const url = isEdit ? `${API_BASE}/languages/${editId}` : `${API_BASE}/languages`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save language");
      }

      setNameInput("");
      setDescriptionInput("");
      setEditId("");
      await fetchLanguages(session);
    } catch (err) {
      setError(err.message || "Failed to save language");
    }
  }

  async function handleDelete(id) {
    if (!isAdmin || !session) return;

    try {
      const res = await fetch(`${API_BASE}/languages/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.token}`
        }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete language");
      }

      if (activeLanguageId === id) {
        navigate("/");
        setPrograms([]);
      }

      await fetchLanguages(session);
    } catch (err) {
      setError(err.message || "Failed to delete language");
    }
  }

  function startEdit(item) {
    if (!isAdmin) return;
    setEditId(item.id);
    setNameInput(item.name);
    setDescriptionInput(item.description);
  }

  async function handleProgramSubmit(e) {
    e.preventDefault();
    if (!isAdmin || !session || !activeLanguageId) return;

    setError("");
    setMessage("");

    const payload = {
      question: questionInput,
      code: codeInput,
      output: outputInput
    };

    const isEdit = Boolean(editingProgramId);
    const url = isEdit
      ? `${API_BASE}/programs/${editingProgramId}`
      : `${API_BASE}/languages/${activeLanguageId}/programs`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to save program");
      }

      clearProgramForm();
      setIsProgramFormOpen(false);
      setMessage(isEdit ? "Program updated successfully." : "Program added successfully.");
      await fetchPrograms(activeLanguageId);
    } catch (err) {
      setError(err.message || "Failed to save program");
    }
  }

  async function handleProgramDelete(programId) {
    if (!isAdmin || !session || !programId) return;

    try {
      const res = await fetch(`${API_BASE}/programs/${programId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.token}`
        }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete program");
      }

      if (editingProgramId === programId) {
        clearProgramForm();
        setIsProgramFormOpen(false);
      }

      if (isTerminalPage && activeTerminalProgramId === programId) {
        navigate(`/languages/${encodeURIComponent(activeLanguageId)}`);
      }

      setMessage("Program deleted successfully.");
      await fetchPrograms(activeLanguageId);
    } catch (err) {
      setError(err.message || "Failed to delete program");
    }
  }

  function startProgramEdit(program) {
    if (!isAdmin) return;
    setIsProgramFormOpen(true);
    setEditingProgramId(program.id);
    setQuestionInput(program.question);
    setCodeInput(program.code);
    setOutputInput(program.output);
  }

  function openLanguagePrograms(language) {
    const path = `/languages/${encodeURIComponent(language.id)}`;

    if (!session) {
      setRequestedPath(path);
      setShowAuthPrompt(true);
      return;
    }

    setError("");
    setMessage("");
    setPrograms([]);
    clearProgramForm();
    setIsProgramFormOpen(false);
    navigate(path);
  }

  function openProtectedPage(path) {
    if (!session) {
      setRequestedPath(path);
      setShowAuthPrompt(true);
      return;
    }

    navigate(path);
  }

  function logout() {
    setSession(null);
    setLanguages([]);
    setPrograms([]);
    setNameInput("");
    setDescriptionInput("");
    setEditId("");
    setEmailInput("");
    setPasswordInput("");
    setMessage("");
    setError("");
    clearProgramForm();
    setIsProgramFormOpen(false);
    navigate("/");
    fetchPublicLanguages();
  }

  useEffect(() => {
    fetchPublicLanguages();
  }, []);

  useEffect(() => {
    const isPublicPath = ["/", "/login", "/signup"].includes(location.pathname);

    if (!session && !isPublicPath) {
      setRequestedPath(location.pathname);
      setShowAuthPrompt(true);
      navigate("/", { replace: true });
    }
  }, [location.pathname, navigate, session]);

  useEffect(() => {
    if (session && showMainSections && activeLanguageId && (isLanguageProgramsPage || isTerminalPage)) {
      fetchPrograms(activeLanguageId);
    }
  }, [session, showMainSections, isLanguageProgramsPage, isTerminalPage, activeLanguageId]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-emerald-50">
      <Header
        session={session}
        onLogout={logout}
        onOpenSignIn={() => {
          navigate("/login");
          setError("");
          setMessage("");
        }}
        onOpenSignUp={() => {
          navigate("/signup");
          setError("");
          setMessage("");
        }}
      />

      {showAuthPage && isLoginPage ? (
        <Login
          email={emailInput}
          password={passwordInput}
          error={error}
          message={message}
          onEmailChange={setEmailInput}
          onPasswordChange={setPasswordInput}
          onSubmit={login}
          onCancel={() => {
            navigate("/");
            setError("");
            setMessage("");
          }}
        />
      ) : null}

      {showAuthPage && isSignupPage ? (
        <Register
          name={signupName}
          email={emailInput}
          phone={signupPhone}
          password={passwordInput}
          confirmPassword={confirmPasswordInput}
          error={error}
          message={message}
          onNameChange={setSignupName}
          onEmailChange={setEmailInput}
          onPhoneChange={setSignupPhone}
          onPasswordChange={setPasswordInput}
          onConfirmPasswordChange={setConfirmPasswordInput}
          onSubmit={signup}
          onCancel={() => {
            navigate("/");
            setError("");
            setMessage("");
          }}
        />
      ) : null}

      {showHomePage ? (
        <section className="max-w-6xl mx-auto px-4 md:px-6 pt-6">
          <div className="rounded-3xl bg-slate-900 text-white shadow-xl overflow-hidden">
            <div className="p-6 md:p-8 lg:p-10 grid gap-6 md:grid-cols-[1.2fr_0.8fr] items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Language Library</p>
                <h2 className="mt-3 text-3xl md:text-4xl font-bold leading-tight">
                  Explore Programming Languages With Real Descriptions
                </h2>
                <p className="mt-3 text-slate-200 max-w-2xl">
                  Click any language card to open a dedicated program page with question, code, and
                  output examples.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {languages.slice(0, 5).map((item) => (
                    <span
                      key={item.id}
                      className="bg-white/10 border border-white/20 text-slate-100 px-3 py-1 rounded-full text-xs"
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-white/10 border border-white/20 rounded-2xl p-5 md:p-6">
                <p className="text-xs text-cyan-200 uppercase tracking-[0.2em]">Live Stats</p>
                <p className="mt-2 text-4xl font-bold">{languageCount}</p>
                <p className="text-slate-200 text-sm">Languages Available</p>
                <div className="mt-4 h-px bg-white/20" />
                <p className="mt-4 text-sm text-slate-200">
                  {session
                    ? `Welcome ${session.email}. ${isAdmin ? "Admin tools are enabled." : "Browse and learn."}`
                    : "Sign in for personalized access. Sign up if you are a new patient user."}
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {showHomePage && isAdmin ? (
        <section className="max-w-6xl mx-auto mt-5 px-4 md:px-6">
          <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 border border-slate-100">
            <h2 className="text-xl font-semibold text-slate-800">
              {editId ? "Edit Language" : "Add Language"}
            </h2>
            <form onSubmit={handleAddOrUpdate} className="grid gap-3 mt-4">
              <input
                type="text"
                placeholder="Language name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="border border-slate-300 rounded-lg p-3"
                required
              />
              <textarea
                placeholder="Language description"
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                className="border border-slate-300 rounded-lg p-3 min-h-28"
                required
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  {editId ? "Update" : "Add"}
                </button>
                {editId ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditId("");
                      setNameInput("");
                      setDescriptionInput("");
                    }}
                    className="bg-slate-200 text-slate-900 px-4 py-2 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </section>
      ) : null}

      {showHomePage ? (
        <section className="max-w-6xl mx-auto mt-5 px-4 md:px-6 grid md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
          {loading ? <p className="text-slate-700 col-span-full">Loading...</p> : null}

          {!loading && languages.length === 0 ? (
            <p className="text-slate-700 col-span-full">No languages available.</p>
          ) : null}

          {languages.map((item) => (
            <article
              key={item.id}
              onClick={() => openLanguagePrograms(item)}
              className="bg-white rounded-2xl shadow-md p-5 border border-slate-100 hover:-translate-y-1 hover:shadow-lg transition cursor-pointer"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-slate-800">{item.name}</h3>
                <span className="text-[11px] font-semibold text-cyan-700 bg-cyan-50 px-2 py-1 rounded-full">
                  Active
                </span>
              </div>
              <p className="text-slate-700 mt-2 leading-7">{item.description}</p>
              <p className="text-xs text-slate-500 mt-4">
                Added by: {item.createdBy} | Last update: {new Date(item.updatedAt).toLocaleString()}
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openLanguagePrograms(item);
                }}
                className="mt-4 bg-slate-100 text-slate-800 px-3 py-2 rounded-lg text-sm font-medium"
              >
                Open Programs
              </button>

              {isAdmin ? (
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(item);
                    }}
                    className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm"
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      {session && showMainSections && isLanguageProgramsPage ? (
        <section className="max-w-6xl mx-auto mt-5 px-4 md:px-6 pb-10">
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  Back to Languages
                </button>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mt-1">
                  {activeLanguage ? `${activeLanguage.name} Programs` : "Language Programs"}
                </h2>
                <p className="text-sm text-slate-500 mt-1">All questions with code and output.</p>
              </div>

              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    clearProgramForm();
                    setIsProgramFormOpen((prev) => !prev);
                  }}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  {isProgramFormOpen ? "Close Add Form" : "Add Program"}
                </button>
              ) : null}
            </div>

            {isAdmin && isProgramFormOpen ? (
              <form
                onSubmit={handleProgramSubmit}
                className="grid gap-3 mt-5 bg-slate-50 border border-slate-200 rounded-xl p-4"
              >
                <h3 className="text-lg font-semibold text-slate-800">
                  {editingProgramId ? "Edit Program" : "Add Program"}
                </h3>
                <input
                  type="text"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  placeholder="Question"
                  className="border border-slate-300 rounded-lg p-3"
                  required
                />
                <textarea
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Code"
                  className="border border-slate-300 rounded-lg p-3 min-h-36 font-mono text-sm"
                  required
                />
                <textarea
                  value={outputInput}
                  onChange={(e) => setOutputInput(e.target.value)}
                  placeholder="Output"
                  className="border border-slate-300 rounded-lg p-3 min-h-24 font-mono text-sm"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    {editingProgramId ? "Update" : "Add"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearProgramForm();
                      setIsProgramFormOpen(false);
                    }}
                    className="bg-slate-200 text-slate-900 px-4 py-2 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}

            <div className="grid gap-4 mt-5">
              {loadingPrograms ? <p className="text-slate-600">Loading programs...</p> : null}

              {!loadingPrograms && programs.length === 0 ? (
                <p className="text-slate-600">No programs available for this language.</p>
              ) : null}

              {programs.map((program) => (
                <article key={program.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-lg font-semibold text-slate-800">Q. {program.question}</h3>

                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Code</p>
                    <pre className="mt-2 bg-slate-900 text-slate-100 rounded-lg p-3 overflow-auto text-sm">{program.code}</pre>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Output</p>
                    <pre className="mt-2 bg-slate-100 text-slate-800 rounded-lg p-3 border border-slate-200 overflow-auto text-sm">{program.output}</pre>
                  </div>

                  {isAdmin ? (
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startProgramEdit(program)}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProgramDelete(program.id)}
                        className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() =>
                        openProtectedPage(
                          `/languages/${encodeURIComponent(activeLanguageId)}/programs/${encodeURIComponent(program.id)}/terminal`
                        )
                      }
                      className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm"
                    >
                      Terminal
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {session && showMainSections && isTerminalPage ? (
        <section className="max-w-6xl mx-auto mt-5 px-4 md:px-6 pb-10">
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <button
                  type="button"
                  onClick={() => navigate(`/languages/${encodeURIComponent(activeLanguageId)}`)}
                  className="text-sm text-slate-600 hover:text-slate-900"
                >
                  Back to Programs
                </button>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mt-1">
                  Terminal - {activeLanguage?.name || "Language"}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {activeTerminalProgram ? activeTerminalProgram.question : "Program preview"}
                </p>
              </div>

            </div>

            {activeTerminalProgram ? (
              <LanguageTerminal
                key={activeTerminalProgram.id}
                languageName={activeLanguage?.name || ""}
                program={activeTerminalProgram}
              />
            ) : (
              <p className="text-slate-600 mt-4">Program not found for this terminal page.</p>
            )}
          </div>
        </section>
      ) : null}

      {showMainSections && error ? (
        <p className="max-w-6xl mx-auto mt-4 text-red-600 bg-red-100 px-4 py-3 rounded-lg">
          {error}
        </p>
      ) : null}

      {showMainSections && message ? (
        <p className="max-w-6xl mx-auto mt-4 text-emerald-700 bg-emerald-100 px-4 py-3 rounded-lg">
          {message}
        </p>
      ) : null}

      {showAuthPrompt && !session ? (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 px-4 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-required-title"
          onClick={() => setShowAuthPrompt(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="auth-required-title" className="text-2xl font-bold text-slate-900">
              Login required
            </h2>
            <p className="mt-2 text-slate-600">
              Please sign in to open this page, or register if you do not have an account yet.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAuthPrompt(false);
                  navigate("/login");
                }}
                className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAuthPrompt(false);
                  navigate("/signup");
                }}
                className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white"
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => setShowAuthPrompt(false)}
                className="rounded-lg bg-slate-200 px-4 py-2 font-semibold text-slate-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default App;
