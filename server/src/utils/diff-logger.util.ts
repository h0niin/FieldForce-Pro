export function generateEntityDiff(oldData: any, newData: any): string[] {
  const changes: string[] = [];
  for (const key in newData) {
    let oldVal = oldData[key];
    let newVal = newData[key];

    // Normalize null, undefined, and empty strings to just empty strings
    if (oldVal === null || oldVal === undefined) oldVal = '';
    if (newVal === null || newVal === undefined) newVal = '';

    // Deep comparison for arrays/JSON (Critical for fields like 'tags')
    if (Array.isArray(oldVal) || Array.isArray(newVal) || typeof oldVal === 'object' || typeof newVal === 'object') {
      if (JSON.stringify(oldVal || []) === JSON.stringify(newVal || [])) continue;
    }

    // Skip if functionally identical
    if (oldVal === newVal) continue;

    // Format key to Title Case (e.g., 'company_name' -> 'Company Name')
    let formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // Explicitly handle specific acronyms
    const words = formattedKey.split(' ');
    formattedKey = words.map(word => {
      if (word.toLowerCase() === 'id') return 'ID';
      if (word.toLowerCase() === 'giai') return 'GIAI';
      if (word.toLowerCase() === 'wo') return 'WO';
      if (word.toLowerCase() === 'sla') return 'SLA';
      return word;
    }).join(' ');

    // Format raw enums (uppercase snake_case to Title Case)
    const formatValue = (v: any) => {
      if (typeof v === 'string' && /^[A-Z_]+$/.test(v) && v.length > 0) {
        return v.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
      }
      return v;
    };

    const formattedOld = formatValue(oldVal);
    const formattedNew = formatValue(newVal);

    const displayOld = formattedOld === '' ? 'Empty' : formattedOld;
    const displayNew = formattedNew === '' ? 'Empty' : formattedNew;

    changes.push(`${formattedKey} updated from '${displayOld}' to '${displayNew}'`);
  }
  return changes;
}
