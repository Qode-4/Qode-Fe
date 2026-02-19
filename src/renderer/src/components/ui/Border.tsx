type Props = {
  className?: string;
};

export const Border = ({ className }: Props): React.JSX.Element => {
  return (
    <div aria-hidden="true" className={['h-px w-[196px] bg-zinc-300', className ?? ''].join(' ')} />
  );
};
