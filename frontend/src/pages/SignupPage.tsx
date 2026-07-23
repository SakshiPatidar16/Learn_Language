import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Register from "../components/Register";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await signup({ name, email, phone, password });
      setMessage("Signup successful. Please sign in now.");
      navigate("/login");
    } catch (err) {
      setError(err.message || "Signup failed");
    }
  }

  return (
    <Register
      name={name}
      email={email}
      phone={phone}
      password={password}
      confirmPassword={confirmPassword}
      error={error}
      message={message}
      onNameChange={setName}
      onEmailChange={setEmail}
      onPhoneChange={setPhone}
      onPasswordChange={setPassword}
      onConfirmPasswordChange={setConfirmPassword}
      onSubmit={handleSubmit}
      onCancel={() => navigate("/")}
    />
  );
}
