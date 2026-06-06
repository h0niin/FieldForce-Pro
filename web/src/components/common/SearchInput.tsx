import { Input } from 'antd';
import { useState, useEffect, useRef } from 'react';

interface SearchInputProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  delay?: number;
  style?: React.CSSProperties;
}

export default function SearchInput({
  placeholder = 'Search...',
  onSearch,
  delay = 300,
  style,
}: SearchInputProps) {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onSearch(value);
    }, delay);
    return () => clearTimeout(timerRef.current);
  }, [value, delay, onSearch]);

  return (
    <Input.Search
      placeholder={placeholder}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      allowClear
      style={{ width: 300, ...style }}
    />
  );
}
