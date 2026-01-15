import * as React from "react";
import { JobTag } from "./types";
import Image from "next/image";

interface TagGroupProps {
  tags: JobTag[];
}

export function TagGroup({ tags }: TagGroupProps) {
  return (
    <div
      className="flex flex-wrap gap-1 items-start mt-4 max-w-full text-xs font-medium leading-5 text-center text-black"
      role="list"
    >
      {tags.map((tag, index) => (
        <div
          key={index}
          className="flex gap-1 justify-center items-center px-3 py-1 whitespace-nowrap rounded-2xl bg-zinc-100 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]"
          role="listitem"
        >
          <Image
            loading="lazy"
            src={tag.icon}
            alt=""
            width={12}
            height={12}
            className="object-contain shrink-0 self-stretch my-auto w-3 aspect-square"
            aria-hidden="true"
          />
          <div className="self-stretch my-auto">{tag.label}</div>
        </div>
      ))}
    </div>
  );
}