import * as React from "react";
import { useEffect } from "react";
import type { HTMLElementRefOf } from "@plasmicapp/react-web";

export interface PageLoaderProps {
  shouldRun?: boolean;
  onMount?: () => void;
  className?: string;
}

function PageLoader_(props: PageLoaderProps, ref: HTMLElementRefOf<"div">) {
  const { shouldRun = true, onMount } = props;

  useEffect(() => {
    if (shouldRun && onMount) {
      onMount();
    }
  }, [shouldRun, onMount]);

  return null;
}

const PageLoader = React.forwardRef(PageLoader_);
export default PageLoader;
