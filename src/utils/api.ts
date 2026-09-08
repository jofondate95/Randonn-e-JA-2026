/**
 * Robust API Client with automatic retries for network drops and dev server reboots.
 */

export interface SafeFetchOptions extends RequestInit {
  retries?: number;
  delayMs?: number;
}

/**
 * Executes fetch with automatic retry on network errors (e.g., 'Failed to fetch', server restarting, ECONNREFUSED).
 */
export async function safeFetch(
  input: RequestInfo | URL,
  init?: SafeFetchOptions
): Promise<Response> {
  const retries = init?.retries ?? 2;
  const delayMs = init?.delayMs ?? 450;
  let attempt = 0;

  while (true) {
    try {
      const res = await fetch(input, init);
      return res;
    } catch (err: any) {
      attempt++;
      const isNetworkError =
        err?.name === 'TypeError' ||
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('NetworkError') ||
        err?.message?.includes('network') ||
        err?.message?.includes('Load failed');

      if (isNetworkError && attempt <= retries) {
        // Exponential backoff wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
        continue;
      }

      if (isNetworkError) {
        throw new Error(
          'La connexion au serveur a été momentanément interrompue. Veuillez vérifier votre réseau ou patienter quelques secondes.'
        );
      }

      throw err;
    }
  }
}

/**
 * Safely fetches JSON, checking content type and throwing clear errors for non-2xx or non-JSON responses.
 */
export async function fetchJson<T = any>(
  input: RequestInfo | URL,
  init?: SafeFetchOptions
): Promise<T> {
  const res = await safeFetch(input, init);
  const contentType = res.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    if (!res.ok) {
      throw new Error(`Erreur serveur (${res.status}). Veuillez réessayer.`);
    }
    throw new Error('Format de réponse serveur inattendu.');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `Erreur serveur (${res.status})`);
  }

  return data as T;
}
