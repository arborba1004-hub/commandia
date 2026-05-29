import type {
  AzideiaActiveMissionsResponse,
  AzideiaAttackResult,
  AzideiaClaimResult,
  AzideiaRewardStatus,
  AzideiaTargetsResponse,
} from "@/types/azideia";

const BACKEND_URL = "https://comando-backend.onrender.com";
const TIMEOUT_MS = 20_000;

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

function isAbortLike(error: unknown): boolean {
  if (!error) return false;
  if (error instanceof DOMException) {
    return error.name === "AbortError" || error.name === "TimeoutError";
  }
  const name = String((error as any)?.name ?? "").toLowerCase();
  const message = String((error as any)?.message ?? "").toLowerCase();
  return name.includes("abort") || message.includes("aborted") || message.includes("abort");
}

function createTimeoutError(): DOMException {
  return new DOMException(
    "Tempo esgotado ao comunicar com o Azidéia",
    "TimeoutError",
  );
}

// Aceita signal externo opcional. Quando não há signal externo, a API usa um
// timeout interno com motivo explícito para não vazar o erro cru do navegador
// "signal is aborted without reason" para a UI.
async function request<T>(
  endpoint: string,
  options: RequestInit & { externalSignal?: AbortSignal } = {},
): Promise<T> {
  const { externalSignal, ...fetchOptions } = options;

  const controller = externalSignal ? null : new AbortController();
  const signal = externalSignal ?? controller!.signal;
  let didTimeout = false;

  const timeoutId = controller
    ? window.setTimeout(() => {
        didTimeout = true;
        controller.abort(createTimeoutError());
      }, TIMEOUT_MS)
    : null;

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
  } catch (error) {
    if (didTimeout || (controller?.signal.aborted && isAbortLike(error))) {
      throw new Error("Tempo esgotado ao carregar dados do Azidéia. Tente novamente.");
    }
    if (externalSignal?.aborted && isAbortLike(error)) {
      throw new DOMException("Requisição cancelada", "AbortError");
    }
    throw error;
  } finally {
    if (timeoutId !== null) window.clearTimeout(timeoutId);
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
