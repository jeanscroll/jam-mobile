import type * as React from "react";
import { useState } from "react";
import { presets } from "@/styles/presets"; // Assurez-vous que les presets sont bien définis dans votre projet

export interface OperationCardProps {
  wrapperStyle?: "simple" | "card" | "custom";
  inputStyle?: "simple" | "advance";
  buttonSubmitStyle?: "primary" | "secondary" | "tertiary";
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
}

const OperationCard: React.FC<OperationCardProps> = ({ 
  
  wrapperStyle = "card",
  inputStyle = "simple",
  buttonSubmitStyle = "primary",
  onSubmit,

}) => {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [type, setType] = useState("");
  const [budget, setBudget] = useState("");
  const [comments, setComments] = useState("");
  const [runsheetModel, setRunsheetModel] = useState("");

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e); // Exécuter la fonction onSubmit si elle est fournie
  };

  return (
    <div style={presets.wrappers[wrapperStyle] as React.CSSProperties}>
      {/* En-tête de la carte */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <h2>Nouvelle opération</h2>
          <span>No 272</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button type="button" style={{ marginRight: '10px' }}>📎</button> {/* Icône de pièce jointe */}
          <button type="button">❌</button> {/* Icône de fermeture */}
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {/* Titre */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="title">Titre*</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre"
            required
            style={presets.inputs[inputStyle]}
          />
          <p>This is a hint text to help user.</p>
        </div>

        {/* Date et Heure */}
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="startDate">Date et heure de début*</label>
            <div style={{ display: 'flex' }}>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                style={presets.inputs[inputStyle]}
              />
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                style={presets.inputs[inputStyle]}
              />
            </div>
          </div>
        </div>

        {/* Type */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="type">Type*</label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            style={presets.selectStyle as React.CSSProperties}
          >
            <option value="">Sélectionner...</option>
            <option value="type1">Type 1</option>
            <option value="type2">Type 2</option>
            <option value="type3">Type 3</option>
          </select>
        </div>

        {/* Budget */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="budget">Budget*</label>
          <div >
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>€</span>
            <input
              type="text"
              id="budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="25,000"
              required
              style={{ ...presets.inputs[inputStyle], paddingLeft: '30px' }}
            />
          </div>
        </div>

        {/* Commentaires */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="comments">Commentaires</label>
          <textarea
            id="comments"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Entrez vos commentaires..."
            style={presets.textareaStyle as React.CSSProperties}
          />
        </div>

        {/* Modèle de Runsheet & Dispositif */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label htmlFor="runsheetModel">Modèle de Runsheet & Dispositif*</label>
          <select
            id="runsheetModel"
            value={runsheetModel}
            onChange={(e) => setRunsheetModel(e.target.value)}
            required
            style={presets.selectStyle as React.CSSProperties}
          >
            <option value="">Sélectionner...</option>
            <option value="model1">Modèle 1</option>
            <option value="model2">Modèle 2</option>
            <option value="model3">Modèle 3</option>
          </select>
        </div>

        {/* Bouton de soumission */}
        <button type="submit" style={presets.buttons.primary}>
          Créer
        </button>
      </form>
    </div>
  );
};

export default OperationCard;
