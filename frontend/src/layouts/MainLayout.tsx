import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";

export default function MainLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <Header
        session={session}
        onLogout={logout}
        onOpenSignIn={() => navigate("/login")}
        onOpenSignUp={() => navigate("/signup")}
      />
      <Outlet />
    </>
  );
}
