import { cva } from "class-variance-authority";

export const inputVariant = cva([
    "flex",
    "w-full",
    "transition-all",
    "bg-white",
    "rounded-2xl",
    "items-center"
  ],
  {
    variants: {
      destructive: {
        true: "border-1 border-solid border-error-700",
        false: "border-1 border-solid border-pine-500",
      },
      focus: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        destructive: true,
        focus: true,
        className: "shadow-[0_0_0_4px_#D92D20]",
      },
      {
        destructive: false,
        focus: true,
        className: "border-1 border-solid border-pine-500"
      },
    ],
  }
);

const variants = {
  inputVariant,
};

export default variants;