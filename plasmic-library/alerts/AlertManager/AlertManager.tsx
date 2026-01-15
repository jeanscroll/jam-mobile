import React, { useState, useEffect } from "react";
import styles from "./AlertManager.module.css";

export type AlertType = "success" | "error" | "warning" | "info";

export interface AlertMessage {
  id: string;
  type: AlertType;
  message: string;
  details?: string;
  autoClose?: boolean;
  duration?: number;
}

export interface AlertManagerProps {
  alerts: AlertMessage[];
  position?: "top" | "bottom" | "inline";
  onClose?: (id: string) => void;
  maxAlerts?: number;
  className?: string;
}

const AlertManager: React.FC<AlertManagerProps> = ({
  alerts,
  position = "top",
  onClose,
  maxAlerts = 3,
  className = "",
}) => {
  const [visibleAlerts, setVisibleAlerts] = useState<AlertMessage[]>([]);

  useEffect(() => {
    // Limiter le nombre d'alertes affichées en même temps
    setVisibleAlerts(alerts.slice(0, maxAlerts));
  }, [alerts, maxAlerts]);

  useEffect(() => {
    // Configurer les timers pour fermer automatiquement les alertes
    visibleAlerts.forEach((alert) => {
      if (alert.autoClose !== false) {
        const timer = setTimeout(() => {
          handleCloseAlert(alert.id);
        }, alert.duration || 5000);

        return () => clearTimeout(timer);
      }
    });
  }, [visibleAlerts]);

  const handleCloseAlert = (id: string) => {
    if (onClose) {
      onClose(id);
    }
  };

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case "success":
        return (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M22 4 12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case "error":
        return (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case "warning":
        return (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case "info":
      default:
        return (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
    }
  };

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.alertContainer} ${styles[`position-${position}`]} ${className}`}>
      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`${styles.alert} ${styles[`alert-${alert.type}`]}`}
          role="alert"
          aria-live="assertive"
        >
          <div className={styles.alertContent}>
            {getAlertIcon(alert.type)}
            <div className={styles.alertMessage}>
              <div className={styles.messageText}>{alert.message}</div>
              {alert.details && <div className={styles.messageDetails}>{alert.details}</div>}
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => handleCloseAlert(alert.id)}
            aria-label="Fermer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default AlertManager; 