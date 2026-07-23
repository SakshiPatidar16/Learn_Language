import React from "react";

const UnitForm = ({
  editingUnitId,
  unitNameInput,
  setUnitNameInput,
  unitNotesInput,
  setUnitNotesInput,
  handleUnitSubmit,
  clearUnitForm,
  setIsUnitFormOpen
}) => {
  return (
    <form onSubmit={handleUnitSubmit} className="grid gap-4">
      <input
        type="text"
        value={unitNameInput}
        onChange={(e) => setUnitNameInput(e.target.value)}
        placeholder="Unit Name (e.g. Unit 1: Introduction)"
        className="border border-slate-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-emerald-400"
        required
      />
      <textarea
        value={unitNotesInput}
        onChange={(e) => setUnitNotesInput(e.target.value)}
        placeholder="Unit Description"
        className="border border-slate-300 rounded-lg p-3 min-h-36 font-sans text-sm outline-none focus:ring-2 focus:ring-emerald-400"
      />
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-700 transition"
        >
          {editingUnitId ? "Update" : "Add"}
        </button>
        <button
          type="button"
          onClick={() => {
            clearUnitForm();
            setIsUnitFormOpen(false);
          }}
          className="bg-slate-200 text-slate-900 px-5 py-2.5 rounded-lg font-semibold hover:bg-slate-300 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default UnitForm;
