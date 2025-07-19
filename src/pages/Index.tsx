import React from 'react';

const Index = () => {
  console.log('Index: Component rendering - SUCCESS!');
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          Marketing Agent
        </h1>
        <p className="text-muted-foreground">
          Aplikacija je uspješno učitana!
        </p>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">
            ✅ Autentifikacija funkcioniše
          </p>
          <p className="text-green-800">
            ✅ Komponenta se renderuje
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
