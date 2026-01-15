import { ComponentMeta } from "@plasmicapp/host";

const AccordionTriggerMeta: ComponentMeta<any> = {
  name: "AccordionTrigger",
  displayName: "Accordion Trigger",
  description: "The trigger that toggles the accordion item's content.",
  importPath: "@/plasmic-library/accordions/Accordion/Accordion",
  importName: "AccordionTrigger",
  parentComponentName: "AccordionItem",
  props: {
    children: {
      type: "slot",
      defaultValue: { type: "text", value: "Accordion Trigger" }
    }
  }
};

export default AccordionTriggerMeta;
