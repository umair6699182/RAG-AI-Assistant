import { supabase } from "@/lib/supabaseClient";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ApiDocument {
  id: string;
  document_id: string;
  name: string;
  file_name?: string;
  storage_path: string;
  file_size?: number;
  total_chunks?: number;
  status?: "pending" | "processing" | "completed" | "failed";
  error_message?: string | null;
  created_at?: string;
}

export interface ChatSource {
  document_id?: string;
  filename?: string;
  page_number?: number;
  chunk_index?: number;
  chunk_preview?: string;
  score?: number;
  file_id?: string;
  metadata?: {
    chunk_index?: number;
    file_name?: string;
    page_number?: number;
    retrieval_type?: string;
    score?: number;
  };
}

export interface ChatHistoryMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  created_at?: string;
}

interface ChatStreamBody {
  message: string;
  document_id: string;
  conversation_id?: string;
  match_count?: number;
  strict_grounded_mode?: boolean;
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("You must be signed in to continue.");
  }

  return token;
}

async function request(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);

  headers.set("Authorization", `Bearer ${token}`);

  if (typeof init.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response;
}

async function getErrorMessage(response: Response) {
  try {
    const data = await response.json();
    const detail = data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (detail?.message) {
      return detail.message;
    }
  } catch {
    // Fall through to the status text.
  }

  return response.statusText || "Request failed.";
}

export async function listDocuments() {
  const response = await request("/documents");
  return response.json() as Promise<{ documents: ApiDocument[] }>;
}

export async function processDocument(
  storagePath: string,
  fileSize: number,
  fileName: string,
) {
  const response = await request("/process-document", {
    method: "POST",
    body: JSON.stringify({
      storage_path: storagePath,
      file_size: fileSize,
      file_name: fileName,
    }),
  });

  return response.json() as Promise<ApiDocument>;
}

export async function getDocumentMessages(documentId: string) {
  const response = await request(`/documents/${documentId}/messages`);

  return response.json() as Promise<{
    conversation_id: string | null;
    messages: ChatHistoryMessage[];
  }>;
}

export async function deleteConversation(
  documentId: string,
  conversationId: string,
) {
  const response = await request(
    `/documents/${documentId}/conversations/${conversationId}`,
    {
      method: "DELETE",
    },
  );

  return response.json();
}

export async function deleteDocument(documentId: string) {
  const response = await request(`/documents/${documentId}`, {
    method: "DELETE",
  });

  return response.json();
}

export async function streamChat(body: ChatStreamBody) {
  return request("/chat/stream", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function uploadPDF(formData: FormData) {
  const response = await request("/upload", {
    method: "POST",
    body: formData,
  });

  return response.json();
}

export async function askQuestion(
  message: string,
  documentId: string,
  conversationId?: string,
) {
  const response = await request("/chat", {
    method: "POST",
    body: JSON.stringify({
      message,
      document_id: documentId,
      conversation_id: conversationId,
      strict_grounded_mode: true,
    }),
  });

  return response.json();
}
