import type { BurialDetailsResponse, BurialSummary, ClusterGroup } from "./types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:8000";

async function unwrapResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Ошибка запроса");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function uploadBurial(payload: {
  file: File;
  name: string;
  shortName: string;
}) {
  const formData = new FormData();
  formData.append("file", payload.file);

  const searchParams = new URLSearchParams({
    name: payload.name,
    short_name: payload.shortName,
  });

  const response = await fetch(`${API_BASE_URL}/burial/upload?${searchParams.toString()}`, {
    method: "POST",
    body: formData,
  });

  await unwrapResponse<void>(response);
}

export async function getClusters(clusterCount: number) {
  const searchParams = new URLSearchParams({
    cluster_num: String(clusterCount),
  });

  const response = await fetch(`${API_BASE_URL}/cluster/clusters?${searchParams.toString()}`);
  return unwrapResponse<ClusterGroup[]>(response);
}

export async function getBurial(shortName: string) {
  const response = await fetch(`${API_BASE_URL}/burial/${encodeURIComponent(shortName)}`);
  return unwrapResponse<BurialDetailsResponse>(response);
}

export async function getAllBurials() {
  const response = await fetch(`${API_BASE_URL}/burial/all`);
  return unwrapResponse<BurialSummary[]>(response);
}

export { API_BASE_URL };
