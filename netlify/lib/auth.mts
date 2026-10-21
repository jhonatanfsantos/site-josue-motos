import { getUser, refreshSession, type User } from "@netlify/identity";

export const ROLE_DONO = "admin";

// Renova o token se estiver perto de expirar e retorna o usuário logado (ou null)
export async function usuarioAtual(): Promise<User | null> {
  try {
    await refreshSession();
  } catch {
    // Sem sessão válida para renovar: getUser() decide abaixo
  }
  return getUser();
}

export function isDono(user: User | null): boolean {
  return !!user?.roles?.includes(ROLE_DONO);
}
