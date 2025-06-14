
import React from 'react';

interface StatusIndicatorsProps {
  savedGoogleMapsApiKey: string;
  isAIConfigured: boolean;
}

const StatusIndicators = ({ savedGoogleMapsApiKey, isAIConfigured }: StatusIndicatorsProps) => {
  return (
    <>
      {savedGoogleMapsApiKey && (
        <p className="text-xs text-green-600 mt-1">✓ Google Maps API ključ učitan iz AI postavki</p>
      )}
      {isAIConfigured && (
        <p className="text-xs text-purple-600 mt-1">✓ AI konfiguriran za naprednu analizu leadova</p>
      )}
    </>
  );
};

export default StatusIndicators;
