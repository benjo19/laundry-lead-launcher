
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Eye, Trash2, Edit3 } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  category: 'intro' | 'follow-up' | 'proposal' | 'reminder' | 'custom';
  created_at: string;
}

interface TemplateBuilderProps {
  onTemplateSelect?: (template: EmailTemplate) => void;
}

const TemplateBuilder = ({ onTemplateSelect }: TemplateBuilderProps) => {
  const [templates, setTemplates] = useLocalStorage<EmailTemplate[]>('email-templates', []);
  const [isBuilding, setIsBuilding] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [templateCategory, setTemplateCategory] = useState<EmailTemplate['category']>('custom');
  const { toast } = useToast();

  const availableVariables = [
    '{{company_name}}',
    '{{recipient_name}}',
    '{{your_name}}',
    '{{your_company}}',
    '{{industry}}',
    '{{location}}',
    '{{date}}',
    '{{meeting_time}}',
    '{{phone_number}}'
  ];

  const getUsedVariables = (text: string): string[] => {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[0]);
    }
    return [...new Set(matches)];
  };

  const insertVariable = (variable: string) => {
    setTemplateContent(prev => prev + ' ' + variable + ' ');
  };

  const saveTemplate = () => {
    if (!templateName || !templateSubject || !templateContent) {
      toast({
        title: "Nedostaju podaci",
        description: "Molimo unesite naziv, naslov i sadržaj predloška.",
        variant: "destructive"
      });
      return;
    }

    const usedVariables = getUsedVariables(templateSubject + ' ' + templateContent);
    
    const template: EmailTemplate = {
      id: editingTemplate?.id || Date.now().toString(),
      name: templateName,
      subject: templateSubject,
      content: templateContent,
      variables: usedVariables,
      category: templateCategory,
      created_at: editingTemplate?.created_at || new Date().toISOString()
    };

    if (editingTemplate) {
      setTemplates(templates.map(t => t.id === editingTemplate.id ? template : t));
      toast({
        title: "Predložak ažuriran",
        description: `"${templateName}" je uspješno ažuriran.`
      });
    } else {
      setTemplates([...templates, template]);
      toast({
        title: "Predložak spremljen",
        description: `"${templateName}" je uspješno spremljen.`
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setIsBuilding(false);
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateSubject('');
    setTemplateContent('');
    setTemplateCategory('custom');
  };

  const editTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateSubject(template.subject);
    setTemplateContent(template.content);
    setTemplateCategory(template.category);
    setIsBuilding(true);
  };

  const deleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
    toast({
      title: "Predložak obrisan",
      description: "Predložak je uspješno obrisan."
    });
  };

  const previewTemplate = (template: EmailTemplate) => {
    let previewSubject = template.subject;
    let previewContent = template.content;
    
    // Replace variables with sample data for preview
    const sampleData: Record<string, string> = {
      '{{company_name}}': 'Primjer d.o.o.',
      '{{recipient_name}}': 'Ana Anić',
      '{{your_name}}': 'Vaše ime',
      '{{your_company}}': 'Vaša tvrtka',
      '{{industry}}': 'usluge',
      '{{location}}': 'Zagreb, Hrvatska',
      '{{date}}': new Date().toLocaleDateString('hr-HR'),
      '{{meeting_time}}': '14:00',
      '{{phone_number}}': '+385 1 234 5678'
    };

    Object.entries(sampleData).forEach(([variable, value]) => {
      previewSubject = previewSubject.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
      previewContent = previewContent.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    toast({
      title: previewSubject,
      description: previewContent.substring(0, 200) + (previewContent.length > 200 ? '...' : ''),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Email Predlošci</span>
          <Button 
            onClick={() => setIsBuilding(!isBuilding)} 
            variant={isBuilding ? "outline" : "default"}
          >
            {isBuilding ? (
              <>Otkaži</>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Novi predložak
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isBuilding ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="template-name">Naziv predloška</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Unesite naziv predloška"
                />
              </div>
              <div>
                <Label htmlFor="template-category">Kategorija</Label>
                <Select value={templateCategory} onValueChange={(value: EmailTemplate['category']) => setTemplateCategory(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intro">Uvodna prezentacija</SelectItem>
                    <SelectItem value="follow-up">Follow-up email</SelectItem>
                    <SelectItem value="proposal">Poslovni prijedlog</SelectItem>
                    <SelectItem value="reminder">Podsjetnik</SelectItem>
                    <SelectItem value="custom">Prilagođeni</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="template-subject">Naslov emaila</Label>
              <Input
                id="template-subject"
                value={templateSubject}
                onChange={(e) => setTemplateSubject(e.target.value)}
                placeholder="Unesite naslov emaila"
              />
            </div>

            <div>
              <Label>Dostupne varijable</Label>
              <div className="flex flex-wrap gap-2 mt-2 mb-2">
                {availableVariables.map((variable) => (
                  <Button
                    key={variable}
                    variant="outline"
                    size="sm"
                    onClick={() => insertVariable(variable)}
                  >
                    {variable}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="template-content">Sadržaj emaila</Label>
              <Textarea
                id="template-content"
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                placeholder="Unesite sadržaj emaila..."
                className="min-h-48"
              />
            </div>

            {(templateSubject + templateContent) && (
              <div>
                <Label>Korištene varijable u predlošku</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {getUsedVariables(templateSubject + ' ' + templateContent).map((variable) => (
                    <Badge key={variable} variant="secondary">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={saveTemplate}>
                <Save className="h-4 w-4 mr-2" />
                {editingTemplate ? 'Ažuriraj' : 'Spremi'} predložak
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Otkaži
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nemate spremljenih predložaka. Stvorite prvi predložak klikom na "Novi predložak".
              </p>
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => previewTemplate(template)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editTemplate(template)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        {onTemplateSelect && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onTemplateSelect(template)}
                          >
                            Koristi
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Naslov:</strong> {template.subject}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      {template.content.substring(0, 150)}
                      {template.content.length > 150 && '...'}
                    </p>
                    {template.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="secondary" className="text-xs">
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TemplateBuilder;
