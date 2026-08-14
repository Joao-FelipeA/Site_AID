import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";

/**
 * Exige login. Por padrao tambem exige que a senha padrao ja tenha sido
 * trocada (redireciona pra /trocar-senha); use `ignorarSenhaAlterada` na
 * propria rota de troca de senha pra evitar loop.
 */
export function ProtectedRoute({ ignorarSenhaAlterada = false }: { ignorarSenhaAlterada?: boolean }) {
  const { usuario, token } = useAuth();
  const location = useLocation();
  const destino = encodeURIComponent(location.pathname + location.search);

  if (!token || !usuario) {
    return <Navigate to={`/login?redirect=${destino}`} replace />;
  }

  if (!ignorarSenhaAlterada && !usuario.senhaAlterada) {
    return <Navigate to={`/trocar-senha?redirect=${destino}`} replace />;
  }

  return <Outlet />;
}

/** Use aninhado dentro de <ProtectedRoute>: so verifica e_admin. */
export function AdminRoute() {
  const { usuario } = useAuth();
  if (!usuario?.eAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
