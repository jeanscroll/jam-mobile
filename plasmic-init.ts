import * as PlasmicLibrary from "./plasmic-library/components"
import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";
import { tokens } from "./styles/tokens-jam";

import { 
  SupabaseProvider, SupabaseProviderMeta, SupabaseUserGlobalContext, SupabaseUserGlobalContextMeta,
  SupabaseUppyUploader, SupabaseUppyUploaderMeta, SupabaseStorageGetSignedUrl, SupabaseStorageGetSignedUrlMeta,
} from "plasmic-supabase"

// Loader plasmic
export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: process.env.NEXT_PUBLIC_PLASMIC_PROJECT_ID || "",
      token: process.env.NEXT_PUBLIC_PLASMIC_PROJECT_TOKEN || "",
    },
  ],
  preview: true,
});

// Design tokens
for (const token of tokens) { PLASMIC.registerToken(token); }

// Plasmic-library
function registerComponents(library: Record<string, any>) {
  for (const key of Object.keys(library)) {
    if (!key.includes("Meta")) {
      const component = library[key];
      const metaKey = `${key}Meta`;
      const meta = library[metaKey];
      if (meta) {
        PLASMIC.registerComponent(component, meta);
      }
    }
  }
}
registerComponents(PlasmicLibrary);

// Supabase
PLASMIC.registerGlobalContext(SupabaseUserGlobalContext, SupabaseUserGlobalContextMeta)
PLASMIC.registerComponent(SupabaseProvider, SupabaseProviderMeta);
PLASMIC.registerComponent(SupabaseUppyUploader, SupabaseUppyUploaderMeta);
PLASMIC.registerComponent(SupabaseStorageGetSignedUrl, SupabaseStorageGetSignedUrlMeta);
