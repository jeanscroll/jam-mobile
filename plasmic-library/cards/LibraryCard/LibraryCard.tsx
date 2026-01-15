"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardBody, CardFooter, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure } from "@heroui/react";
import type { HTMLElementRefOf } from "@plasmicapp/react-web";
import clsx from "clsx";
import styles from "./LibraryCard.module.css";
import parametersData from "./parameters.json";

interface Component {
  localVersion: string;
  remoteVersion: string;
  status: string;
}

interface Parameters {
  installedVersion: string;
  lastVersion: string;
  components: {
    [key: string]: Component;
  };
}

export interface LibraryCardProps {
  title: string;
  imageUrl: string;
  buttonText: string;
  className?: string;
  showHeader?: boolean;
  headerTitle?: string;
  headerSubtitle?: string;
  headerDescription?: string;
}

function LibraryCard_(props: LibraryCardProps, ref: HTMLElementRefOf<"div">) {
  const {
    title,
    imageUrl,
    buttonText,
    className,
    showHeader = true,
    headerTitle = "Librairie Plasmic",
    headerSubtitle = "Manageur",
  } = props;

  const componentCount = parametersData?.components ? Object.keys(parametersData.components).length : 0;
  const headerDescription = `${componentCount} Composants`;

  const [showParameters, setShowParameters] = useState(false);
  const [parameters, setParameters] = useState<Parameters | null>(null);

  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [choixBranche, setChoixBranche] = useState("");
  const [publishData, setPublishData] = useState<{ [key: string]: any }>({});
  const [publishStep, setPublishStep] = useState(0);
  
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false);
  const [workflows, setWorkflows] = useState<string[]>([]);

  const [updatedWorkflows, setUpdatedWorkflows] = useState<string[]>([]);

  const [isConfigFormVisible, setIsConfigFormVisible] = useState(false);
  const [formData, setFormData] = useState({ name: "", dockerhubAccount: "", vpsName: "" });

  const updatePublishData = (key: string, value: any) => {
    setPublishData((prev) => ({ ...prev, [key]: value }));
  };
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [modalContent, setModalContent] = useState<string | null>(null);

  const resetUpdatedWorkflows = () => {
    setUpdatedWorkflows([])
  };

  const openModal = (type: string) => {
    setModalContent(type);
    onOpen();

    if (type === "updateProject") {
      fetchWorkflows(type);
    }
  };

  // Fonction de mise à jour d'un workflow
  const updateWorkflow = async (workflowName: string) => {
    setUpdatedWorkflows((prevUpdatedWorkflows) => [
      ...prevUpdatedWorkflows,
      workflowName,
    ]);
    
    // Lancer un push avec un tag à partir du nom du fichier (workflow)
    try {
      const response = await fetch("/api/plasmic-lib/trigger_workflow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workflowName }),
      });
      const data = await response.json();

      if (data.status === "success") {
        console.log("Workflow lancé avec succès");
      } else {
        console.error("Erreur lors du lancement du workflow");
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi de la requête pour déclencher le workflow", error);
    }
  };

  // Fonction pour gérer la soumission du formulaire de configuration
  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Formulaire de configuration soumis", formData);
  };
  
  /** Vérifier les mises à jour */
  const checkForUpdates = async () => {
    setUpdateMessage("🔄 Vérification des mises à jour...");
    try {
      const response = await fetch("/api/plasmic-lib/update_library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkOnly: true }),
      });
  
      const data = await response.json();
  
      if (data.status === "update-available") {
        const newVersion = data.lastVersion || ""; 
  
        setUpdateAvailable(true);
        setUpdateMessage(`🚀 Nouvelle version disponible : ${newVersion}`);
  
        setParameters((prev) => ({
          ...prev, // garde les anciennes valeurs
          lastVersion: newVersion,
          installedVersion: prev?.installedVersion ?? "", // garantie une string
          components: prev?.components ?? {}, // garantie un objet
        }));
        

      } else {
        setUpdateAvailable(false);
        setUpdateMessage(`✅ Votre version est à jour (${parameters?.installedVersion || "inconnue"})`);
        setShowMainMenu(true);
        setShowParameters(false);
      }
    } catch (error) {
      setUpdateMessage("❌ Erreur lors de la vérification.");
    }
  };
  

  /** Met à jour la version */
  const handleUpdate = async () => {
    setUpdateMessage("⚡ Mise à jour en cours...");
    try {
      const response = await fetch("/api/plasmic-lib/update_library", { method: "POST" });
      const data = await response.json();

      if (data.status === "updated") {
        setUpdateMessage(`✅ Mise à jour réussie : ${data.message}`);
        setUpdateAvailable(false);

        // 🔄 Met à jour les paramètres sans refaire un check après
        setTimeout(() => {
          setParameters(parametersData);
        }, 1000);
      } else {
        setUpdateMessage("❌ Erreur lors de la mise à jour.");
      }
    } catch (error) {
      setUpdateMessage("❌ Erreur lors de la mise à jour.");
    }
  };

  const fetchWorkflows = async (type: string) => {
    setIsLoadingWorkflows(true);
    try {
      const response = await fetch("/api/plasmic-lib/list_workflows");
      const data = await response.json();
  
      if (data.workflows) {
        setWorkflows(data.workflows);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des workflows");
    }
    setIsLoadingWorkflows(false);
  };  

  /** Publier les composants */
  const startPublishingProcess = () => {
    setPublishStep(1);
    openModal("🚀 Début du processus de publication...");
  };
  const updatePublishDataAndStep = (key: string, value: any, nextStep: number) => {
    updatePublishData(key, value);
    setPublishStep(nextStep);
  };

  /** Vérification automatique lors de l'ouverture des paramètres */
  useEffect(() => {

      checkForUpdates();
    
  }, []);

  return (
    <div className="relative">
    <Card isFooterBlurred className={clsx("border-none", className)} radius="lg" ref={ref}>
      {showHeader && (
        <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
          <h4 className="font-bold text-large">
            {showParameters ? "Paramètres" : headerTitle}
          </h4>
          <p className="text-tiny uppercase font-bold">
            {showParameters ? "Options avancées" : headerSubtitle}
          </p>
          <small className="text-default-500">
            {(showMainMenu || !showParameters) ? headerDescription : "Mise à jour..."}
          </small>
        </CardHeader>
      )}

      <CardBody className="p-0 relative">
        <img alt={title} className={styles.heroImage} src={imageUrl} />

        {showParameters && (
          <div className="absolute inset-0 bg-white/90 p-4 flex flex-col pt-[50px] items-center">
            <button
              type="button"
              onClick={() => {
                setShowParameters(false);
                setShowMainMenu(true);
              }}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-lg"
            >
              ✕
            </button>

            <p className="text-sm text-gray-800 text-center max-w-[80%]">
              {updateMessage}
            </p>

            {updateAvailable && (
                <Button
                  className="mt-4 text-tiny text-white bg-blue-500 hover:bg-blue-600"
                  color="primary"
                  radius="lg"
                  size="sm"
                  variant="flat"
                  onClick={handleUpdate}
                >
                  Mettre à jour
                </Button>
              )}
            </div>
          )}

          {showMainMenu && (
            <div className="absolute inset-0 bg-white/90 flex flex-col items-center">
              <ul className="text-gray-800 text-left max-w-[80%] space-y-2 mt-8 whitespace-nowrap">
                <li
                  className="text-sm cursor-pointer"
                  onClick={() => openModal("📌 Liste des composants")}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') { // Gérer la touche Entrée ou Espace
                      openModal("📌 Liste des composants");
                    }
                  }}
                >
                  1 - Voir composants
                </li>
                <li
                  className="text-sm cursor-pointer"
                  onClick={() => openModal("📥 Télécharger les composants")}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      openModal("📥 Télécharger les composants");
                    }
                  }}
                >
                  2 - Télécharger les composants
                </li>
                <li
                  className="text-sm cursor-pointer"
                  onClick={startPublishingProcess}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      startPublishingProcess();
                    }
                  }}
                >
                  3 - Publier vos composants
                </li>
                <li
                  className="text-sm cursor-pointer"
                  onClick={() => openModal("updateProject")}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      openModal("updateProject");
                    }
                  }}
                >
                  4 - Mettre à jour un projet
                </li>
              </ul>

              <button
                type="button"
                onClick={() => setShowMainMenu(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-lg"
              >
                ✕
              </button>
            </div>
          )}
        </CardBody>

        {!showParameters && (
          <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
            {!showMainMenu && parameters && (
              <p className="text-tiny text-white/80">
                {parameters.installedVersion === parameters.lastVersion ? (
                  <span className="flex items-center gap-1">
                    <img src="check.png" alt="Check" width="18px" /> À jour - v{parameters.lastVersion}
                  </span>
                ) : (
                  "Cliquez ici ->"
                )}
              </p>
            )}

            <Button
              className="text-tiny text-white bg-black/20"
              color="default"
              radius="lg"
              size="sm"
              variant="flat"
              onClick={() => (showMainMenu ? setShowMainMenu(false) : setShowParameters(true))}
            >
              {showMainMenu ? "Fermer" : buttonText}
            </Button>
          </CardFooter>
        )}

