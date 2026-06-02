import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { StaticContentProvider } from "./contexts/StaticContentContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StudentApp from "./pages/StudentApp";
import TeacherApp from "./pages/TeacherApp";
import AdminApp from "./pages/AdminApp";

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "var(--primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth={2}
            strokeLinecap="round"
            style={{ width: 22, height: 22 }}
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="spinner" />
      </div>
    </div>
  );
}

function WaitingApproval() {
  const { user, logout } = useAuth();
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: "480px", textAlign: "center" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            background: "var(--warning-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            fontSize: "28px",
          }}
        >
          ⏳
        </div>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "12px",
          }}
        >
          Очікуємо підтвердження
        </h1>
        <p
          style={{
            fontSize: "15px",
            color: "var(--text-muted)",
            lineHeight: 1.7,
            marginBottom: "8px",
          }}
        >
          Привіт, <strong>{user?.full_name}</strong>! Твій акаунт створено і
          чекає підтвердження від адміністратора школи.
        </p>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            lineHeight: 1.7,
            marginBottom: "28px",
          }}
        >
          Після підтвердження тебе буде додано до класу і ти отримаєш повний
          доступ до платформи.
        </p>
        <div
          style={{
            background: "var(--surface-2)",
            borderRadius: "12px",
            padding: "16px 20px",
            marginBottom: "24px",
            textAlign: "left",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              marginBottom: "4px",
            }}
          >
            Твій логін
          </div>
          <div
            style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}
          >
            {user?.username}
          </div>
        </div>
        <button
          onClick={logout}
          className="btn btn-ghost"
          style={{ fontSize: "14px" }}
        >
          Вийти з акаунту
        </button>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;

  const home = user
    ? user.role === "admin"
      ? "/admin"
      : user.role === "teacher"
        ? "/teacher"
        : "/student"
    : "/login";

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={home} replace /> : <LoginPage />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to={home} replace /> : <RegisterPage />}
      />

      <Route
        path="/student"
        element={
          user?.role === "student" ? (
            user.approved ? (
              <StudentApp />
            ) : (
              <WaitingApproval />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/teacher"
        element={
          user?.role === "teacher" ? (
            user.approved ? (
              <TeacherApp />
            ) : (
              <WaitingApproval />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/admin"
        element={
          user?.role === "admin" ? (
            <AdminApp />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to={home} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StaticContentProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </StaticContentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
