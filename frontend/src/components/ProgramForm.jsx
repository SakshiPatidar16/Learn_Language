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
  );
};

export default ProgramForm;
