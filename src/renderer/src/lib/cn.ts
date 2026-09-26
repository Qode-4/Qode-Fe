import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Quire 토큰(main.css @theme)을 tailwind-merge 에 알려 준다.
 * 등록하지 않으면 `text-micro` 같은 크기 토큰을 색으로 오인해 `text-fg-muted` 와 충돌 처리한다.
 * 토큰을 추가·삭제하면 여기도 함께 고친다. (docs/foundations.md §5·§6·§7)
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['micro', 'caption', 'label', 'body', 'title', 'heading', 'display'],
      radius: ['inline', 'control', 'card', 'panel', 'shell'],
      shadow: ['overlay'],
      ease: ['standard', 'enter', 'exit']
    },
    classGroups: {
      duration: [{ duration: ['base'] }]
    }
  }
});

/** 조건부 className 을 합치고, 같은 속성의 Tailwind 클래스가 겹치면 뒤의 것을 남긴다. */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
