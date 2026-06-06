import { Input, type InputProps } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

interface SearchFilterProps extends InputProps {
    placeholder?: string;
    className?: string;
}

export default function SearchFilter({ placeholder = 'Search ...', style, className, ...props }: SearchFilterProps) {
    return (
        <Input
            prefix={<SearchOutlined style={{ color: 'var(--text-color)', opacity: 0.5, marginRight: 4 }} />}
            placeholder={placeholder}
            className={className}
            style={{
                borderRadius: 999, // Pill shape
                padding: '6px 16px', // Slightly adjusted padding for page context
                width: '100%',
                maxWidth: 400,
                ...style,
            }}
            // Remove bordered={false} to let AntD handle borders via theme? No, design was custom.
            // Let's rely on global CSS or specific dark override.
            // Actually, standard AntD Input with rounded styling is best.
            // But for 'pill' we need custom.
            // Let's use CSS vars for colors.
            {...props}
        />
    );
}
