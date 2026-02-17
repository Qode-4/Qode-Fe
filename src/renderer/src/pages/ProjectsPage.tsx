import { Button } from '../components/ui/Button';

const defaultPrompts = [
  '이번주 새로운 업데이트 내용을 요약해줘.',
  '이 기능에 대해 기획자가 고려해야 할 부분을 정리해줘.',
  '이 기능 구현 로직이 궁금해.',
  '새로운 기능을 만들 건데 기존 기능에 어떤 영향을 미칠지 정리해줘.',
  '이 케이스에 충돌이 일어난 것 같아. 확인해줘.'
];

type Props = {
  projectCount: number;
  onOpenCreateProject: () => void;
};

export const ProjectsPage = ({ projectCount, onOpenCreateProject }: Props): React.JSX.Element => {
  return (
    <div className="min-h-full rounded-2xl border border-line-soft bg-[#f7f8fb] p-5">
      <section className="flex min-h-[640px] flex-col justify-center rounded-xl border border-line bg-[#f3f5fa] p-8 text-center">
        <div className="mx-auto w-full max-w-xl">
          <h1 className="text-5xl font-extrabold tracking-tight text-text-base">
            프로젝트를 추가하면
          </h1>
          <p className="mt-2 text-[38px] font-bold tracking-tight text-text-base">
            Git 저장소를 읽고, 코드에 대해 질문할 수 있어요.
          </p>

          <div className="mt-8 space-y-2">
            {defaultPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="block w-full rounded-md border border-line-soft bg-[#e8ebf2] px-3 py-2 text-left text-xs text-text-subtle"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="mt-8">
            <Button size="md" onClick={onOpenCreateProject}>
              + 새 프로젝트 생성
            </Button>
          </div>

          <p className="mt-6 text-xs text-text-soft">현재 프로젝트 수: {projectCount}</p>
        </div>
      </section>
    </div>
  );
};
