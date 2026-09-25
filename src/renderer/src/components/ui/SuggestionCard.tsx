import { cn } from '../../lib/cn';
type Props = {
  text: string;
  className?: string;
  onClick?: () => void;
};

export const SuggestionCard = ({ text, onClick }: Props): React.JSX.Element => {
  return (
    <button
      type="button"
      className={cn(
        'w-full rounded-panel border border-line bg-surface px-3 py-3 text-center',
        'text-label font-medium leading-[1.6] text-fg-subtle shadow-none'
      )}
      onClick={onClick}
    >
      {text}
    </button>
  );
};
