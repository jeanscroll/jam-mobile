import { type ClassArray, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

const cn = (...inputs: ClassArray) => twMerge(clsx(inputs));

const fileSize = (size: number) => {
    const i = Math.floor(Math.log(size) / Math.log(1024));
    return (
        `${((size / 1024 ** i) * 1).toFixed(2)} ${["B", "KB", "MB", "GB", "TB"][i]}`
    );
}

export { cn, fileSize }