"use client";

/**
 * Dronacharya v3 — Auth context backed by InsForge Auth.
 * Exposes a small, stable surface ({ isLoaded, isSignedIn, user }) shared by
 * every page that needs identity.
 */
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { insforge } from "@/lib/insforge";

export interface AppUser {
    id: string;
    email: string;
    /** Full display name as stored in the InsForge profile ("name"). */
    name: string;
    firstName: string;
    lastName: string;
    imageUrl: string | null;
    raw: Record<string, unknown> | null;
}

interface AuthContextValue {
    isLoaded: boolean;
    isSignedIn: boolean;
    user: AppUser | null;
}

const AuthContext = createContext<AuthContextValue>({
    isLoaded: false,
    isSignedIn: false,
    user: null,
});

function splitName(name: string): { firstName: string; lastName: string } {
    const trimmed = (name || "").trim();
    if (!trimmed) return { firstName: "", lastName: "" };
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0], lastName: "" };
    return {
        firstName: parts[0],
        lastName: parts.slice(1).join(" "),
    };
}

function mapUser(rawUser: unknown): AppUser | null {
    if (!rawUser || typeof rawUser !== "object") return null;
    const u = rawUser as Record<string, unknown>;
    const profile = (u.profile && typeof u.profile === "object"
        ? u.profile
        : {}) as Record<string, unknown>;

    const id = String(u.id ?? profile.id ?? "");
    const email = String(u.email ?? profile.email ?? "");
    const name = String(profile.name ?? u.name ?? "").trim();
    const avatar =
        (profile.avatar_url as string | undefined) ??
        (u.avatar_url as string | undefined) ??
        null;
    const { firstName, lastName } = splitName(name);

    return { id, email, name, firstName, lastName, imageUrl: avatar, raw: u };
}

export function InsForgeAuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Rehydrate session on mount and whenever the SDK reports a state change
    // (sign-in, sign-out, OAuth code exchange, token refresh).
    useEffect(() => {
        let cancelled = false;

        async function hydrate() {
            try {
                const { data } = await insforge.auth.getCurrentUser();
                if (!cancelled) setUser(mapUser(data?.user));
            } catch {
                if (!cancelled) setUser(null);
            } finally {
                if (!cancelled) setIsLoaded(true);
            }
        }

        void hydrate();

        const unsubscribe = insforge.auth.onAuthStateChange(() => {
            void hydrate();
        });

        return () => {
            cancelled = true;
            unsubscribe?.();
        };
    }, []);

    const value = useMemo(
        () => ({
            isLoaded,
            isSignedIn: Boolean(user?.id),
            user,
        }),
        [isLoaded, user],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

/** Accessor for the current InsForge-authenticated user. */
export function useUser() {
    return useContext(AuthContext);
}
