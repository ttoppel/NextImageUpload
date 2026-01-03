'use client';

import { useState } from 'react';
import { imageUploadFile } from '@/actions/image';
import { Button, Input } from '@heroui/react';

interface ImageResponseData {
  url?: string;
  fileName?: string;
}

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string>();
  const [selectedFile, setSelectedFile] = useState<File>();
  const [message, setMessage] = useState('');

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Check if files exist and set the first file
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setMessage('');
    } else {
      setSelectedFile(undefined);
      setImageUrl(undefined);
    }
  };

  // Handle file upload to the server
  const onFileUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select a file first!');
      return;
    }

    // Use FormData to prepare the file for the POST request
    const formData = new FormData();
    formData.append(
      'file', // The name expected by the server endpoint
      selectedFile,
      selectedFile.name
    );

    try {
      const response = await imageUploadFile(selectedFile);
      if (response.success) {
        const data = response.payload as ImageResponseData;
        setImageUrl(data.url);
        setMessage(`File uploaded successfully: ${data.url}`);
      } else setMessage(`File upload Failure: ${response.message}, ${response.error}`);
    } catch (error) {
      setMessage('File upload failed!');
      console.error('Upload error:', error);
    }
  };

  // Display file details or upload prompt
  const renderFileData = () => {
    if (selectedFile) {
      return (
        <div>
          <h2>File Details:</h2>
          <p>File Name: {selectedFile?.name}</p>
          <p>File Type: {selectedFile?.type}</p>
          <p>Last Modified: {selectedFile?.lastModified.toLocaleString()}</p>
        </div>
      );
    } else {
      return <p>Choose a file before uploading.</p>;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div>
          <div>
            <Input type="file" title="Choose a File: " onChange={handleFileChange} />
            <br />
            <br />
            <Button onPress={onFileUpload}>Upload!</Button>
            <br />
            <br />
          </div>
          {renderFileData()}
          <br />
          <br />
          {message && <p style={{ color: message.includes('failed') ? 'red' : 'green' }}>{message}</p>}
          <br />
          <br />
          {imageUrl && <img src={imageUrl} />}
        </div>
      </main>
    </div>
  );
}
