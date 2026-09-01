import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute, AdminRoute } from "./components/RouteGuards";
import { Login } from "./pages/Login";
import { TrocarSenha } from "./pages/TrocarSenha";
import { Dashboard } from "./pages/Dashboard";
import { PresencaConfirmar } from "./pages/PresencaConfirmar";
import { PresencaConfirmarRobotica } from "./pages/PresencaConfirmarRobotica";
import { Doacao } from "./pages/Doacao";
import { QuemSomos } from "./pages/QuemSomos";
import { FaleConosco } from "./pages/FaleConosco";
import { AdminDashboard } from "./pages/admin/AdminDashboard";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/doacao" element={<Doacao />} />
      <Route path="/quem-somos" element={<QuemSomos />} />
      <Route path="/fale-conosco" element={<FaleConosco />} />

      <Route element={<ProtectedRoute ignorarSenhaAlterada />}>
        <Route path="/trocar-senha" element={<TrocarSenha />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/presenca-confirmar" element={<PresencaConfirmar />} />
        <Route path="/presenca-confirmar-robotica" element={<PresencaConfirmarRobotica />} />

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
