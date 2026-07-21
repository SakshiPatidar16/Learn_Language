import React from "react";

const ProgramForm = ({
  editingProgramId,
  questionInput,
  setQuestionInput,
  codeInput,
  setCodeInput,
  outputInput,
  setOutputInput,
  handleProgramSubmit,
  clearProgramForm,
  setIsProgramFormOpen
}) => {
  return (
    <form onSubmit={handleProgramSubmit} className="grid gap-4">
      <input
        type="text"
        value={questionInput}
        onChange={(e) => setQuestionInput(e.target.value)}
        placeholder="Question"
        className="border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-emerald-400"
        required
      />
      <textarea
        value={codeInput}
        onChange={(e) => setCodeInput(e.target.value)}
        placeholder="Code"
        className="border border-slate-300 rounded-lg p-3 min-h-40 font-mono text-sm outline-none focus:ring-2 focus:ring-emerald-400"
        required
      />
      <textarea
        value={outputInput}
        onChange={(e) => setOutputInput(e.target.value)}
        placeholder="Output"
        className="border border-slate-300 rounded-lg p-3 min-h-24 font-mono text-sm outline-none focus:ring-2 focus:ring-emerald-400"
        required
      />
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-700 transition"
        >
          {editingProgramId ? "Update" : "Add"}
        </button>
        <button
          type="button"
          onClick={() => {
            clearProgramForm();
            setIsProgramFormOpen(false);
          }}
          className="bg-slate-200 text-slate-900 px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-300 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ProgramForm;
