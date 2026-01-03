'use client';

import React, { memo, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { type Editor as TinyMCEEditor } from 'tinymce';
import { imageUploadFile } from '@/actions/image';

const baseUrl = process.env.NEXT_APP_API_URL;

interface BlobInfo {
  id: () => string;
  name: () => string;
  filename: () => string;
  blob: () => Blob;
  base64: () => string;
  blobUri: () => string;
  uri: () => string | undefined;
}

interface BlobInfoData {
  id?: string;
  name?: string;
  filename?: string;
  blob: Blob;
  base64: string;
  blobUri?: string;
  uri?: string;
}
export type EditorProps = {
  initialContent?: string;
  onEditorChange?: (newValue: string, editor: TinyMCEEditor) => void;
  artistId?: string | number;
};

const defaultValue = `<p>Edit your page content.</p>`;
const PageEditor = ({ artistId, initialContent, onEditorChange }: EditorProps) => {
  const editorRef = useRef<TinyMCEEditor>(null);
  const imagesUploadUrl = `/api/artist/image?id=${artistId}`;

  // const handleFilePicker = useCallback((callback: (value: string, meta?: Record<string, any>) => void, value: string, meta: Record<string, any>) => {
  //     const input: HTMLInputElement = document.createElement('input');
  //     input.setAttribute('type', 'file');
  //     input.setAttribute('accept', 'image/*');
  //     input.click();

  //     input.onchange = async () => {
  //         const file = input.files ? input.files[0] : undefined;
  //         if (file) {
  //             const formData = new FormData();
  //             formData.append('image', file);

  //             try {
  //                 const id = artistId;
  //                 const res = await imageUpload(id || '', formData);
  //                 if (res) {
  //                     if (res.success) {
  //                         const imageUrl = res.payload?.location; // Assuming your server returns the URL
  //                         callback(imageUrl, { title: file.name });
  //                         // add image to page within artist context
  //                         //updatePage(null, imageUrl, null);
  //                     } else {
  //                         console.error(res.error || res.message);
  //                     }
  //                 } else {
  //                     console.error('No response from image upload');
  //                 }
  //             } catch (error) {
  //                 console.error('Image upload failed:', error);
  //                 // Handle upload error (e.g., show a notification)
  //             }
  //         }
  //     };
  // }, [artistId]); // useCallback ensures the handler function identity is stable

  // Custom image upload handler function
  const handleImageUpload = (blobInfo: BlobInfo): Promise<any> =>
    // Return a Promise which resolves to the image URL
    new Promise((success, failure) => {
      const imageFile = blobInfo.blob() as File;
      console.debug('imageFile: ', imageFile);

      imageUploadFile(imageFile)
        .then((res) => {
          // Assuming the server response has a 'location' field with the URL
          if (res.success) {
            const location = res.payload; // Assuming your server returns the URL
            success(location); // Call success with the new image URL
          } else {
            failure(res.error || res.message);
          }
        })
        .catch((error) => {
          failure('Image upload failed: ' + error.message);
        });
    });
  return (
    <Editor
      onInit={(_evt, editor) => (editorRef.current = editor)}
      initialValue={initialContent || defaultValue}
      onEditorChange={(newValue, editor) => onEditorChange?.(newValue, editor)}
      licenseKey="gpl"
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      init={{
        height: 500,
        menubar: false,
        statusbar: false,
        branding: false,
        plugins: [
          'advlist',
          'autolink',
          'lists',
          'link',
          'image',
          'charmap',
          'preview',
          'anchor',
          'searchreplace',
          'visualblocks',
          'code',
          'fullscreen',
          'insertdatetime',
          'media',
          'table',
          'code',
          'help',
          'wordcount',
          'quickbars',
        ],
        toolbar:
          'undo redo | visualblocks | blocks | fontsize |' +
          'bold italic underline strikethrough | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist | image link |' +
          'removeformat  | help',
        //quickbars_image_toolbar: 'alignleft aligncenter alignright | editimage',
        visualblocks_default_state: true,
        automatic_uploads: true,
        // images_upload_url: imagesUploadUrl,
        file_picker_types: 'image',
        // file_picker_callback: handleFilePicker,
        images_upload_handler: handleImageUpload,
        // quickbars_insert_toolbar: '',
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
        keep_styles: false,
      }}
    />
  );
};

const areEqual = (prevProps: EditorProps, nextProps: EditorProps) => {
  if (prevProps.artistId === nextProps.artistId) {
    return true; // does not re-render
  }
  return false; // will re-render
};
export default memo(PageEditor, areEqual);
