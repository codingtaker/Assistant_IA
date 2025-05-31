
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { pitchTemplates, PitchTemplate } from "@/utils/pitchTemplates";

interface TemplateSelectorProps {
  selectedTemplate: string;
  onSelectTemplate: (templateId: string) => void;
}

const TemplateSelector = ({ selectedTemplate, onSelectTemplate }: TemplateSelectorProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Choisissez un style de pitch</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {pitchTemplates.map((template: PitchTemplate) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedTemplate === template.id 
                ? 'ring-2 ring-violet-500 bg-violet-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onSelectTemplate(template.id)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-2xl">{template.icon}</span>
                {template.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{template.description}</p>
              {selectedTemplate === template.id && (
                <Badge className="mt-2 bg-violet-100 text-violet-700">
                  Sélectionné
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TemplateSelector;
