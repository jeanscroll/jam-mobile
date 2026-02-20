import { type ClassArray, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Capacitor } from "@capacitor/core"

const cn = (...inputs: ClassArray) => twMerge(clsx(inputs));

const fileSize = (size: number) => {
    const i = Math.floor(Math.log(size) / Math.log(1024));
    return (
        `${((size / 1024 ** i) * 1).toFixed(2)} ${["B", "KB", "MB", "GB", "TB"][i]}`
    );
}

/**
 * Returns the API base URL. On native (Capacitor), API routes don't exist
 * locally so we must call the remote server.
 */
const getApiBaseUrl = () =>
    Capacitor.isNativePlatform()
        ? (process.env.NEXT_PUBLIC_API_BASE_URL || "https://job-around-me.com")
        : "";

export { cn, fileSize, getApiBaseUrl }