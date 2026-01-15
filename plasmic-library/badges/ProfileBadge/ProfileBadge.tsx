import * as React from "react";
import type { HTMLElementRefOf } from "@plasmicapp/react-web";
import { Badge, Avatar } from "@heroui/react";
import styles from "./ProfileBadge.module.css";

export interface ProfileBadgeProps {
  name: string; // Nom affiché
  className?: string;
  badgeContent?: string; // Contenu du badge (ex: "5")
  badgeColor?: "primary" | "success" | "warning" | "danger"; // Couleur du badge
  avatarUrl?: string; // URL de l'avatar
  avatarRadius?: "none" | "sm" | "md" | "lg" | "full"; // Forme de l’avatar
}

function ProfileBadge_(props: ProfileBadgeProps, ref: HTMLElementRefOf<"div">) {
  const {
    className,
    name,
    badgeContent = "1", // Valeur par défaut du badge
    badgeColor = "danger",
    avatarUrl = "https://i.pravatar.cc/150",
    avatarRadius = "full",
  } = props;

  return (
    <div className={`${styles.profileBadge} ${className}`} ref={ref}>
      {/* Badge + Avatar */}
      <Badge color={badgeColor} content={badgeContent} shape="circle">
        <Avatar isBordered radius={avatarRadius} src={avatarUrl} />
      </Badge>

      {/* Nom / Texte */}
      <div className={styles.text}>{name}</div>
    </div>
  );
}

const ProfileBadge = React.forwardRef(ProfileBadge_);
export default ProfileBadge;
