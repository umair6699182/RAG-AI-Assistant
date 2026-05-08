const API_URL = "http://localhost:8000";

export async function uploadPDF(
  formData: FormData
) {
  const response = await fetch(
    `${API_URL}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  return response.json();
}

export async function askQuestion(
  question: string
) {
  const response = await fetch(
    `${API_URL}/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    }
  );

  return response.json();
}