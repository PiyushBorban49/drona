/**
 * Dronacharya v3 — InsForge client (browser)
 *
 * Single SDK instance shared by every Client Component, plus helpers to
 * obtain the access token for calls to the FastAPI backend (which validates
 * tokens against InsForge Auth via token introspection).
 */
import { createClient } from "@insforge/sdk";

const baseUrl =
    process.env.NEXT_PUBLIC_INSFORGE_URL || "https://sxswykm5.us-east.insforge.app";
const anonKey =
    process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY ||
    "anon_2d42639001b8d84a97b2a28c192b13f653553e2c37d5594f8241e66f61667ef8";

export const INSFORGE_URL = baseUrl;

export const insforge = createClient({ baseUrl, anonKey });

type TokenManagerLike = { getAccessToken?: () => string | null };

/**
 * Current access token issued by InsForge Auth.
 * On a cold page load the in-memory store is empty; calling getCurrentUser()
 * rehydrates the session through the httpOnly refresh cookie and populates it.
 */
export async function getAccessToken(): Promise<string | null> {
    const tm = (insforge as unknown as { tokenManager?: TokenManagerLike })
        .tokenManager;
    let token = tm?.getAccessToken?.() ?? null;

    if (!token) {
        try {
            await insforge.auth.getCurrentUser(); // triggers cookie refresh
        } catch {
            /* not signed in / unreachable — fall through */
        }
        token = tm?.getAccessToken?.() ?? null;
    }

    return token;
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
    const token = await getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}
