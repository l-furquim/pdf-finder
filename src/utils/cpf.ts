import { CpfValidationResult } from '../types';

export const normalizeCpf = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};

export const validateAndNormalizeCpf = (
  cpf: string,
  permissiveMode: boolean
): CpfValidationResult => {
  const digits = normalizeCpf(cpf);

  if (digits.length === 11) {
    return { isValid: true, normalized: digits };
  }

  if (digits.length < 11 && permissiveMode) {
    const padded = digits.padStart(11, '0');
    return { isValid: true, normalized: padded };
  }

  if (digits.length > 11) {
    return {
      isValid: false,
      normalized: '',
      error: 'CPF possui mais de 11 dígitos',
    };
  }

  return {
    isValid: false,
    normalized: '',
    error: 'CPF possui menos de 11 dígitos',
  };
};

export const validateCpfList = (
  cpfList: string[],
  permissiveMode: boolean
): { valid: string[]; invalid: string[] } => {
  const valid: string[] = [];
  const invalid: string[] = [];

  cpfList.forEach((cpf) => {
    const result = validateAndNormalizeCpf(cpf, permissiveMode);
    if (result.isValid) {
      valid.push(result.normalized);
    } else {
      invalid.push(cpf);
    }
  });

  return { valid, invalid };
};

export const formatCpf = (cpf: string): string => {
  const digits = normalizeCpf(cpf);
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

export const createCpfRegexPatterns = (cpfDigits: string): RegExp[] => {
  if (cpfDigits.length !== 11) return [];

  return [
    new RegExp(`\\b${cpfDigits.slice(0, 3)}\\.${cpfDigits.slice(3, 6)}\\.${cpfDigits.slice(6, 9)}-${cpfDigits.slice(9, 11)}\\b`, 'g'),
    new RegExp(`\\b${cpfDigits}\\b`, 'g'),
    new RegExp(`\\b${cpfDigits.slice(0, 9)}-${cpfDigits.slice(9, 11)}\\b`, 'g'),
  ];
};

export const searchCpfInText = (
  text: string,
  cpfDigits: string
): { found: boolean; snippet: string } => {
  const textDigitsOnly = text.replace(/\D/g, '');
  const textLower = text.toLowerCase();

  if (textDigitsOnly.includes(cpfDigits)) {
    const index = textDigitsOnly.indexOf(cpfDigits);
    const originalIndex = findOriginalIndex(text, index);
    const snippet = extractSnippet(text, originalIndex);
    return { found: true, snippet };
  }

  const patterns = createCpfRegexPatterns(cpfDigits);
  for (const pattern of patterns) {
    const match = pattern.exec(textLower);
    if (match) {
      const snippet = extractSnippet(text, match.index);
      return { found: true, snippet };
    }
  }

  return { found: false, snippet: '' };
};

const findOriginalIndex = (text: string, digitsIndex: number): number => {
  let digitCount = 0;
  for (let i = 0; i < text.length; i++) {
    if (/\d/.test(text[i])) {
      if (digitCount === digitsIndex) return i;
      digitCount++;
    }
  }
  return 0;
};

const extractSnippet = (text: string, index: number): string => {
  const start = Math.max(0, index - 30);
  const end = Math.min(text.length, index + 50);
  let snippet = text.slice(start, end);

  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';

  return snippet.replace(/\s+/g, ' ').trim();
};
