export function extractDigits(text: string): string {
  return text.replace(/\D/g, '')
}

export function normalizeCpf(cpf: string): string | null {
  const digits = extractDigits(cpf)

  if (digits.length === 11) {
    return digits
  }

  if (digits.length > 11) {
    return null
  }

  return null
}

export function parseCpfList(text: string): string[] {
  const separators = /[,;\n\r\t]+/
  const cpfs = text
    .split(separators)
    .map((cpf) => cpf.trim())
    .filter((cpf) => cpf.length > 0)
    .map((cpf) => normalizeCpf(cpf))
    .filter((cpf): cpf is string => cpf !== null)

  return Array.from(new Set(cpfs))
}

export function formatCpf(cpf: string): string {
  const digits = extractDigits(cpf)
  if (digits.length !== 11) return cpf

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
}

/**
 * Gera variações do CPF para busca, incluindo versões sem zeros à esquerda
 * Ex: 05739713870 -> ['05739713870', '5739713870']
 */
export function generateCpfVariations(cpf: string): string[] {
  const digits = extractDigits(cpf)
  if (digits.length !== 11) return [digits]

  const variations: string[] = [digits]

  if (digits[0] === '0') {
    const withoutLeadingZeros = digits.replace(/^0+/, '')
    if (withoutLeadingZeros.length > 0) {
      variations.push(withoutLeadingZeros)
    }
  }

  return variations
}

export function generateCpfPatterns(cpf: string): RegExp[] {
  const digits = extractDigits(cpf)
  if (digits.length !== 11) return []

  const patterns: RegExp[] = []

  const formatted = `${digits.slice(0, 3)}\\.${digits.slice(3, 6)}\\.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
  patterns.push(new RegExp(`${formatted}`, 'g'))

  patterns.push(new RegExp(`${digits}`, 'g'))

  const withDash = `${digits.slice(0, 9)}-${digits.slice(9, 11)}`
  patterns.push(new RegExp(`${withDash}`, 'g'))

  const withSpaces = `${digits.slice(0, 3)}\\s+${digits.slice(3, 6)}\\s+${digits.slice(6, 9)}-${digits.slice(9, 11)}`
  patterns.push(new RegExp(`${withSpaces}`, 'g'))

  return patterns
}

export function searchCpfInText(
  text: string,
  cpf: string,
  contextLength: number = 50
): Array<{ match: string; index: number; snippet: string }> {
  const results: Array<{ match: string; index: number; snippet: string }> = []
  const patterns = generateCpfPatterns(cpf)
  const digits = extractDigits(cpf)

  const digitsOnlyText = extractDigits(text)
  let searchPos = 0
  
  while (searchPos < digitsOnlyText.length) {
    const digitIndex = digitsOnlyText.indexOf(digits, searchPos)
    if (digitIndex === -1) break

    const start = Math.max(0, digitIndex - contextLength)
    const end = Math.min(digitsOnlyText.length, digitIndex + digits.length + contextLength)
    const snippet = digitsOnlyText.slice(start, end)

    let originalSnippet = snippet
    try {
      const textStart = Math.max(0, digitIndex - contextLength)
      const textEnd = Math.min(text.length, digitIndex + digits.length + contextLength)
      originalSnippet = text.slice(textStart, textEnd)
    } catch (e) {}

    results.push({
      match: digits,
      index: digitIndex,
      snippet: `...${originalSnippet}...`
    })

    searchPos = digitIndex + 1
  }

  if (digits.length === 11) {
    const last9Digits = digits.slice(2)
    const last8Digits = digits.slice(3)
    
    searchPos = 0
    while (searchPos < digitsOnlyText.length - 10) {
      const sequence = digitsOnlyText.slice(searchPos, searchPos + 11)
      
      if (sequence.length === 11) {
        const seqLast9 = sequence.slice(2)
        const seqLast8 = sequence.slice(3)
        
        if (seqLast9 === last9Digits || seqLast8 === last8Digits) {
          const alreadyFound = results.some(r => Math.abs(r.index - searchPos) < 11)
          
          if (!alreadyFound) {
            const start = Math.max(0, searchPos - contextLength)
            const end = Math.min(digitsOnlyText.length, searchPos + 11 + contextLength)
            const snippet = digitsOnlyText.slice(start, end)
            
            let originalSnippet = snippet
            try {
              const textStart = Math.max(0, searchPos - contextLength)
              const textEnd = Math.min(text.length, searchPos + 11 + contextLength)
              originalSnippet = text.slice(textStart, textEnd)
            } catch (e) {}
            
            results.push({
              match: sequence,
              index: searchPos,
              snippet: `...${originalSnippet}... (variação)`
            })
          }
        }
      }
      
      searchPos++
    }
  }

  for (const pattern of patterns) {
    let match
    const uniqueMatches = new Set<number>()
    
    while ((match = pattern.exec(text)) !== null) {
      if (uniqueMatches.has(match.index)) continue
      uniqueMatches.add(match.index)

      const start = Math.max(0, match.index - contextLength)
      const end = Math.min(text.length, match.index + match[0].length + contextLength)
      const snippet = text.slice(start, end)

      const alreadyFound = results.some(r => 
        Math.abs(r.index - match.index) < 20
      )

      if (!alreadyFound) {
        results.push({
          match: match[0],
          index: match.index,
          snippet: `...${snippet}...`
        })
      }
    }
  }

  return results
}