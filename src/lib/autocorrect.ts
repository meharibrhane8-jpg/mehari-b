/**
 * Tigrinya Autocorrect Dictionary
 * Maps common typos/variations to their standard Ethiopic forms.
 */

export const TIGRINYA_DICTIONARY: Record<string, string[]> = {
  // Common typos or phonetic variations
  "ሰላ": ["ሰላም"],
  "ሰላም": ["ሰላምታ", "ሰላምክ"],
  "ከመ": ["ከመይ", "ከመይ ኢኻ", "ከመይ ኢኺ"],
  "የቐ": ["የቐንየለይ"],
  "የቐንየለ": ["የቐንየለይ"],
  "ሰላምታ": ["ሰላምታ"],
  "ኤርት": ["ኤርትራ"],
  "ኢትዮ": ["ኢትዮጵያ"],
  "ኣስመ": ["ኣስመራ"],
  "ትግር": ["ትግርኛ"],
  "ትግ": ["ትግርኛ"],
  "ደሓ": ["ደሓን"],
  "ደሓን": ["ደሓን ኩን", "ደሓን ውዓል"],
  "ውዓ": ["ውዓል", "ውዓሊ", "ውዓሉ"],
  "ሓደር": ["ሓደር", "ሓደሩ", "ሓደራት"],
  "ጽቡ": ["ጽቡቕ"],
  "ጽቡቕ": ["ጽቡቕ ገይርካ"],
  "ብጣ": ["ብጣዕሚ"],
  "ብጣዕ": ["ብጣዕሚ"],
  "እወ": ["እወ"],
  "ኣይ": ["ኣይፋልን", "ኣይፋል"],
  "በጃ": ["በጃኻ", "በጃኺ"],
  "ይቕ": ["ይቕረታ"],
  "ይቕረታ": ["ይቕረታ"],
  "እንቋ": ["እንቋዕ"],
  "እንቋዕ": ["እንቋዕ ኣብጽሓና"],
};

export const ENGLISH_DICTIONARY: Record<string, string[]> = {
  "hell": ["hello"],
  "hel": ["hello", "help"],
  "the": ["they", "them", "then"],
  "tha": ["thank", "thanks", "that"],
  "how": ["how", "however"],
  "you": ["you", "your", "you're"],
};

/**
 * Finds suggestions for the given input word based on the active dictionary.
 */
export function getSuggestions(input: string, isLatin: boolean): string[] {
  if (!input || input.length < 2) return [];

  const dictionary = isLatin ? ENGLISH_DICTIONARY : TIGRINYA_DICTIONARY;
  
  // Direct prefix match
  const matches = Object.keys(dictionary).filter(key => 
    key.startsWith(input) || input.startsWith(key)
  );

  const results: string[] = [];
  matches.forEach(match => {
    dictionary[match].forEach(suggestion => {
      if (!results.includes(suggestion) && suggestion !== input) {
        results.push(suggestion);
      }
    });
  });

  return results.slice(0, 3);
}
