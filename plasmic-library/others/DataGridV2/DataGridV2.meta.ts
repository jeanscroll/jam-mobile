import { ComponentMeta } from "@plasmicapp/host";
import DataGridV2 from "./DataGridV2";

const DataGridV2Meta = {
  name: "DataGridV2",
  displayName: "Data Grid V2",
  importName: "DataGridV2",
  importPath: "./components/others/DataGridV2/DataGridV2",
  component: DataGridV2,
  defaultStyles: {
    width: "100%",
    maxWidth: "100%",
    height: "auto",
    maxHeight: "100%"
  },
  props: {
    tasks: {
      type: "array",
      description: "Array of tasks to display in the grid",
      defaultValue: [],
      itemType: {
        type: "object",
        fields: {
          id: "string",
          nom_du_candidat: "string",
          note: "string",
          cv_nom: "string",
          lm_nom: "string",
          date_de_candidature: "string",
          status: "string",
          email: "string",
          profile_photo: { type: "string", optional: true }
        }
      }
    },
    statusConfig: {
      type: "object",
      description: "Configuration des statuts et leurs styles",
      defaultValue: {
        "en_attente": {
          label: "En attente",
          color: "#FEF3C7",
        },
        "accepte": {
          label: "Accepté",
          color: "#D1FAE5",
        },
        "refuse": {
          label: "Refusé",
          color: "#FEE2E2",
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
        nom_du_candidat: "Nom du candidat",
        note: "Niveau",
        cv_nom: "CV",
        lm_nom: "Lettre de motivation",
        date_de_candidature: "Postulé le",
        status: "Statut",
        email: "Email",
        actions: "Actions"
      }
    },
    visibleColumns: {
      type: "array",
      description: "Liste des colonnes à afficher",
      defaultValue: [
        "nom_du_candidat",
        "note",
        "cv_nom",
        "lm_nom",
        "date_de_candidature",
        "status",
        "actions"
      ]
    },
        onAccept: {      type: "eventHandler",      description: "Fonction appelée lors de l'acceptation d'une candidature",      argTypes: [        { name: "taskId", type: "string" },        { name: "task", type: "object", fields: {          id: "string",          nom_du_candidat: "string",          note: "string",          cv_nom: "string",          lm_nom: "string",          date_de_candidature: "string",          status: "string",          email: "string",          profile_photo: { type: "string", optional: true }        } }      ]    },
    onReject: {
      type: "eventHandler",
      description: "Fonction appelée lors du rejet d'une candidature",
      argTypes: [{ name: "taskId", type: "string" }]
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
      defaultValue: "Aucune donnée disponible"
    },
    loadingComponent: {
      type: "slot",
      description: "Composant personnalisé pour l'état de chargement"
    },
    onViewCV: {
      type: "eventHandler",
      description: "Appelé lors du clic sur le bouton de prévisualisation du CV",
      argTypes: [{ name: "fileUrl", type: "string" }, { name: "taskId", type: "string" }]
    },
    onViewLM: {
      type: "eventHandler",
      description: "Appelé lors du clic sur le bouton de prévisualisation de la lettre de motivation",
      argTypes: [{ name: "fileUrl", type: "string" }, { name: "taskId", type: "string" }]
    },
    showActionsColumn: {
      type: "boolean",
      description: "Afficher la colonne des actions (accepter/refuser)",
      defaultValue: true
    }
  }
} as ComponentMeta<typeof DataGridV2>;

export default DataGridV2Meta; 