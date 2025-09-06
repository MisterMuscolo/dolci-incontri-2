// Funzione helper per il ritaglio dell'immagine su canvas
// Basato su https://github.com/ricardo-ch/react-easy-crop/blob/main/src/utils.ts

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // Needed for cross-origin images
    image.src = url;
  });

export async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Impossibile ottenere il contesto 2D del canvas.');
  }

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Il canvas è vuoto o il blob non è stato creato.'));
        return;
      }
      // Crea un File dall'oggetto Blob
      const fileName = `cropped-${Date.now()}.jpeg`; // Puoi personalizzare il nome del file
      const croppedFile = new File([blob], fileName, { type: 'image/jpeg' });
      resolve(croppedFile);
    }, 'image/jpeg', 0.95); // Qualità JPEG 95%
  });
}