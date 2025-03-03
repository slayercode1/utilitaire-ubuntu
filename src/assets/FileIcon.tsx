// Types d'extensions et leur couleur associée
const extensionColors: Record<string, string> = {
  // Documents
  pdf: '#FF5733',
  doc: '#2B579A',
  docx: '#2B579A',
  txt: '#7F7F7F',
  
  // Feuilles de calcul
  xls: '#217346',
  xlsx: '#217346',
  csv: '#217346',
  
  // Présentations
  ppt: '#D24726',
  pptx: '#D24726',
  
  // Images
  jpg: '#0066CC',
  jpeg: '#0066CC',
  png: '#0066CC',
  gif: '#6B4B9A',
  
  // Audio/Video
  mp3: '#FF9900',
  mp4: '#FF9900',
  
  // Archives
  zip: '#FFC107',
  rar: '#FFC107',
  
  // Programmation
  jar: '#F44336',
  java: '#F44336',
  py: '#3776AB',
  js: '#F7DF1E',
  html: '#E34F26',
  css: '#1572B6',
  
  // Par défaut
  default: '#9E9E9E'
};

export function FileIcon({ extension }: { extension: string }) {
  // Extraire l'extension sans le point
  const ext = extension.startsWith('.') ? extension.slice(1).toLowerCase() : extension.toLowerCase();
  const color = extensionColors[ext] || extensionColors.default;
  
  return (
    <div 
      className="w-8 h-10 flex items-center justify-center relative"
      style={{ color: 'white' }}
    >
      {/* Icône document de base */}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill={color} 
        className="w-full h-full"
      >
        <path d="M14,2H6C4.9,2,4,2.9,4,4v16c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V8L14,2z M16,18H8v-2h8V18z M16,14H8v-2h8V14z M13,9V3.5 L18.5,9H13z" />
      </svg>
      
      {/* Extension du fichier */}
      <div 
        className="absolute bottom-1 text-center w-full text-[8px] font-bold"
      >
        {ext.toUpperCase()}
      </div>
    </div>
  );
}