import type React from "react";
import { type ButtonHTMLAttributes, forwardRef, useImperativeHandle, useRef, } from "react"
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import { createClient } from '@/utils/supabase/components'
import { presets } from "@/styles/presets";
import Image from "next/image";

type HTMLButtonProps = Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "onClick" | "disabled"
>;

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
    authProvider?: "apple" | "none";
}

export interface ButtonActions {
    click(): void;
}

const supabase = createClient();

const ButtonApple = forwardRef<ButtonActions, ButtonProps>(
    (
        {
            label = "Sign in with Apple",
            icon = "none",
            destructive = false,
            hierarchy = "primary",
            size = "large",
            state = "default",
            disabled,
            onClick,
            iconImage = "/apple-icon.svg", // Path to the Apple icon
            className,
            authProvider = "apple",
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
                    if (authProvider === "apple") {
                        event.preventDefault();
                        try {
                        const { data, error } = await supabase.auth.signInWithOAuth({
                            provider: "apple",
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
                        false: "bg-black text-white",
                    },
                    hierarchy: {
                        primary: "bg-black text-white",
                        secondary: "bg-gray-300 text-black",
                    },
                    size: {
                        small: "py-2 px-4 text-sm",
                        large: "py-3 px-6 text-lg",
                    },
                    state: {
                        default: "",
                        hover: "hover:opacity-90",
                        focused: "focus:ring-2 focus:ring-black",
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
                type="button"
                ref={buttonRef}
                onClick={handleClick}
                disabled={disabled}
                className={cn(variants({ destructive, hierarchy, size, state }), className)}
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

ButtonApple.displayName = "ButtonApple";
export default ButtonApple;