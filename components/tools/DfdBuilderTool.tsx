"use client";

import { useState } from "react";
import { ToolShell } from "@/components/ui/ToolShell";

type ElementType = "entity" | "process" | "datastore" | "flow" | "boundary";

interface DfdElement {
  id: string;
  type: ElementType;
  label: string;
}

const STRIDE_LABELS: Record<string, string> = {
  S: "Spoofing",
  T: "Tampering",
  R: "Repudiation",
  I: "Information Disclosure",
  D: "Denial of Service",
  E: "Elevation of Privilege",
};

const STRIDE_COLORS: Record<string, string> = {
  S: "bg-danger-muted text-danger border-danger-subtle",
  T: "bg-orange-subtle text-orange border-orange-subtle",
  R: "bg-yellow-subtle text-yellow border-yellow-subtle",
  I: "bg-info-muted text-info border-info-subtle",
  D: "bg-purple-subtle text-purple border-purple-subtle",
  E: "bg-pink-subtle text-pink border-pink-subtle",
};

function generateThreats(element: DfdElement): { letter: string; label: string; description: string }[] {
  const base = element.type;
  const threats: { letter: string; label: string; description: string }[] = [];

  // All elements get all STRIDE questions, but some are more relevant per type
  if (base === "entity") {
    threats.push({ letter: "S", label: "Spoofing", description: `How is "${element.label}" authenticated? Can an attacker impersonate this entity?` });
    threats.push({ letter: "R", label: "Repudiation", description: `Can "${element.label}" deny actions? Are their actions logged with identity?` });
  }
  if (base === "process") {
    threats.push({ letter: "S", label: "Spoofing", description: `Does "${element.label}" authenticate its callers?` });
    threats.push({ letter: "T", label: "Tampering", description: `Could data be modified before reaching "${element.label}"?` });
    threats.push({ letter: "R", label: "Repudiation", description: `Are "${element.label}" actions logged with user identity?` });
    threats.push({ letter: "I", label: "Info Disclosure", description: `Could "${element.label}" leak data in logs, errors, or responses?` });
    threats.push({ letter: "D", label: "Denial of Service", description: `Is "${element.label}" resilient to resource exhaustion?` });
    threats.push({ letter: "E", label: "Elevation of Privilege", description: `Does "${element.label}" check authorization for every action?` });
  }
  if (base === "datastore") {
    threats.push({ letter: "T", label: "Tampering", description: `Could data in "${element.label}" be modified without authorization?` });
    threats.push({ letter: "I", label: "Info Disclosure", description: `Is "${element.label}" data encrypted at rest? Who has access?` });
    threats.push({ letter: "D", label: "Denial of Service", description: `Can "${element.label}" be filled to capacity?` });
  }
  if (base === "flow") {
    threats.push({ letter: "T", label: "Tampering", description: `Is data on "${element.label}" integrity-checked (TLS, signatures)?` });
    threats.push({ letter: "I", label: "Info Disclosure", description: `Is "${element.label}" encrypted in transit?` });
    threats.push({ letter: "D", label: "Denial of Service", description: `Can "${element.label}" be interrupted or flooded?` });
  }
  if (base === "boundary") {
    threats.push({ letter: "S", label: "Spoofing", description: `What crosses the "${element.label}" boundary? Is it authenticated?` });
    threats.push({ letter: "T", label: "Tampering", description: `What crosses the "${element.label}" boundary? Is integrity verified?` });
    threats.push({ letter: "I", label: "Info Disclosure", description: `What crosses the "${element.label}" boundary? Could it be intercepted?` });
    threats.push({ letter: "E", label: "Elevation of Privilege", description: `Does privilege level change across "${element.label}"?` });
  }

  return threats;
}

const ELEMENT_ICONS: Record<ElementType, string> = {
  entity: "👤",
  process: "⚙️",
  datastore: "🗄️",
  flow: "➡️",
  boundary: "🔷",
};

export default function DfdBuilderTool() {
  const [elements, setElements] = useState<DfdElement[]>([]);
  const [selectedType, setSelectedType] = useState<ElementType>("entity");
  const [labelInput, setLabelInput] = useState("");
  const [showThreats, setShowThreats] = useState(false);

  const addElement = () => {
    if (!labelInput.trim()) return;
    const newElement: DfdElement = {
      id: `${Date.now()}`,
      type: selectedType,
      label: labelInput.trim(),
    };
    setElements((prev) => [...prev, newElement]);
    setLabelInput("");
  };

  const removeElement = (id: string) => {
    setElements((prev) => prev.filter((e) => e.id !== id));
  };

  const allThreats = elements.flatMap(generateThreats);

  return (
    <ToolShell
      title="DFD Builder & STRIDE Threat Generator"
      description="Add elements to your Data Flow Diagram. Each element generates STRIDE threat questions automatically."
    >
      <div className="space-y-5">
        {/* Add element form */}
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ElementType)}
              className="px-3 py-2 border border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="entity">External Entity</option>
              <option value="process">Process</option>
              <option value="datastore">Data Store</option>
              <option value="flow">Data Flow</option>
              <option value="boundary">Trust Boundary</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-secondary mb-1">Label</label>
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addElement()}
              placeholder="e.g. Payment Processor"
              className="w-full px-3 py-2 border border-subtle rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={addElement}
            className="px-4 py-2 bg-slate-800 text-white rounded-md text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            Add Element
          </button>
        </div>

        {/* DFD visualization */}
        <div className="border border-subtle rounded-lg p-4 min-h-[120px] bg-surface-2">
          {elements.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              Add elements to build your DFD. Try: User, Web Server, Database, HTTPS Request, Internet Boundary.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {elements.map((el) => (
                <div
                  key={el.id}
                  className="flex items-center gap-2 px-3 py-2 bg-surface-2 border border-subtle rounded-lg shadow-sm text-sm"
                >
                  <span className="text-lg">{ELEMENT_ICONS[el.type]}</span>
                  <span className="font-medium text-secondary">{el.label}</span>
                  <span className="text-xs text-slate-400 uppercase">{el.type}</span>
                  <button
                    onClick={() => removeElement(el.id)}
                    className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generate threats */}
        {elements.length > 0 && (
          <div>
            <button
              onClick={() => setShowThreats(!showThreats)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {showThreats ? "Hide" : "Generate"} STRIDE Threats ({allThreats.length})
            </button>
          </div>
        )}

        {/* Threat list */}
        {showThreats && allThreats.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-secondary">
              Generated STRIDE Threats:
            </p>
            {allThreats.map((t, i) => (
              <div
                key={i}
                className={`p-3 rounded-md border text-sm ${STRIDE_COLORS[t.letter]}`}
              >
                <span className="font-bold">{t.letter}</span> — {t.label}:{" "}
                {t.description}
              </div>
            ))}
          </div>
        )}

        {/* STRIDE legend */}
        <div className="p-4 rounded-lg bg-surface-2 border border-subtle">
          <p className="text-sm font-medium text-secondary mb-2">STRIDE Reference</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {Object.entries(STRIDE_LABELS).map(([letter, label]) => (
              <div key={letter} className="flex items-center gap-1.5">
                <span className={`px-1.5 py-0.5 rounded font-bold ${STRIDE_COLORS[letter]}`}>
                  {letter}
                </span>
                <span className="text-secondary">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
