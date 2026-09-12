export const FONTS = {
  regular: 'Obviously-Regular',
  medium: 'Obviously-Medium',
  semibold: 'Obviously-SemiBold',
  bold: 'Obviously-Bold',
  black: 'Obviously-Black',
  italic: 'Obviously-RegularItalic',
} as const;

export type FontType = keyof typeof FONTS;
