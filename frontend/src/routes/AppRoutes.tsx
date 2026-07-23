import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import LanguageDetailsPage from "../pages/LanguageDetailsPage";
import UnitProgramsPage from "../pages/UnitProgramsPage";
import TerminalPage from "../pages/TerminalPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route
          path="/languages/:languageId"
          element={
            <ProtectedRoute>
              <LanguageDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/languages/:languageId/units/:unitId"
          element={
            <ProtectedRoute>
              <UnitProgramsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/languages/:languageId/units/:unitId/programs/:programId/terminal"
          element={
            <ProtectedRoute>
              <TerminalPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
