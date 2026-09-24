import type { Parent } from "../types";

interface BackendParent {
  id: number;
  name: string;
  phone: string;
}

export interface NewParentData {
  name: string;
  phone: string;
} 

export async function getParents(): Promise<Parent[]> {
  const response = await fetch("http://localhost:8000/api/parents");
  if (!response.ok) {
    throw new Error("Failed to fetch parents from the database");
  }
  const rawParents: BackendParent[] = await response.json();
  return rawParents.map((p) => ({
    id: String(p.id),
    name: p.name,
    phone: p.phone,
  }));
}

export async function createParent(data: NewParentData): Promise<Parent> {
  const response = await fetch("http://localhost:8000/api/parents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: data.name, phone: data.phone }),
  });
  if (!response.ok) {
    throw new Error(`Failed to create parent: ${response.statusText}`);
  }
  const saved: BackendParent = await response.json();
  return {
    id: String(saved.id),
    name: saved.name,
    phone: saved.phone,
  };
}

export async function deleteParent(parentId: string): Promise<void> {
  const response = await fetch(
    `http://localhost:8000/api/parents/${parentId}`,
    {
      method: "DELETE",
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to delete parent: ${response.statusText}`);
  }
}
