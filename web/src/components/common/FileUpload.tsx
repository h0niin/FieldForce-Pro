import { Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload';
import { useState } from 'react';

interface FileUploadProps {
  onUpload: (file: File) => void | Promise<void>;
  accept?: string;
  maxSizeMB?: number;
  buttonText?: string;
}

export default function FileUpload({
  onUpload,
  accept,
  maxSizeMB = 5,
  buttonText = 'Upload File',
}: FileUploadProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const props: UploadProps = {
    beforeUpload: (file) => {
      const isValidSize = file.size / 1024 / 1024 < maxSizeMB;
      if (!isValidSize) {
        message.error(`File must be smaller than ${maxSizeMB}MB`);
        return false;
      }
      onUpload(file);
      return false;
    },
    fileList,
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    maxCount: 1,
    accept,
  };

  return (
    <Upload {...props}>
      <Button icon={<UploadOutlined />}>{buttonText}</Button>
    </Upload>
  );
}
