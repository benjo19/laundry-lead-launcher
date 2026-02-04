import React from 'react';

interface StatusIndicatorsProps {
  savedGoogleMapsApiKey: string;
}

const StatusIndicators = ({ savedGoogleMapsApiKey }: StatusIndicatorsProps) => {
  return (
    <>
      {savedGoogleMapsApiKey && (
        <p className="text-xs text-green-600 mt-1">✓ Google Maps API ključ učitan iz AI postavki</p>
      )}
      <p className="text-xs text-purple-600 mt-1">✓ AI analiza leadova omogućena (Lovable AI Gateway)</p>
    </>
  );
};

export default StatusIndicators;
