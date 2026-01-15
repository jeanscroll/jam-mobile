import * as React from "react";
import Image from "next/image";

interface IconProps {
  src: string;
  alt: string;
}

function Icon({ src, alt }: IconProps) {
  return (
    <Image
      loading="lazy"
      src={src}
      className="object-contain shrink-0 my-auto w-5 aspect-square"
      alt={alt}
      width={20}
      height={20}
    />
  );
}

export default Icon;