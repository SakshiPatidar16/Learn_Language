import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Modal from "../components/Modal";
import UnitForm from "../components/UnitForm";
import ToastContainer from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { getLanguages } from "../api/languageApi";
import { getUnitsByLanguage, createUnit, updateUnit, deleteUnit } from "../api/unitApi";

export default function LanguageDetailsPage() {
  const { languageId } = useParams();
  const { session, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const decodedLanguageId = decodeURIComponent(languageId);

  const [language, setLanguage] = useState(null);
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  const [isUnitFormOpen, setIsUnitFormOpen] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState("");
  const [unitNameInput, setUnitNameInput] = useState("");
  const [unitNotesInput, setUnitNotesInput] = useState("");
  const [unitPdfFile, setUnitPdfFile] = useState(null);
  const [unitWordFile, setUnitWordFile] = useState(null);

  function clearUnitForm() {
    setUnitNameInput("");
    setUnitNotesInput("");
    setUnitPdfFile(null);
    setUnitWordFile(null);
    setEditingUnitId("");
  }

  const loadUnits = useCallback(async () => {
    setLoadingUnits(true);
    try {
      const data = await getUnitsByLanguage(decodedLanguageId);
      setUnits(data);
    } catch (err) {
      addToast(err.message || "Failed to load units", "error");
    } finally {
      setLoadingUnits(false);
    }
  }, [decodedLanguageId]);

  useEffect(() => {
    getLanguages(session.token)
      .then((langs) => setLanguage(langs.find((l) => l.id === decodedLanguageId) || null))
      .catch(() => {});
    loadUnits();
  }, [decodedLanguageId, session.token]);

  async function handleUnitSubmit(e) {
    e.preventDefault();
    const isEdit = Boolean(editingUnitId);

    try {
      if (isEdit) {
        await updateUnit(editingUnitId, { name: unitNameInput, notes: unitNotesInput }, session.token);
        addToast("Unit updated successfully.");
      } else {
        const formData = new FormData();
        formData.append("name", unitNameInput);
        formData.append("notes", unitNotesInput);
        if (unitPdfFile) formData.append("pdf", unitPdfFile);
        if (unitWordFile) formData.append("word", unitWordFile);
        await createUnit(decodedLanguageId, formData, session.token);
        addToast("Unit added successfully.");
      }
      clearUnitForm();
      setIsUnitFormOpen(false);
      await loadUnits();
    } catch (err) {
      addToast(err.message || "Failed to save unit", "error");
    }
  }

  async function handleUnitDelete(unitId) {
    try {
      await deleteUnit(unitId, session.token);
      addToast("Unit deleted successfully.");
      await loadUnits();
    } catch (err) {
      addToast(err.message || "Failed to delete unit", "error");
    }
  }

  function startUnitEdit(unit) {
    setIsUnitFormOpen(true);
    setEditingUnitId(unit.id);
    setUnitNameInput(unit.name);
    setUnitNotesInput(unit.notes || "");
    setUnitPdfFile(null);
    setUnitWordFile(null);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-emerald-50">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <section className="max-w-6xl mx-auto mt-5 px-4 md:px-6 pb-10">
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <button type="button" onClick={() => navigate("/")} className="text-sm text-slate-600 hover:text-slate-900">
                &larr; Back to Languages
              </button>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mt-1">
                {language ? `${language.name} Units` : "Language Units"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">Select a unit to view notes and programs.</p>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={() => { clearUnitForm(); setIsUnitFormOpen(true); }}
                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Add Unit
              </button>
            )}
          </div>

          {isAdmin && isUnitFormOpen && (
            <Modal
              title={editingUnitId ? "Edit Unit" : "Add Unit"}
              onClose={() => { clearUnitForm(); setIsUnitFormOpen(false); }}
            >
              <UnitForm
                editingUnitId={editingUnitId}
                unitNameInput={unitNameInput}
                setUnitNameInput={setUnitNameInput}
                unitNotesInput={unitNotesInput}
                setUnitNotesInput={setUnitNotesInput}
                handleUnitSubmit={handleUnitSubmit}
                clearUnitForm={clearUnitForm}
                setIsUnitFormOpen={setIsUnitFormOpen}
              />
            </Modal>
          )}

          <div className="grid gap-3 mt-6">
            {loadingUnits && <p className="text-slate-600">Loading units...</p>}
            {!loadingUnits && units.length === 0 && (
              <p className="text-slate-600">No units available for this language.</p>
            )}
            {units.map((unit) => (
              <article
                key={unit.id}
                onClick={() => navigate(`/languages/${languageId}/units/${encodeURIComponent(unit.id)}`)}
                className="group flex items-center justify-between border border-slate-200 bg-white p-4 rounded-2xl hover:border-emerald-300 hover:bg-emerald-50/30 transition cursor-pointer shadow-sm"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <h3 className="text-base font-bold text-slate-800 group-hover:text-emerald-700 leading-tight">
                    {unit.name}
                  </h3>
                  {unit.notes
                    ? <p className="text-sm text-slate-500 truncate max-w-lg">{unit.notes}</p>
                    : <p className="text-xs text-slate-400">View Notes & Programs →</p>
                  }
                </div>
                {isAdmin && (
                  <div className="flex gap-2 shrink-0 ml-4" onClick={(e) => e.stopPropagation()}>
                    <button type="button" onClick={() => startUnitEdit(unit)} className="px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition">
                      Edit
                    </button>
                    <button type="button" onClick={() => handleUnitDelete(unit.id)} className="px-3 py-1.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition">
                      Delete
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
