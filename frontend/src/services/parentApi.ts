import type { Parent, UpdateParentData } from "../types";
import { expectArray, requestJson } from "./apiClient";

interface BackendParent {
  id: number;
  name: string;
  phone: string;
}

export interface NewParentData {
  name: string;
  phone: string;
}

function mapParent(p: BackendParent): Parent {
  return { id: String(p.id), name: p.name, phone: p.phone };
}

export async function getParents(): Promise<Parent[]> {
  const rawParents = await requestJson<BackendParent[]>("/api/parents");
  return expectArray<BackendParent>(rawParents, "parents").map(mapParent);
}

export async function createParent(data: NewParentData): Promise<Parent> {
  const saved = await requestJson<BackendParent>("/api/parents", {
    method: "POST",
    body: { name: data.name, phone: data.phone },
  });
  return mapParent(saved);
}

export async function updateParent(
  parentId: string,
  data: UpdateParentData,
): Promise<Parent> {
  const saved = await requestJson<BackendParent>(`/api/parents/${parentId}`, {
    method: "PATCH",
    body: { name: data.name, phone: data.phone },
  });
  return mapParent(saved);
}

export async function deleteParent(parentId: string): Promise<void> {
  await requestJson<{ Ok: boolean }>(`/api/parents/${parentId}`, {
    method: "DELETE",
  });
}
