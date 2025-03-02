import { useEffect, useRef, useState } from "react";

export function InputSearch({
  searchTerm,
  handleSearch,
  setIsFormulaDetected,
}: { searchTerm: string; handleSearch: (value: string) => void, setIsFormulaDetected: (value: boolean) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [formulaDetected, setFormulaDetected] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fonction pour évaluer une expression mathématique avec respect des parenthèses et crochets
  const evaluateExpression = (expression: string): number => {
    // Supprimer les espaces de l'expression
    expression = expression.replace(/\s+/g, "");

    // Si l'expression est vide après avoir enlevé les espaces, retourner NaN
    if (expression === "") {
      return NaN;
    }

    // 1. Gérer les parenthèses () et crochets []
    const parensRegex = /(\[([^\[\]]+)\]|\(([^\(\)]+)\))/g;
    while (parensRegex.test(expression)) {
      expression = expression.replace(parensRegex, (innerExpr1, innerExpr2) => {
        const innerExpr = innerExpr1 || innerExpr2; // Choisir le contenu entre parenthèses ou crochets
        return evaluateExpression(innerExpr).toString(); // Remplacer la parenthèse ou crochet par son résultat
      });
    }

    // 2. Résoudre la multiplication et la division en premier
    let calcRegex = /(\d+)\s*([\*\/])\s*(\d+)/;
    while (calcRegex.test(expression)) {
      expression = expression.replace(calcRegex, (_, num1, operator, num2) => {
        const n1 = parseFloat(num1);
        const n2 = parseFloat(num2);
        let result: number = 0;
        if (operator === "*") {
          result = n1 * n2;
        } else if (operator === "/") {
          result = n1 / n2;
        }
        return result.toString(); // Remplacer l'opération par son résultat
      });
    }

    // 3. Résoudre l'addition et la soustraction
    calcRegex = /(\d+)\s*([\+\-])\s*(\d+)/;
    while (calcRegex.test(expression)) {
      expression = expression.replace(calcRegex, (_, num1, operator, num2) => {
        const n1 = parseFloat(num1);
        const n2 = parseFloat(num2);
        let result: number = 0;
        if (operator === "+") {
          result = n1 + n2;
        } else if (operator === "-") {
          result = n1 - n2;
        }
        return result.toString(); // Remplacer l'opération par son résultat
      });
    }

    // Retourner le résultat final de l'expression
    return parseFloat(expression);
  };

  // Fonction pour détecter et calculer la formule
  const detectAndCalculateFormula = (value: string) => {
    if (value.trim() === "") {
      setFormulaDetected(false); // Si le champ est vide, on désactive la détection
      setIsFormulaDetected(false); // Désactive la détection de formule dans le parent
      setResult(null); // Réinitialise le résultat
      return;
    }

    try {
      const result = evaluateExpression(value); // Évaluation de l'expression
      if (isNaN(result)) {
        setFormulaDetected(false); // Si le résultat est NaN, on indique qu'il n'y a pas de formule valide
        setIsFormulaDetected(false); // Désactive la détection de formule dans le parent
        setResult("Expression invalide"); // Affiche un message d'erreur
      } else {
        setFormulaDetected(true); // Formule valide détectée
        setIsFormulaDetected(true); // Active la détection de formule dans le parent
        setResult(result.toString()); // Mettre à jour le résultat
      }
    } catch (error) {
      setFormulaDetected(false); // Erreur dans le calcul, pas de formule valide
      setIsFormulaDetected(false); // Désactive la détection de formule dans le parent
      setResult("Erreur de calcul"); // Affiche un message d'erreur
    }
  };

  

  // Utiliser la fonction detectAndCalculateFormula à chaque changement de valeur
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    handleSearch(newValue); // Appel de la fonction parent
    detectAndCalculateFormula(newValue); // Détection et calcul de la formule
  };

  return (
    <div className="flex items-center p-4 border-b border-zinc-700 w-full">
      <div className="mr-4 text-zinc-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>Search Icon</title>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        className="flex-grow bg-transparent text-white text-lg outline-none"
        placeholder="Commencez à taper..."
      />
      {formulaDetected && result !== null && (
        <div className="text-white font-bold ml-4">{result}</div>
      )}
    </div>
  );
}
