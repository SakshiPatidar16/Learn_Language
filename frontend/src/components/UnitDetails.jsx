import React from "react";

const UnitDetails = ({
  activeUnit,
  activeLanguage,
  isAdmin,
  API_BASE,
  handleUnitFileUpload,
  handleRemoveFile,
  isProgramFormOpen,
  setIsProgramFormOpen,
  isFileFormOpen,
  setIsFileFormOpen,
  clearProgramForm,
  programs,
  loadingPrograms,
  startProgramEdit,
  handleProgramDelete,
  navigate,
  activeLanguageId,
  activeUnitId
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/languages/${encodeURIComponent(activeLanguageId)}`)}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            &larr; Back to {activeLanguage?.name || "Language"} Units
          </button>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mt-1">
            {activeUnit ? activeUnit.name : "Unit Programs"}
          </h2>
        </div>

        {isAdmin ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsProgramFormOpen(false);
                setIsFileFormOpen(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 transition shadow-sm"
            >
              <span>➕ Add File</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsFileFormOpen(false);
                clearProgramForm();
                setIsProgramFormOpen(true);
              }}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold"
            >
              Add Program
            </button>
          </div>
        ) : null}
      </div>

      {activeUnit?.notes || (activeUnit?.files && activeUnit.files.length > 0) || activeUnit?.pdfPath || activeUnit?.wordPath ? (
        <div className="mt-6 p-5 bg-cyan-50 border border-cyan-100 rounded-2xl">
          <div className="bg-cyan-50/50 rounded-xl p-4 border border-cyan-100 mb-6">
            <h3 className="text-xs font-bold text-cyan-700 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
              Unit Notes & Documents
            </h3>
            <div className="grid gap-3">
              {/* Backward compatibility for single files */}
              {activeUnit?.pdfPath && (
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-red-200 transition group">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800">Study Guide (PDF)</span>
                    <span className="text-xs text-slate-500">Legacy attachment</span>
                  </div>
                  <a
                    href={`${API_BASE.replace("/api", "")}/${activeUnit.pdfPath}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-600 hover:text-white transition"
                  >
                    <span className="text-lg">📄</span> View PDF
                  </a>
                </div>
              )}
              {activeUnit?.wordPath && (
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-blue-200 transition group">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800">Study Guide (Word)</span>
                    <span className="text-xs text-slate-500">Legacy attachment</span>
                  </div>
                  <a
                    href={`${API_BASE.replace("/api", "")}/${activeUnit.wordPath}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-600 hover:text-white transition"
                  >
                    <span className="text-lg">📝</span> View Word
                  </a>
                </div>
              )}
              
              {/* New multi-file support */}
              {activeUnit?.files?.map((file) => (
                <div key={file.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition group">
                  <div className="flex flex-col flex-1">
                    <span className="font-bold text-slate-800">{file.name}</span>
                    {file.description && (
                      <span className="text-xs text-slate-500">{file.description}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`${API_BASE.replace("/api", "")}/${file.path}`}
                      target="_blank"
                      rel="noreferrer"
                      title={file.name}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition shadow-sm ${
                        file.type === "pdf" 
                          ? "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white" 
                          : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"
                      }`}
                    >
                      <span className="text-lg">{file.type === "pdf" ? "📄" : "📝"}</span>
                      <span className="text-sm">View {file.type === "pdf" ? "PDF" : "Word"}</span>
                    </a>
                    {isAdmin && (
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Remove file"
                      >
                        <span className="text-xl leading-none">×</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {activeUnit?.notes && (
            <div className="text-slate-700 whitespace-pre-wrap leading-relaxed border-t border-cyan-100 pt-4 mt-2">
              {activeUnit.notes}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 p-5 bg-slate-50 border border-dotted border-slate-300 rounded-2xl text-center text-slate-500">
          <p>No notes or files uploaded for this unit.</p>
          {isAdmin && (
            <button
              onClick={() => setIsFileFormOpen(true)}
              className="mt-3 inline-block bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 transition shadow-sm"
            >
              Upload Study Notes
            </button>
          )}
        </div>
      )}

      {/* Programs Section */}
      <div className="grid gap-4 mt-8">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
          Programs
        </h3>

        {loadingPrograms ? <p className="text-slate-600">Loading programs...</p> : null}

        {!loadingPrograms && programs.length === 0 ? (
          <p className="text-slate-600">No programs available for this unit.</p>
        ) : null}

        {programs.map((program) => (
          <article key={program.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex justify-between items-start gap-4">
              <h3 className="text-lg font-semibold text-slate-800">Q. {program.question}</h3>
              <button
                onClick={() =>
                  navigate(
                    `/languages/${encodeURIComponent(activeLanguageId)}/units/${encodeURIComponent(
                      activeUnitId
                    )}/programs/${encodeURIComponent(program.id)}/terminal`
                  )
                }
                className="shrink-0 bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition"
              >
                Run Terminal
              </button>
            </div>

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
          </article>
        ))}
      </div>
    </div>
  );
};

export default UnitDetails;
