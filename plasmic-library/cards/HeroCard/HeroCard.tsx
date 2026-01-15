import * as React from "react";
import { Card, CardHeader, CardBody, CardFooter, Image, Button } from "@heroui/react";
import type { HTMLElementRefOf } from "@plasmicapp/react-web";
import clsx from "clsx";
import styles from "./HeroCard.module.css";

export interface HeroCardProps {
  title: string;
  imageUrl: string;
  buttonText: string;
  className?: string;
  showHeader?: boolean;
  headerTitle?: string;
  headerSubtitle?: string;
  headerDescription?: string;
}

function HeroCard_(props: HeroCardProps, ref: HTMLElementRefOf<"div">) {
  const { 
    title, 
    imageUrl, 
    buttonText, 
    className, 
    showHeader = true, 
    headerTitle = "Frontend Radio",
    headerSubtitle = "Daily Mix",
    headerDescription = "12 Tracks"
  } = props;

  return (
    <Card isFooterBlurred className={clsx("border-none", className)} radius="lg" ref={ref}>
      {showHeader && (
        <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
          <p className="text-tiny uppercase font-bold">{headerSubtitle}</p>
          <small className="text-default-500">{headerDescription}</small>
          <h4 className="font-bold text-large">{headerTitle}</h4>
        </CardHeader>
      )}
      <CardBody className="p-0">
        <Image
          alt={title}
          className={styles.heroImage} 
          src={imageUrl}
        />
      </CardBody>
      <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
        <p className="text-tiny text-white/80">{title}</p>
        <Button
          className="text-tiny text-white bg-black/20"
          color="default"
          radius="lg"
          size="sm"
          variant="flat"
        >
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
}

const HeroCard = React.forwardRef(HeroCard_);
export default HeroCard;
