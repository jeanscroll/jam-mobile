import React, { useState } from 'react';
import styles from './Notation.module.css';

interface NotationProps {
  value: number;
  className?: string;
  onChange?: (value: number) => void;
  enableHover?: boolean;
}

export const Notation: React.FC<NotationProps> = ({ value, className, onChange, enableHover = true }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const level = Number(value) || 0;

  return (
    <div className={`${styles.rating} ${className || ''}`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = (enableHover && hovered !== null) ? i < hovered : i < level;
        return (
          <span
            key={i}
            className={filled ? styles.starFilled : styles.starEmpty}
            style={{
              width: '20px',
              height: '20px',
              display: 'inline-block',
              cursor: onChange ? 'pointer' : 'default',
            }}
            onClick={() => onChange && onChange(i + 1)}
            onMouseEnter={() => enableHover && setHovered(i + 1)}
            onMouseLeave={() => enableHover && setHovered(null)}
          >
            ★
          </span>
        );
      })}
    </div>
  );
};

export default Notation; 