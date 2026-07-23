import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Modal from "../components/Modal";
import UnitDetails from "../components/UnitDetails";
import FileForm from "../components/FileForm";
import ProgramForm from "../components/ProgramForm";
import ToastContainer from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../hooks/useToast";
import { getLanguages } from "../api/languageApi";
import { getUnitsByLanguage, uploadUnitFile, removeUnitFile } from "../api/unitApi";
import { getProgramsByUnit, createProgram, updateProgram, deleteProgram } from "../api/programApi";
import { API_BASE } from "../constants";

export default function UnitProgramsPage() {
  const { languageId, unitId } = useParams();
  const { session, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const decodedLanguageId = decodeURIComponent(languageId);
  const decodedUnitId = decodeURIComponent(unitId);

  const [language, setLanguage] = useState(null);
  const [units, setUnits] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  const [isProgramFormOpen, setIsProgramFormOpen] = useState(false);
  const [isFileFormOpen, setIsFileFormOpen] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState("");
  const [questionInput, setQuestionInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [outputInput, setOutputInput] = useState("");

  const activeUnit = useMemo(
    () => units.find((u) => u.id === decodedUnitId) || null,
    [units, decodedUnitId]
  );

  function clearProgramForm() {
    setQuestionInput("");
    setCodeInput("");
    setOutputInput("");
    setEditingProgramId("");
  }

  const loadUnits = useCallback(async () => {
    try {
      const [langs, unitsData] = await Promise.all([
        getLanguages(session.token),
        getUnitsByLanguage(decodedLanguageId)
      ]);
      setLanguage(langs.find((l) => l.id === decodedLanguageId) || null);
      setUnits(unitsData);
    } catch (err) {
      addToast(err.message || "Failed to load data", "error");
    }
  }, [decodedLanguageId, session.token]);

  const loadPrograms = useCallback(async () => {
    setLoadingPrograms(true);
    try {
      const data = await getProgramsByUnit(decodedUnitId);
      setPrograms(data);
    } catch (err) {
      addToast(err.message || "Failed to load programs", "error");
    } finally {
      setLoadingPrograms(false);
    }
  }, [decodedUnitId]);

  useEffect(() => {
    loadUnits();
    loadPrograms();
  }, [loadUnits, loadPrograms]);

  async function handleProgramSubmit(e) {
    e.preventDefault();
    const isEdit = Boolean(editingProgramId);
    const payload = { question: questionInput, code: codeInput, output: outputInput };
    try {
      if (isEdit) {
        await updateProgram(editingProgramId, payload, session.token);
        addToast("Program updated successfully.");
      } else {
        await createProgram(decodedUnitId, payload, session.token);
        addToast("Program added successfully.");
      }
      clearProgramForm();
      setIsProgramFormOpen(false);
      await loadPrograms();
    } catch (err) {
      addToast(err.message || "Failed to save program", "error");
    }
  }

  async function handleProgramDelete(programId) {
    try {
      await deleteProgram(programId, session.token);
      addToast("Program deleted successfully.");
      await loadPrograms();
    } catch (err) {
      addToast(err.message || "Failed to delete program", "error");
    }
  }

  async function handleUnitFileUpload(file, name, description) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name || file.name);
    if (description) formData.append("description", description);
    try {
      await uploadUnitFile(decodedUnitId, formData, session.token);
      addToast("File uploaded successfully.");
      setIsFileFormOpen(false);
      await loadUnits();
    } catch (err) {
      addToast(err.message || "Failed to upload file", "error");
    }
  }

  async function handleRemoveFile(fileId) {
    try {
      await removeUnitFile(decodedUnitId, fileId, session.token);
      addToast("File removed successfully.");
      await loadUnits();
    } catch (err) {
      addToast(err.message || "Failed to remove file", "error");
    }
  }

  function startProgramEdit(program) {
    setIsProgramFormOpen(true);
    setEditingProgramId(program.id);
    setQuestionInput(program.question);
    setCodeInput(program.code);
    setOutputInput(program.output);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-emerald-50">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <section className="max-w-6xl mx-auto mt-5 px-4 md:px-6 pb-10">
        <UnitDetails
          activeUnit={activeUnit}
          activeLanguage={language}
          isAdmin={isAdmin}
          API_BASE={API_BASE}
          handleUnitFileUpload={handleUnitFileUpload}
          handleRemoveFile={handleRemoveFile}
          isProgramFormOpen={isProgramFormOpen}
          setIsProgramFormOpen={setIsProgramFormOpen}
          isFileFormOpen={isFileFormOpen}
          setIsFileFormOpen={setIsFileFormOpen}
          clearProgramForm={clearProgramForm}
          programs={programs}
          loadingPrograms={loadingPrograms}
          startProgramEdit={startProgramEdit}
          handleProgramDelete={handleProgramDelete}
          navigate={navigate}
          activeLanguageId={decodedLanguageId}
          activeUnitId={decodedUnitId}
        />

        {isAdmin && isFileFormOpen && (
          <Modal title="Add Unit Document" onClose={() => setIsFileFormOpen(false)}>
            <FileForm onSubmit={handleUnitFileUpload} onCancel={() => setIsFileFormOpen(false)} />
          </Modal>
        )}

        {isAdmin && isProgramFormOpen && (
          <Modal
            title={editingProgramId ? "Edit Program" : "Add Program"}
            onClose={() => { clearProgramForm(); setIsProgramFormOpen(false); }}
          >
            <ProgramForm
              editingProgramId={editingProgramId}
              questionInput={questionInput}
              setQuestionInput={setQuestionInput}
              codeInput={codeInput}
              setCodeInput={setCodeInput}
              outputInput={outputInput}
              setOutputInput={setOutputInput}
              handleProgramSubmit={handleProgramSubmit}
              clearProgramForm={clearProgramForm}
              setIsProgramFormOpen={setIsProgramFormOpen}
            />
          </Modal>
        )}
      </section>
    </main>
  );
}
