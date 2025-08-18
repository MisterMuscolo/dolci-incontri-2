import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  description: string;
  features: string[];
}

const creditPackages: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Pacchetto Base',
    credits: 50,
    price: 9.99,
    description: 'Ideale per iniziare a esplorare.',
    features: ['50 crediti', 'Accesso base'],
  },
  {
    id: 'standard',
    name: 'Pacchetto Standard',
    credits: 150,
    price: 24.99,
    description: 'Più crediti per più opportunità.',
    features: ['150 crediti', 'Risparmio del 15%'],
  },
  {
    id: 'premium',
    name: 'Pacchetto Premium',
    credits: 300,
    price: 39.99,
    description: 'Per chi cerca il meglio.',
    features: ['300 crediti', 'Risparmio del 25%', 'Supporto prioritario'],
  },
  {
    id: 'gold',
    name: 'Pacchetto Gold',
    credits: 500,
    price: 59.99,
    description: 'Massima visibilità e interazioni.',
    features: ['500 crediti', 'Risparmio del 30%', 'Annunci in evidenza'],
  },
  {
    id: 'platinum',
    name: 'Pacchetto Platinum',
    credits: 1000,
    price: 99.99,
    description: 'Il pacchetto definitivo per i più attivi.',
    features: ['1000 crediti', 'Risparmio del 35%', 'Funzionalità esclusive'],
  },
  {
    id: 'unlimited',
    name: 'Pacchetto Illimitato',
    credits: 2000,
    price: 179.99,
    description: 'Non rimanere mai senza crediti.',
    features: ['2000 crediti', 'Risparmio del 40%', 'Tutti i vantaggi premium'],
  },
];

const BuyCredits = () => {
  const handlePurchase = (packageName: string, price: number) => {
    alert(`Hai cliccato per acquistare ${packageName} per €${price.toFixed(2)}. La funzionalità di acquisto sarà implementata qui.`);
    // Qui andrebbe la logica di integrazione con un sistema di pagamento
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Acquista Crediti</h1>
        <p className="text-lg text-gray-600 mb-10 text-center">
          Scegli il pacchetto di crediti più adatto alle tue esigenze e sblocca tutte le funzionalità!
        </p>

        <div className="flex flex-col gap-6 mb-10">
          {creditPackages.map((pkg) => (
            <Card key={pkg.id} className="w-full flex flex-col justify-between p-5 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-3 text-center">
                <CardTitle className="text-xl font-bold text-rose-600">{pkg.name}</CardTitle>
                <CardDescription className="text-gray-600">{pkg.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col items-center justify-center py-3">
                <p className="text-4xl font-extrabold text-gray-900 mb-2">
                  {pkg.credits} <span className="text-rose-500">crediti</span>
                </p>
                <p className="text-2xl font-bold text-gray-700 mb-5">
                  €{pkg.price.toFixed(2)}
                </p>
                <ul className="text-left text-gray-700 space-y-1 mb-5 w-full">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full bg-rose-500 hover:bg-rose-600 text-base py-4"
                  onClick={() => handlePurchase(pkg.name, pkg.price)}
                >
                  Acquista Ora
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link to="/dashboard">
            <Button variant="outline" className="border-rose-500 text-rose-500 hover:bg-rose-50 hover:text-rose-600">
              Torna alla Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BuyCredits;