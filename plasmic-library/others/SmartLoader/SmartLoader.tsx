import * as React from "react";
import { useEffect, useRef } from "react";
import type { HTMLElementRefOf } from "@plasmicapp/react-web";

export interface SmartLoaderProps {
  shouldRun?: boolean;
  condition1?: boolean;
  action1?: () => void;
  condition2?: boolean;
  action2?: () => void;
  condition3?: boolean;
  action3?: () => void;
  condition4?: boolean;
  action4?: () => void;
  condition5?: boolean;
  action5?: () => void;
  className?: string;
}

function SmartLoader_(props: SmartLoaderProps, ref: HTMLElementRefOf<"div">) {
  const {
    shouldRun = true,
    condition1,
    action1,
    condition2,
    action2,
    condition3,
    action3,
    condition4,
    action4,
    condition5,
    action5,
  } = props;

  const action1Ref = useRef(false);
  const action2Ref = useRef(false);
  const action3Ref = useRef(false);
  const action4Ref = useRef(false);
  const action5Ref = useRef(false);

  useEffect(() => {
    if (shouldRun && condition1 && !action1Ref.current && typeof action1 === "function") {
      action1();
      action1Ref.current = true; // Ensure action1 is only triggered once
    }
  }, [shouldRun, condition1, action1]);

  useEffect(() => {
    if (shouldRun && condition2 && !action2Ref.current && typeof action2 === "function") {
      action2();
      action2Ref.current = true; // Ensure action2 is only triggered once
    }
  }, [shouldRun, condition2, action2]);

  useEffect(() => {
    if (shouldRun && condition3 && !action3Ref.current && typeof action3 === "function") {
      action3();
      action3Ref.current = true; // Ensure action3 is only triggered once
    }
  }, [shouldRun, condition3, action3]);

  useEffect(() => {
    if (shouldRun && condition4 && !action4Ref.current && typeof action4 === "function") {
      action4();
      action4Ref.current = true; // Ensure action4 is only triggered once
    }
  }, [shouldRun, condition4, action4]);

  useEffect(() => {
    if (shouldRun && condition5 && !action5Ref.current && typeof action5 === "function") {
      action5();
      action5Ref.current = true; // Ensure action5 is only triggered once
    }
  }, [shouldRun, condition5, action5]);

  return null;
}

const SmartLoader = React.forwardRef(SmartLoader_);
export default SmartLoader;
