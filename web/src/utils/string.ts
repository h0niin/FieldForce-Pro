export const formatEnumText = (val: string): string => {
  if (!val) return '';
  return val
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
