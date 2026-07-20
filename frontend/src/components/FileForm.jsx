import React, { useState } from "react";

const FileForm = ({
  onSubmit,
  onCancel
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file");
      return;
    }
    onSubmit(file, name, description);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
        <span className="text-xl">📄</span> Add Unit Document
      </h3>
      
      <div>
        <label className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-1 block">
          Document Name (e.g. Unit 1 Overview)
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter file display name"
          className="w-full border border-blue-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          required
        />
      </div>

      <div>
        <label className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-1 block">
          Description (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter file description"
          className="w-full border border-blue-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white h-20"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-1 block">
          Select File (PDF or Word)
        </label>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
          required
        />
      </div>

      <div className="flex gap-2 mt-2">
        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-md hover:bg-blue-700 transition active:scale-95"
        >
          Upload Document
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg font-bold hover:bg-slate-300 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default FileForm;
