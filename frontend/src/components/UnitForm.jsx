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
    <form
      onSubmit={handleUnitSubmit}
      className="grid gap-3 mt-5 bg-slate-50 border border-slate-200 rounded-xl p-4"
    >
      <h3 className="text-lg font-semibold text-slate-800">
        {editingUnitId ? "Edit Unit" : "Add Unit"}
      </h3>
      <input
        type="text"
        value={unitNameInput}
        onChange={(e) => setUnitNameInput(e.target.value)}
        placeholder="Unit Name (e.g. Unit 1: Introduction)"
        className="border border-slate-300 rounded-lg p-3"
        required
      />
      <textarea
        value={unitNotesInput}
        onChange={(e) => setUnitNotesInput(e.target.value)}
        placeholder="Unit Description"
        className="border border-slate-300 rounded-lg p-3 min-h-36 font-sans text-sm"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold"
        >
          {editingUnitId ? "Update" : "Add"}
        </button>
        <button
          type="button"
          onClick={() => {
            clearUnitForm();
            setIsUnitFormOpen(false);
          }}
          className="bg-slate-200 text-slate-900 px-4 py-2 rounded-lg font-semibold"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default UnitForm;
