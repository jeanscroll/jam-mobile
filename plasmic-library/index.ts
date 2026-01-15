import fs from 'node:fs';
import path from 'node:path';

interface ComponentMeta {
  name: string;
  props: Record<string, { type: string; defaultValue: string }>;
  section?: string;
  displayName?: string;
  description?: string;
  thumbnailUrl?: string;
  importPath?: string;
}

const components: Record<string, React.ComponentType<any>> = {};
const componentsMeta: ComponentMeta[] = [];

// Fonction pour lire tous les fichiers `.meta.ts`
async function loadComponentsMeta(dir: string) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      await loadComponentsMeta(fullPath);
    } else if (file.endsWith('.meta.ts')) {
      const meta = (await import(fullPath)).default as ComponentMeta;
      componentsMeta.push(meta);
    }
  }
}

// Lancer le chargement des métadonnées des composants
loadComponentsMeta(path.join(process.cwd(), 'components')).catch(console.error);

export { components, componentsMeta };
