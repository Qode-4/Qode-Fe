import { cn } from '../../lib/cn';

type Props = {
  text: string;
  className?: string;
};

/**
 * SuggestionCard — 빈 화면에서 물어볼 수 있는 질문 예시.
 * ✅ Use: 첫 방문·빈 상태에서 무엇을 할 수 있는지 보여줄 때. <ul> 안에 둔다.
 * ❌ Don't: 누를 수 있는 것처럼 보이게 만들지 않는다 — 실제 동작은 옆의 <Button>.
 */
export const SuggestionCard = ({ text, className }: Props): React.JSX.Element => {
  return (
    <li
      className={cn(
        'rounded-panel bg-surface-muted px-3 py-2.5 text-left text-label leading-[1.6] text-fg-subtle',
        className
      )}
    >
      “{text}”
    </li>
  );
};
