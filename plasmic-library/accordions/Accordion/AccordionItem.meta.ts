import { ComponentMeta } from "@plasmicapp/host";

const AccordionItemMeta: ComponentMeta<any> = {
  name: "AccordionItem",
  displayName: "Accordion Item",
  description: "An item within the accordion.",
  importPath: "@/plasmic-library/accordions/Accordion/Accordion",
  importName: "AccordionItem",
  parentComponentName: "Accordion",
  props: {
    value: {
      type: "string",
      description: "A unique value for the accordion item.",
      defaultValue: "default-item"
    },
    children: {
      type: "slot",
      allowedComponents: ["AccordionTrigger", "AccordionContent"],
      defaultValue: [
        {
          type: "component",
          name: "AccordionTrigger",
          props: {
            children: { type: "text", value: "Item Trigger" }
          }
        },
        {
          type: "component",
          name: "AccordionContent",
          props: {
            children: { type: "text", value: "Item Content" }
          }
        }
      ]
    }
  }
};

export default AccordionItemMeta;
