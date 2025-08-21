import { CheckCircle, Circle } from 'lucide-react'; // Importa le nuove icone
import { cn } from '@/lib/utils';

interface PasswordValidatorProps {
  password?: string;
}

interface ValidationRule {
  id: string;
  text: string;
  regex: RegExp;
}

const rules: ValidationRule[] = [
  { id: 'minLength', text: 'Minimo 8 caratteri', regex: /.{8,}/ },
  { id: 'lowercase', text: 'Una lettera minuscola', regex: /[a-z]/ },
  { id: 'uppercase', text: 'Una lettera maiuscola', regex: /[A-Z]/ },
  { id: 'number', text: 'Un numero', regex: /[0-9]/ },
  { id: 'specialChar', text: 'Un carattere speciale', regex: /[!@#$%^&*(),.?":{}|<>]/ }, // Nuova regola
];

export const PasswordValidator = ({ password = '' }: PasswordValidatorProps) => {
  return (
    <div className="space-y-1 pt-2">
      <p className="text-sm font-medium text-gray-700">La tua password deve avere:</p>
      <ul className="text-sm text-gray-600">
        {rules.map((rule) => {
          const isValid = rule.regex.test(password);
          return (
            <li key={rule.id} className="flex items-center transition-colors duration-300">
              {isValid ? (
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
              )}
              <span className={cn(isValid ? 'text-green-600' : 'text-gray-600')}>
                {rule.text}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export const isPasswordValid = (password: string): boolean => {
    return rules.every(rule => rule.regex.test(password));
}