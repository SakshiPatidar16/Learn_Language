import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LanguageTerminal from "../components/LanguageTerminal";
import { useAuth } from "../context/AuthContext";
import { getLanguages } from "../api/languageApi";
import { getProgramsByUnit } from "../api/programApi";

export default function TerminalPage() {
  const { languageId, unitId, programId } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();

  const decodedLanguageId = decodeURIComponent(languageId);
  const decodedUnitId = decodeURIComponent(unitId);
  const decodedProgramId = decodeURIComponent(programId);

  const [language, setLanguage] = useState(null);
  const [programs, setPrograms] = useState([]);

  const activeProgram = useMemo(
    () => programs.find((p) => p.id === decodedProgramId) || null,
    [programs, decodedProgramId]
  );

  useEffect(() => {
    getLanguages(session.token)
      .then((langs) => setLanguage(langs.find((l) => l.id === decodedLanguageId) || null))
      .catch(() => {});
    getProgramsByUnit(decodedUnitId)
      .then(setPrograms)
      .catch(() => {});
  }, [decodedLanguageId, decodedUnitId, session.token]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-emerald-50">
      <section className="max-w-6xl mx-auto mt-5 px-4 md:px-6 pb-10">
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 md:p-6">
          <div>
            <button
              type="button"
              onClick={() => navigate(`/languages/${languageId}/units/${unitId}`)}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              &larr; Back to Unit
            </button>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mt-1">
              Terminal — {language?.name || "Language"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {activeProgram ? activeProgram.question : "Loading program..."}
            </p>
          </div>

          {activeProgram ? (
            <LanguageTerminal
              key={activeProgram.id}
              languageName={language?.name || ""}
              program={activeProgram}
            />
          ) : (
            <p className="mt-6 text-slate-600">Loading program...</p>
          )}
        </div>
      </section>
    </main>
  );
}