{/* Modal en dehors du Card pour éviter les problèmes de positionnement */}
<Modal
  isOpen={isOpen}
  onOpenChange={(open) => {
    if (!open) resetUpdatedWorkflows();
    onOpenChange();
  }}
>

  <ModalContent className="max-w-[100%] md:max-w-[1000px]">
    <ModalHeader>
      {modalContent === "updateProject"
        ? isLoadingWorkflows
          ? "Chargement des workflows..."
          : "Mise à jour d'un projet"
        : modalContent}
    </ModalHeader>
    <ModalBody>
    
    {modalContent === "updateProject" ? (
      <>
        <p>Sélectionnez un workflow pour le mettre à jour directement dans le conteneur sur le VPS.</p>

        <button
          type="button"
          onClick={() => setIsConfigFormVisible(true)}
          className="btn btn-primary mt-2"
        >
          Configurer
        </button>

{/* Tableau avec les workflows */}
{workflows.length > 0 ? (
  <div className="mt-4">
    <table className="min-w-full table-auto border-collapse border border-gray-200">
      <thead>
        <tr>
          <th className="px-4 py-2 border border-gray-300 text-left">Nom du workflow</th>
          <th className="px-4 py-2 border border-gray-300 text-left">Mettre à jour</th>
          <th className="px-4 py-2 border border-gray-300 text-left">Valider</th>
          <th className="px-4 py-2 border border-gray-300 text-left">Configurer</th>
        </tr>
      </thead>
      <tbody>
        {workflows.map((workflow, index) => {
          const workflowName = workflow.replace('.yml', '');
          const isUpdated = updatedWorkflows.includes(workflowName);

          return (
            <tr key={index} className="hover:bg-gray-100">
              <td className="px-4 py-2 border border-gray-300">{workflowName}</td>
              <td className="px-4 py-2 border border-gray-300">
                <button
                  type="button"
                  onClick={() => updateWorkflow(workflowName)}
                  className="btn btn-secondary"
                >
                  Mettre à jour
                </button>
              </td>
              <td className="px-4 py-2 border border-gray-300">
                {isUpdated ? (
                  <span className="text-green-500">✅ Mise à jour effectuée</span>
                ) : (
                  <span className="text-gray-500">Non validé</span>
                )}
              </td>
              <td className="px-4 py-2 border border-gray-300">
                <button
                  type="button"
                  onClick={() => setIsConfigFormVisible(true)} // Action pour la configuration
                  className="btn btn-primary"
                >
                  Configurer
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
) : (
  <p>Aucun workflow trouvé.</p>
)}


          {isConfigFormVisible && (
            <form onSubmit={handleConfigSubmit} className="mt-4">
              <h4 className="font-semibold text-lg">Configuration du projet</h4>
              <div>
                <label htmlFor="name" className="block mt-2">Nom du projet</label>
                <input
                  type="text"
                  id="name"
                  className="border px-3 py-2 rounded-md"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="dockerhubAccount" className="block mt-2">Compte DockerHub</label>
                <input
                  type="text"
                  id="dockerhubAccount"
                  className="border px-3 py-2 rounded-md"
                  value={formData.dockerhubAccount}
                  onChange={(e) => setFormData({ ...formData, dockerhubAccount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="vpsName" className="block mt-2">Nom du VPS</label>
                <input
                  type="text"
                  id="vpsName"
                  className="border px-3 py-2 rounded-md"
                  value={formData.vpsName}
                  onChange={(e) => setFormData({ ...formData, vpsName: e.target.value })}
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => setIsConfigFormVisible(false)}
                className="btn btn-secondary mt-4 ml-2"
              >
                Annuler
              </button>

              <button type="submit" className="btn btn-primary mt-4">Soumettre</button>
            </form>
          )}
    </>

) : parameters ? (
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b text-left">Composant</th>
              <th className="py-2 px-4 border-b text-left">Version locale</th>
              <th className="py-2 px-4 border-b text-left">Version distante</th>
              <th className="py-2 px-4 border-b text-left">Statut</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(parameters.components).map(([key, value]) => (
              <tr key={key}>
                <td className="py-1 px-4 border-b text-left">{key}</td>
                <td className="py-1 px-4 border-b text-left">{value.localVersion}</td>
                <td className="py-1 px-4 border-b text-left">{value.remoteVersion}</td>
                <td className="py-1 px-4 border-b text-left">{value.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>...chargement</p>
      )}

      {publishStep === 1 && (
        <>
          <p>⚙️ Quels composants souhaitez-vous publier ?</p>
          <Button onClick={() => {
            updatePublishData("components", "tous");
            setPublishStep(2);

          }}>
            Tous les composants
          </Button>
          <Button onClick={() => {
            updatePublishData("components", "certains");
            setPublishStep(2);
          }}>
            Sélectionner des composants
          </Button>
        </>
      )}

      {publishStep === 2 && publishData.components === "certains" && (
        <>
          <p>📌 Sélectionnez les composants :</p>
          {Object.keys(parameters?.components || {}).map((comp) => (
            <Button key={comp} onClick={() => {
              updatePublishData("selectedComponent", comp);
              setPublishStep(3);
            }}>
              {comp}
            </Button>
          ))}
        </>
      )}


      {publishStep === 2 && publishData.components === "tous" && (
        <>
          <p>🚀 Confirmez-vous la publication de tous les composants ?</p>

          <label htmlFor="choixBranche">🌿 Choisissez une branche :</label>
          <input
            id="choixBranche"
            type="text"
            placeholder="Nom de la branche"
            value={choixBranche}
            onChange={(e) => setChoixBranche(e.target.value)}
            className="border p-2 rounded w-full mt-2"
          />

          <Button
            onClick={() => {
              updatePublishData("choixBranche", choixBranche); // Ajoute choixBranche aux données
              updatePublishDataAndStep("components", "tous", 3);
            }}
            disabled={!choixBranche.trim()} // Empêche la publication si le champ est vide
          >
            Oui, publier
          </Button>
        </>
      )}

      {publishStep === 3 && (
        <>
          <p>🛠 Tout est prêt !! Lancer et patienter...</p>
          <Button onClick={async () => {
            setModalContent("🚀 Publication en cours...");
            try {
              const response = await fetch("/api/plasmic-lib/publish_components", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  components: publishData.components,
                  branch: publishData.choixBranche,
                }),
              });
              const data = await response.json();
              setModalContent(data.message === "Script exécuté avec succès"
                ? "✅ Composants publiés avec succès."
                : "❌ Erreur lors de la publication."
              );
              setPublishStep(4);
            } catch (error) {
              setModalContent("❌ Erreur lors de la publication.");
              setPublishStep(4);
            }
          }}>
            Lancer la publication
          </Button>
        </>
      )}

      {publishStep === 4 && (
        <>
          <p>{modalContent}</p>
          <Button onClick={() => {
            setPublishStep(0);
            onOpenChange();
          }}>Fermer</Button>
        </>
      )}
    </ModalBody>

    <ModalFooter>
      <Button color="danger" variant="light" onClick={() => onOpenChange()}>
        Fermer
      </Button>
    </ModalFooter>
  </ModalContent>
</Modal>

      </Card>
    </div>
  );
}

const LibraryCard = React.forwardRef(LibraryCard_);
export default LibraryCard;
