import { ComponentMeta } from "@plasmicapp/host";

const AccordionContentMeta: ComponentMeta<any> = {
  name: "AccordionContent",
  displayName: "Accordion Content",
  description: "The content that is revealed when the accordion item is open.",
  importPath: "@/plasmic-library/accordions/Accordion/Accordion",
  importName: "AccordionContent",
  parentComponentName: "AccordionItem",
  props: {
    children: {
      type: "slot",
      defaultValue: { type: "text", value: "Accordion Content" }
    }
  }
};

export default AccordionContentMeta;
