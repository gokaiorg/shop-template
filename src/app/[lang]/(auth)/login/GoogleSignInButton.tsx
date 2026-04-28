"use client";

import { signIn } from "next-auth/react";

export function GoogleSignInButton() {
    const handleGoogleLogin = () => {
        signIn("google", { callbackUrl: "/" });
    };

    return (
        <button
            onClick={handleGoogleLogin}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
        >
            Sign in with Google
        </button>
    );
}
