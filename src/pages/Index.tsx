
import { useState } from "react";
import ProjectForm from "@/components/ProjectForm";
import PitchDisplay from "@/components/PitchDisplay";
import TemplateSelector from "@/components/TemplateSelector";
import SavedPitches from "@/components/SavedPitches";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, Target, Users, Gift, Megaphone, Plus, Archive } from "lucide-react";
import { generatePitchFromTemplate } from "@/utils/pitchTemplates";
import { usePitchStorage, SavedPitch } from "@/hooks/usePitchStorage";

export interface ProjectData {
  projectName: string;
  projectDescription: string;
  targetMarket: string;
  keyFeatures: string;
}

export interface GeneratedPitch {
  problem: string;
  solution: string;
  targetCustomer: string;
  valueProposition: string;
  channels: string;
}

const Index = () => {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [generatedPitch, setGeneratedPitch] = useState<GeneratedPitch | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("lean-canvas");
  const [activeTab, setActiveTab] = useState<string>("create");

  const { savedPitches, deletePitch } = usePitchStorage();

  const handleProjectSubmit = async (data: ProjectData) => {
    setIsGenerating(true);
    setProjectData(data);
    
    // Simulate AI generation with realistic delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate pitch based on selected template
    const pitch = generatePitchFromTemplate(selectedTemplate, data);
    setGeneratedPitch(pitch);
    setIsGenerating(false);
  };

  const handleLoadSavedPitch = (savedPitch: SavedPitch) => {
    setProjectData(savedPitch.projectData);
    setGeneratedPitch(savedPitch.pitch);
    setSelectedTemplate(savedPitch.template);
    setActiveTab("create");
  };

  const resetForm = () => {
    setProjectData(null);
    setGeneratedPitch(null);
    setSelectedTemplate("lean-canvas");
  };

  const handleNewPitch = () => {
    setActiveTab("create");
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-violet-100 rounded-full">
              <Lightbulb className="h-8 w-8 text-violet-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Assistant Pitch Business
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            Transformez votre idée en pitch professionnel avec notre assistant IA basé sur la méthode Lean Canvas
          </p>
          
          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-md mx-auto">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Créer un pitch
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Pitchs sauvegardés ({savedPitches.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tab Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="create">
            {/* Feature Overview */}
            {!projectData && (
              <div className="grid md:grid-cols-5 gap-6 mb-12">
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                  <Target className="h-8 w-8 text-red-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Problème</h3>
                  <p className="text-sm text-gray-600">Identification claire du problème à résoudre</p>
                </Card>
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                  <Lightbulb className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Solution</h3>
                  <p className="text-sm text-gray-600">Proposition de solution innovante</p>
                </Card>
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                  <Users className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Client Cible</h3>
                  <p className="text-sm text-gray-600">Définition précise de votre audience</p>
                </Card>
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                  <Gift className="h-8 w-8 text-green-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Valeur</h3>
                  <p className="text-sm text-gray-600">Proposition de valeur unique</p>
                </Card>
                <Card className="p-6 text-center hover:shadow-lg transition-shadow">
                  <Megaphone className="h-8 w-8 text-purple-500 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Distribution</h3>
                  <p className="text-sm text-gray-600">Canaux pour atteindre vos clients</p>
                </Card>
              </div>
            )}

            {/* Main Content */}
            <div className="max-w-4xl mx-auto">
              {!generatedPitch ? (
                <div className="space-y-8">
                  {!projectData && (
                    <TemplateSelector 
                      selectedTemplate={selectedTemplate}
                      onSelectTemplate={setSelectedTemplate}
                    />
                  )}
                  <ProjectForm 
                    onSubmit={handleProjectSubmit} 
                    isGenerating={isGenerating}
                    selectedTemplate={selectedTemplate}
                  />
                </div>
              ) : (
                <PitchDisplay 
                  pitch={generatedPitch} 
                  projectData={projectData!}
                  onReset={resetForm}
                  onPitchUpdate={setGeneratedPitch}
                  selectedTemplate={selectedTemplate}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="saved">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Mes pitchs sauvegardés</h2>
                <Button onClick={handleNewPitch} className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau pitch
                </Button>
              </div>
              <SavedPitches 
                savedPitches={savedPitches}
                onLoadPitch={handleLoadSavedPitch}
                onDeletePitch={deletePitch}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
