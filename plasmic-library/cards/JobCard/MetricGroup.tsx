import * as React from "react";
import { JobMetric } from "./types";
import Image from 'next/image';

interface MetricGroupProps {
  metrics: JobMetric[];
}

export function MetricGroup({ metrics }: MetricGroupProps) {
  return (
    <div
      className="flex gap-2 items-center h-full text-xs whitespace-nowrap text-neutral-400"
      role="list"
    >
      <div className="flex gap-1 items-center self-stretch my-auto">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="flex gap-0.5 items-center self-stretch my-auto w-6 min-h-[13px]"
            role="listitem"
          >
            <Image
              src={metric.icon}
              alt={metric.label}
              width={10}
              height={10}
              className="object-contain shrink-0 self-stretch my-auto w-2.5 aspect-square"
            />
            <div className="self-stretch my-auto">{metric.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}