import { ComponentMeta } from "@plasmicapp/host";
import DataGridUser from "./DataGridUser";

const DataGridUserMeta = {
  name: "DataGridUser",
  displayName: "Data Grid User",
  importName: "DataGridUser",
  importPath: "./components/others/DataGridUser/DataGridUser",
  component: DataGridUser,
  defaultStyles: {
    width: "100%",
    maxWidth: "100%",
    height: "auto",
    maxHeight: "100%"
  },
  props: {
    users: {
      type: "array",
      description: "Array des utilisateurs à afficher dans la grille",
      defaultValue: [],
      itemType: {
        type: "object",
        fields: {
          id: "string",
          nom: "string",
          email: "string",
          role: "string",
          date_inscription: "string",
          statut: "string",
          photo_profil: { type: "string", optional: true }
        }
      }
    },
    statusConfig: {
      type: "object",
      description: "Configuration des statuts et leurs styles",
      defaultValue: {
        "actif": {
          label: "Actif",
          color: "#D1FAE5",
        },
        "inactif": {
          label: "Inactif",
          color: "#FEE2E2",
        },
        "suspendu": {
          label: "Suspendu",
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
        nom: "Nom",
        email: "Email",
        role: "Rôle",
        date_inscription: "Date d'inscription",
        statut: "Statut",
        photo_profil: "Photo de profil",
        actions: "Actions"
      }
    },
    visibleColumns: {
      type: "array",
      description: "Liste des colonnes à afficher",
      defaultValue: [
        "nom",
        "email",
        "role",
        "date_inscription",
        "statut",
        "actions"
      ]
    },
    onDelete: {
      type: "eventHandler",
      description: "Fonction appelée lors du clic sur le bouton supprimer",
      argTypes: [{ name: "userId", type: "string" }]
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
      defaultValue: "Aucun utilisateur disponible"
    },
    loadingComponent: {
      type: "slot",
      description: "Composant personnalisé pour l'état de chargement"
    }
  }
} as ComponentMeta<typeof DataGridUser>;

export default DataGridUserMeta; 