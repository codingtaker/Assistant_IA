import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Target, 
  Lightbulb, 
  Users, 
  Gift, 
  Megaphone, 
  RotateCcw, 
  Download,
  Share2,
  Sparkles,
  Edit,
  Save,
  X,
  FileText
} from "lucide-react";
import { GeneratedPitch, ProjectData } from "@/pages/Index";
import { usePitchStorage } from "@/hooks/usePitchStorage";
import jsPDF from 'jspdf';

interface PitchDisplayProps {
  pitch: GeneratedPitch;
  projectData: ProjectData;
  onReset: () => void;
  onPitchUpdate?: (updatedPitch: GeneratedPitch) => void;
  selectedTemplate?: string;
}

const PitchDisplay = ({ 
  pitch, 
  projectData, 
  onReset, 
  onPitchUpdate,
  selectedTemplate = "lean-canvas"
}: PitchDisplayProps) => {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedPitch, setEditedPitch] = useState<GeneratedPitch>(pitch);
  const [pitchName, setPitchName] = useState<string>(`Pitch ${projectData.projectName}`);
  const { savePitch } = usePitchStorage();
  const { toast } = useToast();

  const pitchSections = [
    {
      key: "problem",
      icon: Target,
      title: "Problème identifié",
      content: editedPitch.problem,
      color: "text-red-500",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    },
    {
      key: "solution",
      icon: Lightbulb,
      title: "Solution proposée",
      content: editedPitch.solution,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200"
    },
    {
      key: "targetCustomer",
      icon: Users,
      title: "Client cible",
      content: editedPitch.targetCustomer,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      key: "valueProposition",
      icon: Gift,
      title: "Proposition de valeur",
      content: editedPitch.valueProposition,
      color: "text-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      key: "channels",
      icon: Megaphone,
      title: "Canaux de distribution",
      content: editedPitch.channels,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    }
  ];

  const handleSaveEdit = (sectionKey: string, newContent: string) => {
    const updated = { ...editedPitch, [sectionKey]: newContent };
    setEditedPitch(updated);
    setEditingSection(null);
    if (onPitchUpdate) {
      onPitchUpdate(updated);
    }
  };

  const handleSavePitch = () => {
    try {
      savePitch(pitchName, projectData, editedPitch, selectedTemplate);
      toast({
        title: "Pitch sauvegardé !",
        description: `"${pitchName}" a été sauvegardé avec succès.`,
      });
      // Pas de rechargement de page - les données sont mises à jour automatiquement
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le pitch.",
        variant: "destructive",
      });
    }
  };

  const handleExportTXT = () => {
    const pitchText = `
PITCH BUSINESS - ${projectData.projectName}

${pitchSections.map(section => `
${section.title.toUpperCase()}
${section.content}
`).join('\n')}

Généré par Assistant Pitch Business
    `.trim();

    const blob = new Blob([pitchText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pitch-${projectData.projectName.toLowerCase().replace(/\s+/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export TXT réussi !",
      description: "Votre pitch a été téléchargé en format TXT.",
    });
  };

  const handleExportPDF = () => {
    try {
      const pdf = new jsPDF();
      
      // Configuration
      const pageWidth = pdf.internal.pageSize.width;
      const margin = 15;
      const lineHeight = 6;
      let currentY = 20;

      // Titre principal
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(`PITCH BUSINESS - ${projectData.projectName}`, margin, currentY);
      currentY += lineHeight * 3;

      // Date
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, margin, currentY);
      currentY += lineHeight * 3;

      // Sections du pitch
      pitchSections.forEach((section) => {
        // Titre de section
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text(section.title.toUpperCase(), margin, currentY);
        currentY += lineHeight;

        // Contenu de section
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        
        // Découper le texte en lignes
        const splitText = pdf.splitTextToSize(section.content, pageWidth - (margin * 2));
        splitText.forEach((line: string) => {
          if (currentY > 270) { // Nouvelle page si nécessaire
            pdf.addPage();
            currentY = 10;
          }
          pdf.text(line, margin, currentY);
          currentY += lineHeight;
        });
        
        currentY += lineHeight; // Espacement entre sections
      });

      // Footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(`Assistant Pitch Business - Page ${i}/${pageCount}`, margin, 285);
      }

      // Téléchargement
      pdf.save(`pitch-${projectData.projectName.toLowerCase().replace(/\s+/g, '-')}.pdf`);

      toast({
        title: "Export PDF réussi !",
        description: "Votre pitch a été téléchargé en format PDF.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer le PDF.",
        variant: "destructive",
      });
    }
  };

  const handleExportJSON = () => {
    const exportData = {
      name: pitchName,
      projectData,
      pitch: editedPitch,
      template: selectedTemplate,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pitch-${projectData.projectName.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export JSON réussi !",
      description: "Votre pitch a été téléchargé en format JSON.",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-violet-100 to-blue-100 rounded-full">
            <Sparkles className="h-8 w-8 text-violet-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Pitch généré pour {projectData.projectName}
        </h2>
        <p className="text-gray-600">
          Votre pitch professionnel basé sur la méthode Lean Canvas
        </p>
        <Badge variant="secondary" className="mt-3">
          Généré par IA
        </Badge>
      </div>

      {/* Save Name Input */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="pitch-name" className="block text-sm font-medium text-gray-700 mb-2">
                Nom du pitch (pour la sauvegarde)
              </label>
              <Input
                id="pitch-name"
                value={pitchName}
                onChange={(e) => setPitchName(e.target.value)}
                placeholder="Donnez un nom à votre pitch..."
              />
            </div>
            <Button onClick={handleSavePitch} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pitch Sections */}
      <div className="grid gap-6">
        {pitchSections.map((section, index) => (
          <Card 
            key={index} 
            className={`border-l-4 ${section.borderColor} ${section.bgColor} shadow-lg hover:shadow-xl transition-all duration-300`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xl">
                  <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                    <section.icon className={`h-5 w-5 ${section.color}`} />
                  </div>
                  {section.title}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingSection(section.key)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingSection === section.key ? (
                <div className="space-y-3">
                  <Textarea
                    defaultValue={section.content}
                    className="min-h-[100px]"
                    id={`edit-${section.key}`}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        const textarea = document.getElementById(`edit-${section.key}`) as HTMLTextAreaElement;
                        handleSaveEdit(section.key, textarea.value);
                      }}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Sauvegarder
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSection(null)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 leading-relaxed">
                  {section.content}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 border-t">
        <Button 
          onClick={onReset}
          variant="outline" 
          className="flex items-center gap-2 h-11"
        >
          <RotateCcw className="h-4 w-4" />
          Nouveau pitch
        </Button>
        
        <Button 
          onClick={handleExportTXT}
          variant="outline"
          className="flex items-center gap-2 h-11"
        >
          <FileText className="h-4 w-4" />
          Export TXT
        </Button>

        <Button 
          onClick={handleExportPDF}
          variant="outline"
          className="flex items-center gap-2 h-11 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
        >
          <Download className="h-4 w-4" />
          Export PDF
        </Button>

        <Button 
          onClick={() => {
            const exportData = {
              name: pitchName,
              projectData,
              pitch: editedPitch,
              template: selectedTemplate,
              exportedAt: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pitch-${projectData.projectName.toLowerCase().replace(/\s+/g, '-')}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
              title: "Export JSON réussi !",
              description: "Votre pitch a été téléchargé en format JSON.",
            });
          }}
          className="flex items-center gap-2 h-11 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
        >
          <Download className="h-4 w-4" />
          Export JSON
        </Button>
        
        <Button 
          variant="outline"
          className="flex items-center gap-2 h-11"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: `Pitch Business - ${projectData.projectName}`,
                text: `Découvrez le pitch de ${projectData.projectName}`,
              });
            }
          }}
        >
          <Share2 className="h-4 w-4" />
          Partager
        </Button>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-gray-500 text-sm">
        <p>Ce pitch a été généré automatiquement. N'hésitez pas à le personnaliser selon vos besoins.</p>
      </div>
    </div>
  );
};

export default PitchDisplay;
