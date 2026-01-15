import * as React from "react";
import type { HTMLElementRefOf } from "@plasmicapp/react-web";
import styles from "./CardComplex.module.css";

export interface CardComplexProps {
  title: string;
  color: string;
  className?: string;
  section?: string;
  displayName?: string;
  description?: string;
  thumbnailUrl?: string;
  importPath: string;
}

function CardComplex_(props: CardComplexProps, ref: HTMLElementRefOf<"div">) {
  const { className, title, color } = props;

  return (
    <div className={`${styles.cardComplex} ${className}`} ref={ref}>
      <div className={styles.text} style={{ color }}>
        {title}
      </div>
    </div>
  );
}

const CardComplex = React.forwardRef(CardComplex_);
export default CardComplex;