import type React from "react";
import { type ButtonHTMLAttributes, forwardRef, useImperativeHandle, useRef } from "react";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import Image from "next/image";
import { createClient } from '@/utils/supabase/components'
import { presets } from "@/styles/presets";

type HTMLButtonProps = Pick<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "disabled">;

interface ButtonProps extends HTMLButtonProps {
    label?: string;
    icon?: "start" | "end" | "only" | "none";
    destructive?: boolean;
    hierarchy?: "primary" | "secondary";
    size?: "small" | "large";
    redirectTo?: string;
    state?: "default" | "hover" | "focused" | "disabled";
    iconImage?: string;
    className?: string;
    authProvider?: "google" | "none";
}

export interface ButtonActions {
    click(): void;
}

//const isPlasmicStudio = typeof window !== "undefined" && window.location.href.includes("plasmic.app");
const supabase = createClient();

const AuthButton = forwardRef<ButtonActions, ButtonProps>(
    (
        {
            label = "Button",
            icon = "none",
            destructive = false,
            hierarchy = "primary",
            size = "large",
            state = "default",
            disabled,
            onClick,
            iconImage,
            className,
            authProvider = "google",
            redirectTo = "/",
        },
        ref
    ) => {
        const buttonRef = useRef<HTMLButtonElement>(null);

        useImperativeHandle(ref, () => ({
            click() {
                buttonRef.current?.click();
            },
        }));

        const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
            if (authProvider === "google") {
                event.preventDefault();
                try {
                const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                    redirectTo,
                    },
                });

                if (error) {
                    console.error("Login error:", error.message);
                } else {
                    console.log("Login successful:", data);
                }
                } catch (err) {
                console.error("Unexpected error:", err);
                }
            } else if (onClick) {
                onClick(event);
            }
        };


        const variants = cva(
            "flex items-center justify-center gap-3 rounded transition-all outline-none group",
            {
                variants: {
                    destructive: {
                        true: "bg-red-500 text-white",
                        false: "bg-blue-500 text-white",
                    },
                    hierarchy: {
                        primary: "bg-blue-500 text-white",
                        secondary: "bg-gray-300 text-black",
                    },
                    size: {
                        small: "py-2 px-4 text-sm",
                        large: "py-3 px-6 text-lg",
                    },
                    state: {
                        default: "",
                        hover: "hover:opacity-90",
                        focused: "focus:ring-2 focus:ring-blue-500",
                        disabled: "opacity-50 cursor-not-allowed",
                    },
                },
                compoundVariants: [
                    {
                        destructive: true,
                        hierarchy: "primary",
                        className: "bg-red-500 text-white",
                    },
                    {
                        destructive: false,
                        hierarchy: "secondary",
                        className: "bg-gray-300 text-black",
                    },
                ],
            }
        );

        
        return (
            <button
                ref={buttonRef}
                onClick={handleClick}
                disabled={disabled}
                className={cn(variants({ destructive, hierarchy, size, state }), className)}
                type="button"
                style={presets.oAuthButton as React.CSSProperties}
            >
                {iconImage && (icon === "start" || icon === "end" || icon === "only") && (
                    <Image src={iconImage} alt="Icon" width={20} height={20} />
                )}
                {icon !== "only" && <span>{label}</span>}
            </button>
        );
    }
);

AuthButton.displayName = "AuthButton";
export default AuthButton;
