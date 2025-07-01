
import React from 'react';
import StatusIndicators from './StatusIndicators';
import { User } from '@supabase/supabase-js';

interface LeadDiscoveryHeaderProps {
  user: User | null;
  savedGoogleMapsApiKey: string;
  isAIConfigured: boolean;
}

const LeadDiscoveryHeader = ({ user, savedGoogleMapsApiKey, isAIConfigured }: LeadDiscoveryHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Lead Discovery</h2>
        <p className="text-slate-600 text-sm sm:text-base">
          Pronađite nove leadove pomoću Google Maps i AI analize - email adrese se traže samo na web stranicama
        </p>
        <StatusIndicators 
          savedGoogleMapsApiKey={savedGoogleMapsApiKey}
          isAIConfigured={isAIConfigured}
        />
        {!user && (
          <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              ⚠️ Niste prijavljeni - leadovi se neće spremiti u bazu. Idite na Settings za prijavu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadDiscoveryHeader;
