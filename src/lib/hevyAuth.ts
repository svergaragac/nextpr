export const HEVY_KEY_STORAGE_KEY = 'nextpr_hevy_api_key';

export const getStoredHevyApiKey = (): string | null => localStorage.getItem(HEVY_KEY_STORAGE_KEY);

export const setStoredHevyApiKey = (key: string): void => {
  localStorage.setItem(HEVY_KEY_STORAGE_KEY, key);
};

export const clearStoredHevyApiKey = (): void => {
  localStorage.removeItem(HEVY_KEY_STORAGE_KEY);
};

export interface ValidateHevyResult {
  ok: boolean;
  message: string;
}

export async function validateHevyApiKey(apiKey: string): Promise<ValidateHevyResult> {
  const response = await fetch('/api/hevy/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey }),
  });

  const data = await response.json().catch(() => ({} as any));

  if (response.ok && data.valid) {
    return { ok: true, message: '' };
  }
  return { ok: false, message: data.message || 'No se pudo validar la API Key de Hevy.' };
}
