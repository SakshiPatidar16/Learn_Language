import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import ToastContainer from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import {
  getPublicLanguages,
  getLanguages,
  createLanguage,
  updateLanguage,
  deleteLanguage
} from "../api/languageApi";

export default function HomePage() {
  const { session, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [isLanguageFormOpen, setIsLanguageFormOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");

  const loadLanguages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = session
        ? await getLanguages(session.token)
        : await getPublicLanguages();
      setLanguages(data);
    } catch (err) {
      setError(err.message || "Failed to load languages");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadLanguages();
  }, [loadLanguages]);

  function closeLanguageForm() {
    setIsLanguageFormOpen(false);
    setEditId("");
    setNameInput("");
    setDescriptionInput("");
  }

  async function handleAddOrUpdate(e) {
    e.preventDefault();
    const isEdit = Boolean(editId);
    try {
      if (isEdit) {
        await updateLanguage(editId, { name: nameInput, description: descriptionInput }, session.token);
        addToast("Language updated successfully.");
      } else {
        await createLanguage({ name: nameInput, description: descriptionInput }, session.token);
        addToast("Language added successfully.");
      }
      closeLanguageForm();
      await loadLanguages();
    } catch (err) {
      addToast(err.message || "Failed to save language", "error");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteLanguage(id, session.token);
      addToast("Language deleted successfully.");
      await loadLanguages();
    } catch (err) {
      addToast(err.message || "Failed to delete language", "error");
    }
  }

  function startEdit(item) {
    setEditId(item.id);
    setNameInput(item.name);
    setDescriptionInput(item.description);
    setIsLanguageFormOpen(true);
  }

  function openLanguageDetails(item) {
    if (!session) {
      navigate("/login", { state: { from: `/languages/${encodeURIComponent(item.id)}` } });
      return;
    }
    navigate(`/languages/${encodeURIComponent(item.id)}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-emerald-50">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-6">
        <div className="rounded-3xl bg-slate-900 text-white shadow-xl overflow-hidden">
          <div className="p-6 md:p-8 lg:p-10 grid gap-6 md:grid-cols-[1.2fr_0.8fr] items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Language Library</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold leading-tight">
                Explore Programming Languages With Real Descriptions
              </h2>
              <p className="mt-3 text-slate-200 max-w-2xl">
                Click any language card to open a dedicated program page with question, code, and output examples.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {languages.slice(0, 5).map((item) => (
                  <span key={item.id} className="bg-white/10 border border-white/20 text-slate-100 px-3 py-1 rounded-full text-xs">
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-2xl p-5 md:p-6">
              <p className="text-xs text-cyan-200 uppercase tracking-[0.2em]">Live Stats</p>
              <p className="mt-2 text-4xl font-bold">{languages.length}</p>
              <p className="text-slate-200 text-sm">Languages Available</p>
              <div className="mt-4 h-px bg-white/20" />
              <p className="mt-4 text-sm text-slate-200">
                {session
                  ? `Welcome ${session.email}. ${isAdmin ? "Admin tools are enabled." : "Browse and learn."}`
                  : "Sign in for personalized access. Sign up if you are a new user."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {isAdmin && (
        <section className="max-w-6xl mx-auto mt-5 px-4 md:px-6">
          <button
            type="button"
            onClick={() => setIsLanguageFormOpen(true)}
            className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
          >
            + Add Language
          </button>
        </section>
      )}

      {isLanguageFormOpen && (
        <Modal title={editId ? "Edit Language" : "Add Language"} onClose={closeLanguageForm}>
          <form onSubmit={handleAddOrUpdate} className="grid gap-4">
            <input
              type="text"
              placeholder="Language name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-emerald-400"
              required
            />
            <textarea
              placeholder="Language description"
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              className="border border-slate-300 rounded-lg p-3 min-h-28 outline-none focus:ring-2 focus:ring-emerald-400"
              required
            />
            <div className="flex gap-3 pt-1">
              <button type="submit" className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition">
                {editId ? "Update" : "Add"}
              </button>
              <button type="button" onClick={closeLanguageForm} className="bg-slate-200 text-slate-900 px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-300 transition">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      <section className="max-w-6xl mx-auto mt-5 px-4 md:px-6 grid md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5 pb-10">
        {loading && <p className="text-slate-700 col-span-full">Loading...</p>}
        {error && <p className="text-red-600 col-span-full">{error}</p>}
        {!loading && !error && languages.length === 0 && (
          <p className="text-slate-700 col-span-full">No languages available.</p>
        )}

        {languages.map((item) => (
          <article
            key={item.id}
            onClick={() => openLanguageDetails(item)}
            className="bg-white rounded-2xl shadow-md p-5 border border-slate-100 hover:-translate-y-1 hover:shadow-lg transition cursor-pointer"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-slate-800">{item.name}</h3>
              <span className="text-[11px] font-semibold text-cyan-700 bg-cyan-50 px-2 py-1 rounded-full">Active</span>
            </div>
            <p className="text-slate-700 mt-2 leading-7">{item.description}</p>
            <p className="text-xs text-slate-500 mt-4">
              Added by: {item.createdBy} | Last update: {new Date(item.updatedAt).toLocaleString()}
            </p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openLanguageDetails(item); }}
              className="mt-4 bg-slate-100 text-slate-800 px-3 py-2 rounded-lg text-sm font-medium"
            >
              Open Details
            </button>
            {isAdmin && (
              <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={() => startEdit(item)} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(item.id)} className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm">
                  Delete
                </button>
              </div>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
