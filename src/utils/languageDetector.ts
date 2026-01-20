// Language detection utility for file extensions
// 言語検出ユーティリティ

export interface LanguageInfo {
  name: string;
  displayName: string;
  extensions: string[];
  icon?: string;
}

const LANGUAGE_MAP: Record<string, LanguageInfo> = {
  javascript: {
    name: 'javascript',
    displayName: 'JavaScript',
    extensions: ['.js', '.jsx', '.mjs', '.cjs'],
    icon: '🟨'
  },
  typescript: {
    name: 'typescript',
    displayName: 'TypeScript',
    extensions: ['.ts', '.tsx'],
    icon: '🔷'
  },
  python: {
    name: 'python',
    displayName: 'Python',
    extensions: ['.py', '.pyw', '.pyx'],
    icon: '🐍'
  },
  rust: {
    name: 'rust',
    displayName: 'Rust',
    extensions: ['.rs'],
    icon: '🦀'
  },
  html: {
    name: 'html',
    displayName: 'HTML',
    extensions: ['.html', '.htm'],
    icon: '🌐'
  },
  css: {
    name: 'css',
    displayName: 'CSS',
    extensions: ['.css', '.scss', '.sass', '.less'],
    icon: '🎨'
  },
  json: {
    name: 'json',
    displayName: 'JSON',
    extensions: ['.json', '.jsonc'],
    icon: '📦'
  },
  markdown: {
    name: 'markdown',
    displayName: 'Markdown',
    extensions: ['.md', '.markdown'],
    icon: '📝'
  },
  xml: {
    name: 'xml',
    displayName: 'XML',
    extensions: ['.xml', '.svg'],
    icon: '📄'
  },
  yaml: {
    name: 'yaml',
    displayName: 'YAML',
    extensions: ['.yaml', '.yml'],
    icon: '⚙️'
  },
  toml: {
    name: 'toml',
    displayName: 'TOML',
    extensions: ['.toml'],
    icon: '⚙️'
  },
  shell: {
    name: 'shell',
    displayName: 'Shell',
    extensions: ['.sh', '.bash', '.zsh'],
    icon: '💻'
  },
  bat: {
    name: 'batch',
    displayName: 'Batch',
    extensions: ['.bat', '.cmd'],
    icon: '💻'
  },
  powershell: {
    name: 'powershell',
    displayName: 'PowerShell',
    extensions: ['.ps1', '.psm1', '.psd1'],
    icon: '💻'
  },
  java: {
    name: 'java',
    displayName: 'Java',
    extensions: ['.java'],
    icon: '☕'
  },
  cpp: {
    name: 'cpp',
    displayName: 'C++',
    extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.hxx', '.h'],
    icon: '⚙️'
  },
  c: {
    name: 'c',
    displayName: 'C',
    extensions: ['.c'],
    icon: '⚙️'
  },
  go: {
    name: 'go',
    displayName: 'Go',
    extensions: ['.go'],
    icon: '🐹'
  },
  php: {
    name: 'php',
    displayName: 'PHP',
    extensions: ['.php'],
    icon: '🐘'
  },
  ruby: {
    name: 'ruby',
    displayName: 'Ruby',
    extensions: ['.rb'],
    icon: '💎'
  },
  swift: {
    name: 'swift',
    displayName: 'Swift',
    extensions: ['.swift'],
    icon: '🦅'
  },
  kotlin: {
    name: 'kotlin',
    displayName: 'Kotlin',
    extensions: ['.kt', '.kts'],
    icon: '🎯'
  },
  sql: {
    name: 'sql',
    displayName: 'SQL',
    extensions: ['.sql'],
    icon: '🗄️'
  },
  plaintext: {
    name: 'plaintext',
    displayName: 'Plain Text',
    extensions: ['.txt'],
    icon: '📄'
  }
};

/**
 * Detects the programming language from a file path
 * ファイルパスからプログラミング言語を検出
 */
export function detectLanguage(filePath: string): LanguageInfo {
  const fileName = filePath.toLowerCase();
  
  // Extract extension
  const lastDot = fileName.lastIndexOf('.');
  const extension = lastDot !== -1 ? fileName.substring(lastDot) : '';
  
  // Find matching language
  for (const lang of Object.values(LANGUAGE_MAP)) {
    if (lang.extensions.includes(extension)) {
      return lang;
    }
  }
  
  // Default to plain text
  return LANGUAGE_MAP.plaintext;
}

/**
 * Gets language display name from file path
 * ファイルパスから言語表示名を取得
 */
export function getLanguageDisplayName(filePath: string): string {
  return detectLanguage(filePath).displayName;
}

/**
 * Gets language icon from file path
 * ファイルパスから言語アイコンを取得
 */
export function getLanguageIcon(filePath: string): string {
  return detectLanguage(filePath).icon || '📄';
}
