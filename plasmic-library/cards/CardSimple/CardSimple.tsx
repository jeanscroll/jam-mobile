import * as React from "react";
import type { HTMLElementRefOf } from "@plasmicapp/react-web";
import styles from "./CardSimple.module.css";

export interface CardSimpleProps {
  title: string;
  color: string;
  className?: string;
  section?: string;
  displayName?: string;
  description?: string;
  thumbnailUrl?: string;
  importPath: string;
}

function CardSimple_(props: CardSimpleProps, ref: HTMLElementRefOf<"div">) {
  const { className, title, color } = props;

  return (
    <div className={`${styles.cardSimple} ${className}`} ref={ref}>
      <div className={styles.text} style={{ color }}>
        {title}
      </div>
    </div>
  );
}

const CardSimple = React.forwardRef(CardSimple_);
export  default CardSimple;