import { useMemo, useState } from 'react';
import { usePostProjects } from '../../api/auth/useProjectsAPI';
import { handleApiError } from '../../api/axios';
import { navigate } from '../../lib/hashRouter';
import { Button } from '../ui/Button';
import { InlineAlert } from '../ui/InlineAlert';
import { OverlayModal } from '../ui/OverlayModal';

type Props = {
  open: boolean;
  onClose: () => void;
};

export const CreateProjectModal = ({ open, onClose }: Props): React.JSX.Element | null => {
  const create = usePostProjects();
  const [name, setName] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [touched, setTouched] = useState(false);

  const nameError = useMemo(() => {
    if (!touched) return '';
    if (!name.trim()) return '프로젝트 이름을 입력해주세요.';
    return '';
  }, [name, touched]);

  const closeAndReset = (): void => {
    setName('');
    setRepositoryUrl('');
    setTouched(false);
    onClose();
  };

  return (
    <OverlayModal open={open} onClose={closeAndReset} title="새 프로젝트">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (!name.trim()) return;
          create.mutate(
            {
              name: name.trim(),
              description: repositoryUrl.trim() ? repositoryUrl.trim() : undefined
            },
            {
              onSuccess: (data) => {
                closeAndReset();
                navigate(`/projects/${data.id}`);
              }
            }
          );
        }}
      >
        <div className="mt-4 space-y-3">
          <label className="block" htmlFor="create-project-name">
            <span className="mb-1 block text-xs font-medium text-text-soft">이름</span>
            <input
              id="create-project-name"
              className={[
                'h-10 w-full rounded-md border bg-surface px-3 text-base text-text-base outline-none',
                nameError
                  ? 'border-danger-line focus:border-danger'
                  : 'border-[#737983] focus:border-primary'
              ].join(' ')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="프로젝트 이름"
              autoFocus
            />
            {nameError ? <span className="mt-1 block text-xs text-danger">{nameError}</span> : null}
          </label>

          <label className="block" htmlFor="create-project-repository">
            <span className="mb-1 block text-xs font-medium text-text-soft">Git Repository</span>
            <input
              id="create-project-repository"
              className="h-10 w-full rounded-md border border-[#737983] bg-surface px-3 text-base text-text-base outline-none focus:border-primary"
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              placeholder="url"
            />
          </label>
        </div>

        {create.isError ? (
          <div className="mt-3">
            <InlineAlert tone="danger" title="생성 실패">
              {handleApiError(create.error).message}
            </InlineAlert>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={closeAndReset}>
            취소
          </Button>
          <Button type="submit" size="sm" isLoading={create.isPending}>
            생성
          </Button>
        </div>
      </form>
    </OverlayModal>
  );
};
