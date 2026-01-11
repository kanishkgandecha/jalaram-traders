/**
 * Google Sign-In Button
 * ======================
 * Uses Google Identity Services for OAuth login
 * Only available for retailer users
 */

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

// Google Identity Services types
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (response: { credential: string }) => void;
                        auto_select?: boolean;
                    }) => void;
                    renderButton: (
                        element: HTMLElement,
                        options: {
                            type?: 'standard' | 'icon';
                            theme?: 'outline' | 'filled_blue' | 'filled_black';
                            size?: 'large' | 'medium' | 'small';
                            text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
                            shape?: 'rectangular' | 'pill' | 'circle' | 'square';
                            width?: number;
                        }
                    ) => void;
                    prompt: () => void;
                };
            };
        };
    }
}

interface GoogleSignInButtonProps {
    onSuccess: (idToken: string) => Promise<void>;
    onError?: (error: string) => void;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function GoogleSignInButton({ onSuccess, onError }: GoogleSignInButtonProps) {
    const buttonRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    useEffect(() => {
        // Check if script is already loaded
        if (window.google?.accounts?.id) {
            setScriptLoaded(true);
            return;
        }

        // Load Google Identity Services script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => setScriptLoaded(true);
        script.onerror = () => {
            onError?.('Failed to load Google Sign-In');
        };
        document.body.appendChild(script);

        return () => {
            // Cleanup if needed
        };
    }, [onError]);

    useEffect(() => {
        if (!scriptLoaded || !buttonRef.current || !GOOGLE_CLIENT_ID) {
            return;
        }

        try {
            window.google?.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: async (response) => {
                    if (response.credential) {
                        setLoading(true);
                        try {
                            await onSuccess(response.credential);
                        } catch (error: any) {
                            onError?.(error.message || 'Google sign-in failed');
                        } finally {
                            setLoading(false);
                        }
                    }
                },
            });

            window.google?.accounts.id.renderButton(buttonRef.current, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                shape: 'rectangular',
                width: 320,
            });
        } catch (error) {
            console.error('Error initializing Google Sign-In:', error);
            onError?.('Failed to initialize Google Sign-In');
        }
    }, [scriptLoaded, onSuccess, onError]);

    if (!GOOGLE_CLIENT_ID) {
        // Don't show the button if client ID is not configured
        return null;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg bg-gray-50">
                <Loader2 className="animate-spin text-gray-600 mr-2" size={20} />
                <span className="text-gray-600">Signing in with Google...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center">
            <div ref={buttonRef} className="google-signin-button" />
            <p className="text-xs text-gray-500 mt-2">
                For retailers only. Quick sign-in without password.
            </p>
        </div>
    );
}

export default GoogleSignInButton;
