import { ComponentMeta } from "@plasmicapp/host";
import DataGridOffre from "./DataGridOffre";

const DataGridOffreMeta = {
  name: "DataGridOffre",
  displayName: "Data Grid Offre",
  importName: "DataGridOffre",
  importPath: "./components/others/DataGridOffre/DataGridOffre",
  component: DataGridOffre,
  defaultStyles: {
    width: "100%",
    maxWidth: "100%",
    height: "auto",
    maxHeight: "100%"
  },
  props: {
    offres: {
      type: "array",
      description: "Array des offres à afficher dans la grille",
      defaultValue: [],
      itemType: {
        type: "object",
        fields: {
          id: "string",
          titre: "string",
          description: "string",
          entreprise: "string",
          date_publication: "string",
          status: "string",
          logo_entreprise: { type: "string", optional: true }
        }
      }
    },
    statusConfig: {
      type: "object",
      description: "Configuration des statuts et leurs styles",
      defaultValue: {
        "active": {
          label: "Active",
          color: "#D1FAE5",
        },
        "inactive": {
          label: "Inactive",
          color: "#FEE2E2",
        },
        "en_attente": {
          label: "En attente",
          color: "#FEF3C7",
        }
      }
    },
    theme: {
      type: "object",
      description: "Thème personnalisé pour le tableau",
      defaultValue: {
        headerBgColor: '#F3F4F6',
        rowBgColor: '#ffffff',
        hoverBgColor: '#E5E7EB',
        borderColor: '#E5E7EB',
        textColor: '#4B5563'
      }
    },
    columnLabels: {
      type: "object",
      description: "Labels personnalisés pour les colonnes",
      defaultValue: {
        titre: "Titre",
        description: "Description",
        entreprise: "Entreprise",
        date_publication: "Date de publication",
        status: "Statut",
        logo_entreprise: "Logo",
        actions: "Actions"
      }
    },
    visibleColumns: {
      type: "array",
      description: "Liste des colonnes à afficher",
      defaultValue: [
        "titre",
        "entreprise",
        "description",
        "date_publication",
        "status",
        "actions"
      ]
    },
    onViewDetails: {
      type: "eventHandler",
      description: "Fonction appelée lors du clic sur le bouton de détails",
      argTypes: [
        { name: "offreId", type: "string" },
        { name: "offre", type: "object", fields: {
          id: "string",
          titre: "string",
          description: "string",
          entreprise: "string",
          date_publication: "string",
          status: "string",
          logo_entreprise: { type: "string", optional: true }
        }}
      ]
    },
    onDelete: {
      type: "eventHandler",
      description: "Fonction appelée lors du clic sur le bouton supprimer",
      argTypes: [{ name: "offreId", type: "string" }]
    },
    containerClassName: {
      type: "string",
      description: "Classe CSS pour le conteneur du tableau"
    },
    headerClassName: {
      type: "string",
      description: "Classe CSS pour l'en-tête du tableau"
    },
    rowClassName: {
      type: "string",
      description: "Classe CSS pour les lignes du tableau"
    },
    pageSize: {
      type: "number",
      description: "Nombre d'éléments par page",
      defaultValue: 10
    },
    currentPage: {
      type: "number",
      description: "Page actuelle",
      defaultValue: 1
    },
    onPageChange: {
      type: "eventHandler",
      description: "Gestionnaire d'événement pour le changement de page",
      argTypes: [{ name: "page", type: "number" }]
    },
    totalItems: {
      type: "number",
      description: "Nombre total d'éléments"
    },
    isLoading: {
      type: "boolean",
      description: "Indique si les données sont en cours de chargement",
      defaultValue: false
    },
    error: {
      type: "object",
      description: "Objet d'erreur si une erreur s'est produite"
    },
    emptyStateMessage: {
      type: "string",
      description: "Message à afficher quand il n'y a pas de données",
      defaultValue: "Aucune offre disponible"
    },
    loadingComponent: {
      type: "slot",
      description: "Composant personnalisé pour l'état de chargement"
    }
  }
} as ComponentMeta<typeof DataGridOffre>;

export default DataGridOffreMeta; 