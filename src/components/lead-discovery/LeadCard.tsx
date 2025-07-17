
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, Phone, Mail, Globe, Star, CheckCircle, AlertCircle, Brain, Target, Clock, Users } from 'lucide-react';
import { AnalyzedLead } from '@/services/aiLeadAnalysisService';

interface LeadCardProps {
  lead: AnalyzedLead;
  onAddLead: (lead: AnalyzedLead) => void;
  onNavigateToEmailGenerator?: (email: string, company: string) => void;
}

const LeadCard = ({ lead, onAddLead, onNavigateToEmailGenerator }: LeadCardProps) => {
  const handleEmailClick = () => {
    if (lead.email && onNavigateToEmailGenerator) {
      onNavigateToEmailGenerator(lead.email, lead.name);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getPotentialColor = (potential: string) => {
    switch (potential) {
      case 'Visok': return 'bg-green-100 text-green-800';
      case 'Srednji': return 'bg-yellow-100 text-yellow-800';
      case 'Nizak': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-slate-900">{lead.name}</h3>
            {lead.aiAnalysis && (
              <div className="flex items-center gap-1">
                <Badge className={`${getScoreColor(lead.aiAnalysis.score)} border font-medium`}>
                  <Brain className="h-3 w-3 mr-1" />
                  {lead.aiAnalysis.score}/10
                </Badge>
                <Badge className={getPotentialColor(lead.aiAnalysis.potential)}>
                  {lead.aiAnalysis.potential}
                </Badge>
              </div>
            )}
          </div>
          <div className="flex items-center text-slate-600 mt-1">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">{lead.address}</span>
          </div>
          <div className="flex items-center mt-2 space-x-4">
            {lead.rating && (
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                <span className="text-sm text-slate-600 ml-1">{lead.rating.toFixed(1)}</span>
                {lead.user_ratings_total && (
                  <span className="text-xs text-slate-500 ml-1">({lead.user_ratings_total})</span>
                )}
              </div>
            )}
            {lead.business_status && (
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-1 ${
                  lead.business_status === 'OPERATIONAL' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-xs text-slate-600">
                  {lead.business_status === 'OPERATIONAL' ? 'Aktivan' : 'Zatvoren'}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <div className="flex flex-wrap gap-1">
            {lead.types.slice(0, 2).map((type) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {type.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
          <Button 
            size="sm"
            onClick={() => onAddLead(lead)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Dodaj
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-600 mb-3">
        <div className="flex items-center">
          <Phone className="h-4 w-4 mr-1" />
          <span>{lead.phone || 'Broj nije dostupan'}</span>
        </div>
        <div className="flex items-center">
          <Globe className="h-4 w-4 mr-1" />
          {lead.website ? (
            <a 
              href={lead.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline truncate"
            >
              {lead.website.replace(/^https?:\/\//, '')}
            </a>
          ) : (
            <span className="text-slate-400">Website nije dostupan</span>
          )}
        </div>
        <div className="flex items-center">
          <Mail className="h-4 w-4 mr-1" />
          {lead.email ? (
            <div className="flex items-center">
              <button 
                onClick={handleEmailClick}
                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                title="Kliknite za slanje emaila"
              >
                {lead.email}
              </button>
              {lead.emailScraped && (
                <div className="ml-1" title="Email automatski pronađen">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                </div>
              )}
              {lead.emailSource && lead.emailSource !== 'website' && (
                <div className="ml-2">
                  <Badge variant="outline" className="text-xs">
                    {lead.emailSource}
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center">
              <span className="text-slate-400">Email nije pronađen</span>
              <div className="ml-1" title="Email potrebno pronaći ručno">
                <AlertCircle className="h-3 w-3 text-orange-500" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Social Media Profiles */}
      {lead.socialProfiles && Object.keys(lead.socialProfiles).length > 0 && (
        <div className="border-t pt-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-slate-700">Društvene mreže:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(lead.socialProfiles).map(([platform, url]) => (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs hover:bg-blue-100 transition-colors"
              >
                {platform === 'linkedin' && '💼'}
                {platform === 'facebook' && '📘'}
                {platform === 'yellowPages' && '📞'}
                <span className="ml-1 capitalize">
                  {platform === 'yellowPages' ? 'Yellow Pages' : platform}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {lead.aiAnalysis && (
        <div className="border-t pt-3 mt-3 bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-purple-600" />
            <span className="font-medium text-purple-800">AI Analiza</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Target className="h-3 w-3 text-blue-600" />
                <span className="font-medium text-slate-700">Pristup:</span>
              </div>
              <p className="text-slate-600 text-xs">{lead.aiAnalysis.approach}</p>
            </div>
            
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Clock className="h-3 w-3 text-green-600" />
                <span className="font-medium text-slate-700">Timing:</span>
              </div>
              <p className="text-slate-600 text-xs">{lead.aiAnalysis.contactTiming}</p>
            </div>
          </div>

          {lead.aiAnalysis.keyPoints.length > 0 && (
            <div className="mt-2">
              <span className="font-medium text-slate-700 text-xs">Ključne točke:</span>
              <ul className="mt-1 space-y-1">
                {lead.aiAnalysis.keyPoints.slice(0, 2).map((point, index) => (
                  <li key={index} className="text-xs text-slate-600 flex items-start">
                    <span className="text-purple-500 mr-1">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-2 text-xs text-slate-500 italic">
            {lead.aiAnalysis.reasoning}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadCard;
