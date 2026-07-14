
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Rocket } from "lucide-react";
import { ProjectData } from "@/pages/Index";

interface ProjectFormProps {
  onSubmit: (data: ProjectData) => void;
  isGenerating: boolean;
  selectedTemplate: string;
}

const ProjectForm = ({ onSubmit, isGenerating, selectedTemplate }: ProjectFormProps) => {
  const [formData, setFormData] = useState<ProjectData>({
    projectName: "",
    projectDescription: "",
    targetMarket: "",
    keyFeatures: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.projectName && formData.projectDescription && formData.targetMarket && formData.keyFeatures) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof ProjectData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="text-center pb-6">
        <CardTitle className="flex items-center justify-center gap-3 text-2xl text-gray-900">
          <div className="p-2 bg-violet-100 rounded-full">
            <Rocket className="h-6 w-6 text-violet-600" />
          </div>
          Décrivez votre projet
        </CardTitle>
        <p className="text-gray-600 mt-2">
          Remplissez ces informations pour générer votre pitch personnalisé
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="projectName" className="text-sm font-medium text-gray-700">
              Nom du projet *
            </label>
            <Input
              id="projectName"
              placeholder="Ex: MonApp révolutionnaire"
              value={formData.projectName}
              onChange={(e) => handleInputChange("projectName", e.target.value)}
              className="h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="projectDescription" className="text-sm font-medium text-gray-700">
              Description du projet *
            </label>
            <Textarea
              id="projectDescription"
              placeholder="Décrivez brièvement votre projet, ses objectifs et ce qu'il apporte de nouveau..."
              value={formData.projectDescription}
              onChange={(e) => handleInputChange("projectDescription", e.target.value)}
              className="min-h-[100px] resize-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="targetMarket" className="text-sm font-medium text-gray-700">
              Marché cible *
            </label>
            <Input
              id="targetMarket"
              placeholder="Ex: Professionnels du marketing, PME, étudiants..."
              value={formData.targetMarket}
              onChange={(e) => handleInputChange("targetMarket", e.target.value)}
              className="h-12"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="keyFeatures" className="text-sm font-medium text-gray-700">
              Fonctionnalités clés *
            </label>
            <Textarea
              id="keyFeatures"
              placeholder="Listez les principales fonctionnalités qui rendent votre projet unique..."
              value={formData.keyFeatures}
              onChange={(e) => handleInputChange("keyFeatures", e.target.value)}
              className="min-h-[80px] resize-none"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white font-semibold text-lg shadow-lg"
            disabled={isGenerating || !formData.projectName || !formData.projectDescription || !formData.targetMarket || !formData.keyFeatures}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-5 w-5" />
                Générer mon pitch
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProjectForm;
