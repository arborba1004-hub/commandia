import type {
  AzideiaActiveMissionsResponse,
  AzideiaAttackResult,
  AzideiaClaimResult,
  AzideiaRewardStatus,
  AzideiaTargetsResponse,
} from "@/types/azideia";

const BACKEND_URL = "https://comando-backend.onrender.com";
const TIMEOUT_MS = 10_000;

function getToken(): string {
  const token = localStorage.getItem("authToken");
  if (!token?.trim()) throw new Error("Usuário não autenticado");
  return token.trim();
}

function buildUrl(path: string): string {
  const base = BACKEND_URL.replace(/\/+$/, "");
  const endpoint = path.startsWith("/") ? path : `/${path}`;
  return `${base}${endpoint}`;
}

// [PATCH] Aceita signal externo opcional. Se fornecido, usa ele diretamente
// (o caller controla o ciclo de vida). Caso contrário, cria timeout interno.
async function request<T>(
  endpoint: string,
  options: RequestInit & { externalSignal?: AbortSignal } = {},
): Promise<T> {
  const { externalSignal, ...fetchOptions } = options;

  let controller: AbortController | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let signal: AbortSignal;

  if (externalSignal) {
    // Usa o signal do caller — ele é responsável por cancelar
    signal = externalSignal;
  } else {
    // Cria timeout interno padrão
    controller = new AbortController();
    timeoutId = setTimeout(() => controller!.abort(), TIMEOUT_MS);
    signal = controller.signal;
  }

  try {
    const response = await fetch(buildUrl(endpoint), {
      ...fetchOptions,
      signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${getToken()}`,
        ...(fetchOptions.headers ?? {}),
      },
    });

    let data: unknown = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const message =
        (data as any)?.error ??
        (data as any)?.message ??
        `Erro ${response.status}: ${response.statusText}`;
      throw Object.assign(new Error(message), {
        status: response.status,
        data,
      });
    }

    return data as T;
  } finally {
    if (timeoutId !== null) clearTimeout(timeoutId);
  }
}

export async function getAzideiaTargets(): Promise<AzideiaTargetsResponse> {
  return request<AzideiaTargetsResponse>("/azideia/targets", { method: "GET" });
}

export async function getAzideiaX9Targets(): Promise<AzideiaTargetsResponse> {
  return getAzideiaTargets();
}

export async function attackAzideiaX9(
  targetId: string,
): Promise<AzideiaAttackResult> {
  return request<AzideiaAttackResult>(
    `/azideia/x9/${encodeURIComponent(targetId)}/attack`,
    { method: "POST" },
  );
}

export async function negotiateAzideiaCorreria(
  targetId: string,
): Promise<AzideiaAttackResult> {
  return request<AzideiaAttackResult>(
    `/azideia/correria/${encodeURIComponent(targetId)}/negotiate`,
    { method: "POST" },
  );
}

export async function payAzideiaMestreObras(
  targetId: string,
): Promise<AzideiaAttackResult> {
  return request<AzideiaAttackResult>(
    `/azideia/mestre-obras/${encodeURIComponent(targetId)}/pay`,
    { method: "POST" },
  );
}

export async function getActiveAzideiaMissions(): Promise<AzideiaActiveMissionsResponse> {
  return request<AzideiaActiveMissionsResponse>("/azideia/missions/active", {
    method: "GET",
  });
}

export async function confirmAzideiaMissionArrival(
  missionId: string,
): Promise<AzideiaAttackResult> {
  return request<AzideiaAttackResult>(
    `/azideia/missions/${encodeURIComponent(missionId)}/arrive`,
    { method: "POST" },
  );
}

export async function confirmAzideiaMissionReturn(
  missionId: string,
): Promise<AzideiaAttackResult> {
  return request<AzideiaAttackResult>(
    `/azideia/missions/${encodeURIComponent(missionId)}/return`,
    { method: "POST" },
  );
}

// [PATCH] Aceita AbortSignal externo para que o caller (modal) possa cancelar
// ao fechar, evitando o erro "signal is aborted without reason" na UI.
export async function getAzideiaRewardStatus(
  signal?: AbortSignal,
): Promise<AzideiaRewardStatus> {
  return request<AzideiaRewardStatus>("/azideia/rewards/me", {
    method: "GET",
    externalSignal: signal,
  });
}

export async function claimAzideiaRewards(): Promise<AzideiaClaimResult> {
  return request<AzideiaClaimResult>("/azideia/rewards/claim", {
    method: "POST",
  });
}
