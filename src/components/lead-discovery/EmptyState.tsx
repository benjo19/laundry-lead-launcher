
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

const EmptyState = () => {
  return (
    <Card>
      <CardContent className="text-center py-8">
        <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">Započnite pretraživanje</h3>
        <p className="text-slate-600">
          Unesite lokaciju i odaberite industriju za pronalaženje novih leadova
        </p>
      </CardContent>
    </Card>
  );
};

export default EmptyState;
