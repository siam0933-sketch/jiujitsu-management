import imageCompression from 'browser-image-compression';

/**
 * Compress an image file using browser-image-compression
 * @param file The original image file
 * @param maxSizeMB Keep the file size under this limit (in MB)
 * @param maxWidthOrHeight Resize the image if it exceeds this dimension
 * @returns The compressed image file or original if compression fails
 */
export async function compressImage(
    file: File,
    maxSizeMB: number = 1,
    maxWidthOrHeight: number = 1024
): Promise<File> {
    const options = {
        maxSizeMB,
        maxWidthOrHeight,
        useWebWorker: true,
        // you can also set an initialQuality if desired, default is usually around 0.8
    };

    try {
        const compressedFile = await imageCompression(file, options);
        // Returns a File object, but imageCompression sometimes returns a Blob with name
        // Depending on version, we might need to cast or reconstruct the File
        return new File([compressedFile], file.name, {
            type: compressedFile.type || file.type,
            lastModified: Date.now(),
        });
    } catch (error) {
        console.error('Image compression failed:', error);
        // If compression fails, we fallback to uploading the original to not break the flow
        return file;
    }
}
