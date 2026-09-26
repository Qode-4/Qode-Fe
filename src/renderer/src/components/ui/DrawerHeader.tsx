import type { MouseEventHandler } from 'react';
import type { ProjectsListData } from '../../api/generated/data-contracts';
import type { IconName } from '../icons/iconTypes';
import { IconButton } from './IconButton';
import { Logo } from './Logo';
import { ProjectSwitcher } from './ProjectSwitcher';
import { cn } from '../../lib/cn';

type Props = {
  className?: string;
  projects?: ProjectsListData['data'];
  selectedProjectId?: string;
  onOpenCreateProject?: () => void;
  projectsError?: boolean;
  projectsFetching?: boolean;
  onRetryProjects?: () => void;
  settingsIconName?: IconName;
  settingsAriaLabel?: string;
  settingsDisabled?: boolean;
  onSettingsClick?: MouseEventHandler<HTMLButtonElement>;
};

/**
 * DrawerHeader — 사이드바 머리: 브랜드 + 프로젝트 선택 + 프로젝트 설정.
 * ✅ Use: AppShell 사이드바 맨 위 한 곳.
 * ❌ Don't: 다른 화면 헤더로 재사용하지 않는다(프로젝트 맥락 전용).
 */
export const DrawerHeader = ({
  className,
  projects = [],
  selectedProjectId,
  onOpenCreateProject,
  projectsError = false,
  projectsFetching = false,
  onRetryProjects,
  settingsIconName = 'Setting_line_light',
  settingsAriaLabel = '프로젝트 설정',
  settingsDisabled = false,
  onSettingsClick
}: Props): React.JSX.Element => {
  return (
    <header className={cn('flex w-full flex-col gap-2 px-3 pt-4 pb-3', className)}>
      <div className="flex items-center gap-1.5 px-1 py-1">
        <Logo variant="lockup" size="sm" />
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <ProjectSwitcher
          className="flex-1"
          projects={projects}
          selectedProjectId={selectedProjectId}
          onOpenCreateProject={onOpenCreateProject}
          isError={projectsError}
          isFetching={projectsFetching}
          onRetry={onRetryProjects}
        />
        <IconButton
          variant="outline"
          size="md"
          name={settingsIconName}
          aria-label={settingsAriaLabel}
          disabled={settingsDisabled}
          onClick={onSettingsClick}
        />
      </div>
    </header>
  );
};
