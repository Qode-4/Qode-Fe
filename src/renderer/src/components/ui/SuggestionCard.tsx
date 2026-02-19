type Props = {
  text: string;
  className?: string;
  onClick?: () => void;
};

export const SuggestionCard = ({ text, className, onClick }: Props): React.JSX.Element => {
  return (
    <button
      type="button"
      className={[
        'w-full rounded-[12px] border border-zinc-200 bg-white px-3 py-3 text-center',
        'text-ui-14 font-medium leading-[1.6] text-zinc-700 shadow-[0px_4px_18.7px_0px_rgba(0,0,0,0.08)]',
        'transition-colors hover:bg-zinc-50 active:bg-zinc-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className ?? ''
      ].join(' ')}
      onClick={onClick}
    >
      {text}
    </button>
  );
};
