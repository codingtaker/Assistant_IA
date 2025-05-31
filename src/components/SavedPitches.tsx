
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  Eye, 
  Calendar,
  FileText
} from "lucide-react";
import { SavedPitch } from "@/hooks/usePitchStorage";
import { pitchTemplates } from "@/utils/pitchTemplates";

interface SavedPitchesProps {
  savedPitches: SavedPitch[];
  onLoadPitch: (pitch: SavedPitch) => void;
  onDeletePitch: (id: string) => void;
}

const SavedPitches = ({ savedPitches, onLoadPitch, onDeletePitch }: SavedPitchesProps) => {
  const getTemplateInfo = (templateId: string) => {
    return pitchTemplates.find(t => t.id === templateId) || pitchTemplates[0];
  };

  if (savedPitches.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun pitch sauvegardé
          </h3>
          <p className="text-gray-600">
            Créez votre premier pitch pour le retrouver ici
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900">Mes pitchs sauvegardés</h3>
      <div className="grid gap-4">
        {savedPitches.map((pitch) => {
          const template = getTemplateInfo(pitch.template);
          return (
            <Card key={pitch.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{pitch.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {pitch.projectData.projectName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {template.icon} {template.name}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {pitch.projectData.projectDescription}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {new Date(pitch.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onLoadPitch(pitch)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      Voir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeletePitch(pitch.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SavedPitches;
