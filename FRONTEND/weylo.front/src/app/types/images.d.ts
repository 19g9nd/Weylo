// Type declarations for static image imports used with next/image
declare module '*.png' {
  const content: import('next/dist/shared/lib/image-external').StaticImageData;
  export default content;
}

declare module '*.jpg' {
  const content: import('next/dist/shared/lib/image-external').StaticImageData;
  export default content;
}

declare module '*.jpeg' {
  const content: import('next/dist/shared/lib/image-external').StaticImageData;
  export default content;
}

declare module '*.webp' {
  const content: import('next/dist/shared/lib/image-external').StaticImageData;
  export default content;
}

declare module '*.avif' {
  const content: import('next/dist/shared/lib/image-external').StaticImageData;
  export default content;
}

declare module '*.gif' {
  const content: import('next/dist/shared/lib/image-external').StaticImageData;
  export default content;
}
